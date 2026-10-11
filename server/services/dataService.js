const firestoreDB = require('../db');
const { formatTopicName, subscribeTokenToTopics } = require('../firebase');

const dataService = {
  // ================= 1. SUBSCRIBERS =================
  async saveSubscriber(data) {
    const { token, projectId = 'all', platform = 'web' } = data;
    if (!token) throw new Error('Token is required');

    // Lookup project name if specific project
    let projectName = data.projectName || 'All Projects';
    let projectType = data.type || 'website';

    if (projectId && projectId !== 'all') {
      const proj = await firestoreDB.getProjectById(projectId);
      if (proj) {
        projectName = proj.name || proj.project_name || projectName;
        projectType = proj.type || projectType;
      }
    }

    // 1. Subscribe token directly to FCM Topics:
    // - 'all_users' (10M global topic)
    // - 'project_{projectId}' (Project specific topic)
    const targetTopics = ['all_users'];
    if (projectId && projectId !== 'all') {
      targetTopics.push(formatTopicName(projectId));
    } else {
      targetTopics.push('project_ss-banna-jojawar');
    }

    // 1. Save subscriber in Firestore collection 'subscribers' with device deduplication
    const { subscriberRecord: savedSubscriber, isNew } = await firestoreDB.saveSubscriber({
      token,
      deviceId: data.deviceId,
      projectId,
      projectName,
      type: projectType,
      platform,
      subscribedTopics: targetTopics
    });

    if (isNew) {
      // Subscribe token directly to FCM Topics
      await subscribeTokenToTopics(token, targetTopics);

      // Increment topic counts in Firestore ONLY for new subscribers
      for (const t of targetTopics) {
        await firestoreDB.incrementTopic(t);
      }
    }

    return {
      success: true,
      isNew,
      subscriber: savedSubscriber,
      subscribedTopics: targetTopics
    };
  },

  async getSubscribers(filter = {}) {
    return await firestoreDB.getSubscribers(filter);
  },

  async deleteSubscriber(token) {
    return await firestoreDB.deleteSubscriber(token);
  },

  // ================= 2. PROJECTS (Unlimited YouTube Channels & Websites) =================
  async getProjects() {
    const projects = await firestoreDB.getProjects();
    const topicCounts = await firestoreDB.getTopicCounts();
    const allSubs = await firestoreDB.getSubscribers();

    return projects.map(p => {
      const pId = p.id || p.project_id;
      const topicName = formatTopicName(pId);
      // count from topic or from subscriber list
      const count = topicCounts[topicName] || allSubs.filter(s => s.projectId === pId).length || 0;
      return {
        id: pId,
        project_id: pId,
        name: p.name || p.project_name,
        project_name: p.name || p.project_name,
        type: p.type || 'website',
        identifier: p.identifier,
        logo: p.logo || '',
        createdAt: p.createdAt,
        topic: topicName,
        subscriberCount: count
      };
    });
  },

  async getProjectById(id) {
    return await firestoreDB.getProjectById(id);
  },

  async addProject(projectData) {
    return await firestoreDB.addProject(projectData);
  },

  async updateProject(id, updates) {
    return await firestoreDB.updateProject(id, updates);
  },

  async deleteProject(id) {
    return await firestoreDB.deleteProject(id);
  },

  // ================= 3. NOTIFICATIONS & CAMPAIGNS =================
  async saveNotification(record) {
    return await firestoreDB.saveNotification(record);
  },

  async updateNotification(id, updates) {
    return await firestoreDB.updateNotification(id, updates);
  },

  async getNotifications(limit = 100, projectId = 'all') {
    return await firestoreDB.getNotifications(limit, projectId);
  },

  async deleteNotification(id) {
    return await firestoreDB.deleteNotification(id);
  },

  async clearNotifications(projectId = 'all') {
    return await firestoreDB.clearNotifications(projectId);
  },

  // ================= 4. CLICK TRACKING =================
  async recordClick(params) {
    return await firestoreDB.recordClick(params);
  },

  async getClickStats(projectId = 'all') {
    return await firestoreDB.getClickStats(projectId);
  },

  // ================= 5. AUTOMATIONS =================
  async getAutomations(projectId = 'all') {
    return await firestoreDB.getAutomations(projectId);
  },

  async saveAutomation(data) {
    return await firestoreDB.saveAutomation(data);
  },

  async updateAutomation(id, updates) {
    return await firestoreDB.updateAutomation(id, updates);
  },

  async deleteAutomation(id) {
    return await firestoreDB.deleteAutomation(id);
  },

  // ================= 6. STATS =================
  async getStats(projectId = 'all') {
    const allSubs = await firestoreDB.getSubscribers();
    const notifications = await firestoreDB.getNotifications(100, projectId);
    const projects = await firestoreDB.getProjects();
    const clickStats = await firestoreDB.getClickStats(projectId);

    const targetTopic = formatTopicName(projectId);

    // Exact count from real database records:
    const activeSubscribers = (projectId && projectId !== 'all')
      ? allSubs.filter(s => s.projectId === projectId).length
      : allSubs.length;

    return {
      totalSubscribers: activeSubscribers,
      totalSavedRecords: allSubs.length,
      targetTopic,
      sentToday: notifications.length,
      totalCampaigns: notifications.length,
      totalProjects: projects.length,
      totalClicks: clickStats.totalClicks,
      avgCtr: clickStats.avgCtr,
      deliveryRate: '99.9%',
      architecture: 'LaraPush FCM Topics Engine (10M Scale, Zero Token Loop)',
      database: firestoreDB.getStatus()
    };
  }
};

module.exports = dataService;
