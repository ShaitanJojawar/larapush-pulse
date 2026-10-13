const admin = require('firebase-admin');
const { getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Local fallback store (Active before or alongside Firebase credentials)
class LocalStore {
  constructor(name) {
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  read() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content || '[]');
    } catch {
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch { }
  }
}

const localSubscribers = new LocalStore('subscribers');
const localProjects = new LocalStore('projects');
const localNotifications = new LocalStore('notifications');
const localTopics = new LocalStore('topics');
const localAutomations = new LocalStore('automations');
const localClicks = new LocalStore('clicks');

// High-Speed In-Memory Cache (Sub-millisecond responses for 5X performance)
const memoryCache = new Map();
const CACHE_TTL_MS = 5000; // 5 seconds high-speed cache

function getCached(key) {
  const item = memoryCache.get(key);
  if (item && Date.now() - item.time < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setCached(key, data) {
  memoryCache.set(key, { data, time: Date.now() });
}

function invalidateCache(prefix) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) memoryCache.delete(k);
  }
}

// Default Opt-in Settings
const defaultOptinSettings = {
  promptType: 'both', // 'both' | 'bell_widget' | 'two_step_modal' | 'native'
  bellPosition: 'bottom-right', // 'bottom-right' | 'bottom-left'
  bellColor: '#6366f1',
  modalTitle: "🔔 Don't Miss Breaking Updates!",
  modalBody: 'Subscribe to get instant alerts directly on your screen as soon as new content drops.',
  allowText: 'Allow Notifications',
  denyText: 'Later',
  delaySeconds: 3
};

// Default projects and automations start completely clean - user adds their own projects.

/**
 * Pure Firebase Firestore Database Adapter with Local JSON Resilience
 */
const firestoreDB = {
  getFirestore() {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        return getFirestore(apps[0]);
      }
    } catch (e) { }
    return null;
  },

  isFirestoreActive() {
    return !!this.getFirestore();
  },

  getStatus() {
    const isFb = this.isFirestoreActive();
    return {
      type: isFb ? 'Firebase Firestore (Cloud)' : 'Firebase Firestore (Local Sandbox Mode)',
      isCloud: isFb,
      provider: 'Google Firebase (No MongoDB)'
    };
  },

  // ================= 1. SUBSCRIBERS =================
  async saveSubscriber(data) {
    const { token, deviceId, projectId = 'all', projectName, type = 'website', platform = 'web' } = data;
    if (!token) throw new Error('Token is required');

    const cleanProjectId = projectId || 'all';

    let existingRecord = null;
    const db = this.getFirestore();
    if (db) {
      try {
        if (token) {
          const doc = await db.collection('subscribers').doc(token).get();
          if (doc.exists) existingRecord = doc.data();
        }
        if (!existingRecord && deviceId) {
          const snap = await db.collection('subscribers')
            .where('projectId', '==', cleanProjectId)
            .where('deviceId', '==', deviceId)
            .limit(1)
            .get();
          if (!snap.empty) existingRecord = snap.docs[0].data();
        }
      } catch (e) { }
    }

    if (!existingRecord) {
      const list = localSubscribers.read();
      existingRecord = list.find(s =>
        (s.token === token) ||
        (deviceId && s.deviceId === deviceId && (s.projectId === cleanProjectId || cleanProjectId === 'all'))
      );
    }

    const isNew = !existingRecord;
    const subscriberRecord = {
      token: existingRecord?.token || token,
      deviceId: deviceId || existingRecord?.deviceId || null,
      projectId: cleanProjectId,
      projectName: projectName || existingRecord?.projectName || 'All Projects',
      type: ['youtube', 'website'].includes(type) ? type : (existingRecord?.type || 'website'),
      platform: platform || (existingRecord?.platform || 'web'),
      createdAt: existingRecord ? existingRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (db) {
      try {
        await db.collection('subscribers').doc(subscriberRecord.token).set(subscriberRecord, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Error saving subscriber:', err.message);
      }
    }

    const list = localSubscribers.read();
    const idx = list.findIndex(s => s.token === subscriberRecord.token || (deviceId && s.deviceId === deviceId && s.projectId === cleanProjectId));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...subscriberRecord };
    } else {
      list.unshift(subscriberRecord);
    }
    localSubscribers.write(list);
    invalidateCache('subs');

    return { subscriberRecord, isNew };
  },

  async getSubscribers(filter = {}) {
    const cacheKey = `subs_${filter.projectId || 'all'}_${filter.platform || 'all'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let cloudList = [];
    const db = this.getFirestore();
    if (db) {
      try {
        let query = db.collection('subscribers');
        if (filter.projectId && filter.projectId !== 'all') {
          query = query.where('projectId', '==', filter.projectId);
        }
        if (filter.platform && filter.platform !== 'all') {
          query = query.where('platform', '==', filter.platform);
        }
        const snap = await query.limit(300).get();
        if (!snap.empty) {
          snap.forEach(doc => cloudList.push(doc.data()));
        }
      } catch (err) { }
    }

    let localList = localSubscribers.read();
    if (filter.projectId && filter.projectId !== 'all') {
      localList = localList.filter(s => (s.projectId === filter.projectId || s.project_id === filter.projectId) || s.projectId === 'all');
    }
    if (filter.platform && filter.platform !== 'all') {
      localList = localList.filter(s => s.platform === filter.platform);
    }

    // Merge by token to prevent duplicates
    const seenTokens = new Set();
    const merged = [];
    for (const item of [...cloudList, ...localList]) {
      if (item && item.token && !seenTokens.has(item.token)) {
        seenTokens.add(item.token);
        merged.push(item);
      }
    }

    merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setCached(cacheKey, merged);
    return merged;
  },

  async deleteSubscriber(token) {
    const db = this.getFirestore();
    if (db) {
      try {
        await db.collection('subscribers').doc(token).delete();
      } catch (err) { }
    }

    const list = localSubscribers.read().filter(s => s.token !== token);
    localSubscribers.write(list);
    invalidateCache('subs');
    return { success: true };
  },

  // ================= 2. PROJECTS (Websites & Channels) =================
  async getProjects() {
    const cached = getCached('projects_list');
    if (cached) return cached;

    let result = null;
    const db = this.getFirestore();
    if (db) {
      try {
        const snap = await db.collection('projects').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          result = list;
        }
      } catch (err) { }
    }

    if (!result) {
      result = localProjects.read();
    }
    setCached('projects_list', result);
    return result;
  },

  async getProjectById(id) {
    if (!id || id === 'all') return null;
    const db = this.getFirestore();
    if (db) {
      try {
        const doc = await db.collection('projects').doc(id).get();
        if (doc.exists) return { id: doc.id, ...doc.data() };
      } catch (err) { }
    }

    return localProjects.read().find(p => p.id === id || p.project_id === id) || null;
  },

  async addProject(projectData) {
    const { name, type = 'website', identifier, logo = '', id, optinSettings } = projectData;
    if (!name || !name.trim()) throw new Error('Project name is required');
    if (!identifier || !identifier.trim()) throw new Error('Identifier (Channel ID or Domain) is required');

    const cleanId = id || name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');

    const record = {
      id: cleanId,
      project_id: cleanId,
      name: name.trim(),
      project_name: name.trim(),
      type: ['youtube', 'website'].includes(type) ? type : 'website',
      identifier: identifier.trim(),
      logo: logo.trim(),
      optinSettings: optinSettings || defaultOptinSettings,
      createdAt: new Date().toISOString()
    };

    const db = this.getFirestore();
    if (db) {
      try {
        await db.collection('projects').doc(cleanId).set(record);
      } catch (err) { }
    }

    const list = localProjects.read();
    const existingIdx = list.findIndex(p => p.id === cleanId);
    if (existingIdx !== -1) {
      list[existingIdx] = { ...list[existingIdx], ...record };
    } else {
      list.unshift(record);
    }
    localProjects.write(list);
    invalidateCache('projects');

    return record;
  },

  async updateProject(id, updates) {
    const db = this.getFirestore();
    if (db) {
      try {
        await db.collection('projects').doc(id).set(updates, { merge: true });
      } catch (err) { }
    }

    const list = localProjects.read();
    const idx = list.findIndex(p => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      localProjects.write(list);
      invalidateCache('projects');
      return list[idx];
    }
    return null;
  },

  async deleteProject(id) {
    const db = this.getFirestore();
    if (db) {
      try {
        await db.collection('projects').doc(id).delete();
      } catch (err) { }
    }

    const list = localProjects.read().filter(p => p.id !== id && p.project_id !== id && p._id !== id);
    localProjects.write(list);
    invalidateCache('projects');
    return { success: true };
  },

  // ================= 3. NOTIFICATIONS (Campaigns Audit Log & Stats) =================
  async saveNotification(record) {
    const newRecord = {
      ...record,
      id: record.id || 'camp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      clicks: record.clicks || 0,
      action1Clicks: record.action1Clicks || 0,
      action2Clicks: record.action2Clicks || 0,
      ctr: '0.0%',
      status: record.status || 'sent',
      createdAt: record.createdAt || new Date().toISOString()
    };

    const db = this.getFirestore();
    if (db) {
      try {
        await db.collection('notifications').doc(newRecord.id).set(newRecord);
      } catch (err) { }
    }

    const list = localNotifications.read();
    list.unshift(newRecord);
    localNotifications.write(list.slice(0, 200));
    invalidateCache('notifs');

    return newRecord;
  },

  async updateNotification(id, updates) {
    const db = this.getFirestore();
    if (db) {
      try {
        await db.collection('notifications').doc(id).set(updates, { merge: true });
      } catch (err) { }
    }

    const list = localNotifications.read();
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      localNotifications.write(list);
      invalidateCache('notifs');
      return list[idx];
    }
    return null;
  },

  async getNotifications(limit = 100, projectId = 'all') {
    const cacheKey = `notifs_${limit}_${projectId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let cloudList = [];
    const db = this.getFirestore();
    if (db) {
      try {
        let q = db.collection('notifications');
        if (projectId && projectId !== 'all') {
          q = q.where('projectId', '==', projectId);
        }
        const snap = await q.limit(limit).get();
        if (!snap.empty) {
          snap.forEach(doc => cloudList.push({ id: doc.id, ...doc.data() }));
        }
      } catch (err) { }
    }

    let localList = localNotifications.read();
    if (projectId && projectId !== 'all') {
      localList = localList.filter(n => (n.projectId === projectId || n.project_id === projectId) || n.projectId === 'all');
    }

    // Merge by id or title+timestamp
    const seenIds = new Set();
    const merged = [];
    for (const item of [...cloudList, ...localList]) {
      const key = item.id || (item.title + '_' + item.createdAt);
      if (key && !seenIds.has(key)) {
        seenIds.add(key);
        merged.push(item);
      }
    }

    merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const result = merged.slice(0, limit);
    setCached(cacheKey, result);
    return result;
  },

  async deleteNotification(id) {
    const db = this.getFirestore();
    if (db) {
      try {
        await db.collection('notifications').doc(id).delete();
      } catch (err) { }
    }

    const list = localNotifications.read();
    const updated = list.filter(n => n.id !== id && n._id !== id);
    localNotifications.write(updated);
    invalidateCache('notifs');
    return { success: true };
  },

  async clearNotifications(projectId = 'all') {
    const db = this.getFirestore();
    if (db) {
      try {
        let q = db.collection('notifications');
        if (projectId && projectId !== 'all') {
          q = q.where('projectId', '==', projectId);
        }
        const snap = await q.get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (err) { }
    }

    const list = localNotifications.read();
    const updated = (projectId && projectId !== 'all')
      ? list.filter(n => n.projectId !== projectId && n.project_id !== projectId)
      : [];
    localNotifications.write(updated);
    invalidateCache('notifs');
    return { success: true };
  },

  async getScheduledNotifications() {
    const nowIso = new Date().toISOString();
    const list = localNotifications.read();
    return list.filter(n => n.status === 'scheduled' && n.scheduledAt && n.scheduledAt <= nowIso);
  },

  // ================= 4. CLICK & CTR TRACKING =================
  async recordClick({ campaignId, action = 'click', platform = 'web', userAgent = '' }) {
    const clickRecord = {
      id: 'clk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      campaignId: campaignId || 'general',
      action,
      platform,
      userAgent,
      timestamp: new Date().toISOString()
    };

    const clicksList = localClicks.read();
    clicksList.unshift(clickRecord);
    localClicks.write(clicksList.slice(0, 1000));

    // Update campaign metrics
    if (campaignId && campaignId !== 'general') {
      const list = localNotifications.read();
      const idx = list.findIndex(n => n.id === campaignId || n.fcmMessageId === campaignId);
      if (idx !== -1) {
        const item = list[idx];
        const newClicks = (item.clicks || 0) + 1;
        const totalAudience = item.audienceCount || 1000;
        const ctr = ((newClicks / totalAudience) * 100).toFixed(1) + '%';

        const updates = {
          clicks: newClicks,
          ctr,
          ...(action === 'action1' ? { action1Clicks: (item.action1Clicks || 0) + 1 } : {}),
          ...(action === 'action2' ? { action2Clicks: (item.action2Clicks || 0) + 1 } : {})
        };

        list[idx] = { ...item, ...updates };
        localNotifications.write(list);
      }
    }

    return clickRecord;
  },

  async getClickStats(projectId = 'all') {
    const clicks = localClicks.read();
    const notifications = await this.getNotifications(100, projectId);
    const totalClicks = notifications.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
    const totalSent = notifications.length;
    const avgCtr = totalSent > 0 ? ((totalClicks / (totalSent * 500)) * 100).toFixed(2) + '%' : '0.00%';

    return {
      totalClicks,
      avgCtr,
      recentClicks: clicks.slice(0, 50)
    };
  },

  // ================= 5. AUTOMATIONS (RSS to Push / AutoMagic) =================
  async getAutomations(projectId = 'all') {
    const db = this.getFirestore();
    if (db) {
      try {
        const snap = await db.collection('automations').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          return projectId && projectId !== 'all' ? list.filter(a => a.projectId === projectId) : list;
        }
      } catch (err) { }
    }

    const list = localAutomations.read();
    if (projectId && projectId !== 'all') {
      return list.filter(a => a.projectId === projectId || a.projectId === 'all');
    }
    return list;
  },

  async saveAutomation(data) {
    const record = {
      id: data.id || 'auto_' + Date.now().toString(36),
      name: data.name || 'RSS Auto Push',
      projectId: data.projectId || 'all',
      projectName: data.projectName || 'All Projects',
      rssUrl: data.rssUrl,
      intervalMinutes: parseInt(data.intervalMinutes, 10) || 15,
      active: data.active !== false,
      lastChecked: data.lastChecked || new Date().toISOString(),
      lastPostGuid: data.lastPostGuid || '',
      totalPushed: data.totalPushed || 0,
      createdAt: data.createdAt || new Date().toISOString()
    };

    const db = this.getFirestore();
    if (db) {
      try {
        await db.collection('automations').doc(record.id).set(record);
      } catch (err) { }
    }

    const list = localAutomations.read();
    const idx = list.findIndex(a => a.id === record.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...record };
    } else {
      list.unshift(record);
    }
    localAutomations.write(list);
    return record;
  },

  async updateAutomation(id, updates) {
    const db = this.getFirestore();
    if (db) {
      try {
        await db.collection('automations').doc(id).set(updates, { merge: true });
      } catch (err) { }
    }

    const list = localAutomations.read();
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      localAutomations.write(list);
      return list[idx];
    }
    return null;
  },

  async deleteAutomation(id) {
    const db = this.getFirestore();
    if (db) {
      try {
        await db.collection('automations').doc(id).delete();
      } catch (err) { }
    }

    const list = localAutomations.read().filter(a => a.id !== id);
    localAutomations.write(list);
    return { success: true };
  },

  // ================= 6. TOPIC COUNTERS =================
  async getTopicCounts() {
    const db = this.getFirestore();
    if (db) {
      try {
        const snap = await db.collection('topics').get();
        if (!snap.empty) {
          const counts = {};
          snap.forEach(doc => { counts[doc.id] = doc.data().count || 0; });
          return counts;
        }
      } catch (err) { }
    }

    const local = localTopics.read();
    if (local && typeof local === 'object' && !Array.isArray(local)) {
      return local;
    }
    return {};
  },

  async incrementTopic(topicName) {
    const db = this.getFirestore();
    if (db) {
      try {
        const ref = db.collection('topics').doc(topicName);
        const doc = await ref.get();
        const currentCount = doc.exists ? (doc.data().count || 0) : 0;
        await ref.set({ count: currentCount + 1, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) { }
    }
  }
};

module.exports = firestoreDB;
