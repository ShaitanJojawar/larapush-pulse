const admin = require('firebase-admin');
const { initializeApp, getApps, deleteApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

let firebaseApp = null;
let firestoreDb = null;
let initError = null;

function loadCredentials() {
  // 1. Check server/serviceAccountKey.json
  const localKeyPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(localKeyPath)) {
    try {
      const content = fs.readFileSync(localKeyPath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.warn('⚠️ Error parsing serviceAccountKey.json:', e.message);
    }
  }

  // 2. Check root serviceAccountKey.json
  const rootKeyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  if (fs.existsSync(rootKeyPath)) {
    try {
      const content = fs.readFileSync(rootKeyPath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.warn('⚠️ Error parsing root serviceAccountKey.json:', e.message);
    }
  }

  // 3. Check FIREBASE_SERVICE_ACCOUNT env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      if (raw.startsWith('{')) {
        return JSON.parse(raw);
      }
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (e) {
      console.warn('⚠️ Error parsing FIREBASE_SERVICE_ACCOUNT env var:', e.message);
    }
  }

  // 4. Check individual env vars
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }

  return null;
}

function initFirebase(customCreds = null) {
  try {
    const existingApps = getApps();

    if (existingApps.length > 0) {
      if (customCreds) {
        deleteApp(existingApps[0]);
      } else {
        firebaseApp = existingApps[0];
        try { firestoreDb = getFirestore(firebaseApp); } catch (e) {}
        const credProjectId = firebaseApp.options?.credential?.projectId;
        return { success: true, app: firebaseApp, projectId: credProjectId || 'push-saas' };
      }
    }

    const creds = customCreds || loadCredentials();

    if (!creds) {
      initError = 'No Firebase serviceAccountKey provided yet. Add it via Dashboard Settings or .env';
      console.log('ℹ️  Firebase Admin SDK awaiting configuration. Running in 10M Topics Simulation Mode.');
      return { success: false, error: initError };
    }

    firebaseApp = initializeApp({
      credential: cert(creds)
    });

    try {
      firestoreDb = getFirestore(firebaseApp);
    } catch (fe) {
      console.log('Firestore not initialized or optional:', fe.message);
    }

    initError = null;
    const projectId = creds.project_id || creds.projectId || 'push-saas';
    console.log(`✅ Firebase Admin SDK (FCM Topics Engine) initialized for project: ${projectId}`);
    return { success: true, app: firebaseApp, projectId };
  } catch (err) {
    initError = err.message;
    console.error('❌ Failed to initialize Firebase Admin SDK:', err.message);
    return { success: false, error: err.message };
  }
}

// Auto-run on startup
initFirebase();

const getFirebaseStatus = () => {
  const existingApps = getApps();
  const isConfigured = existingApps.length > 0;
  return {
    isConfigured,
    projectId: isConfigured ? (existingApps[0].options?.credential?.projectId || 'push-saas') : null,
    hasFirestore: !!firestoreDb,
    engine: 'FCM Topics Architecture (10M Scalable, Zero Token Loop)',
    error: isConfigured ? null : initError
  };
};

// Clean topic name conforming to FCM rules: [a-zA-Z0-9-_.~%]+
function formatTopicName(projectId) {
  if (!projectId || projectId === 'all') return 'all_users';
  const sanitized = projectId.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
  return `project_${sanitized}`;
}

/**
 * Subscribe token to FCM Topics:
 * - 'all_users' (Global topic for 10M scale broadcast)
 * - 'project_{projectId}' (Project specific topic for YouTube or Website)
 * - 'platform_{platform}' (Optional platform topic: platform_web, platform_android, platform_ios)
 */
async function subscribeTokenToTopics(token, topicList) {
  if (!token || !topicList || topicList.length === 0) return { success: false };

  const existingApps = admin.getApps ? admin.getApps() : (admin.apps || []);
  const isConfigured = existingApps.length > 0;

  if (!isConfigured) {
    console.log(`[SIMULATION MODE] Subscribed token to FCM Topics: [${topicList.join(', ')}]`);
    return {
      success: true,
      mode: 'simulated',
      subscribedTopics: topicList
    };
  }

  const messaging = getMessaging(existingApps[0]);
  const results = [];

  for (const topic of topicList) {
    try {
      const response = await messaging.subscribeToTopic([token], topic);
      results.push({ topic, successCount: response.successCount, failureCount: response.failureCount });
      console.log(`[FCM Topic Subscribed] Token subscribed to topic "${topic}" (Success: ${response.successCount})`);
    } catch (err) {
      console.warn(`[FCM Topic Error] Failed to subscribe to topic "${topic}":`, err.message);
      results.push({ topic, error: err.message });
    }
  }

  return {
    success: true,
    mode: 'fcm_topic',
    results
  };
}

/**
 * CRITICAL 10M SCALE BROADCAST:
 * Send push notification via FCM Topic in A SINGLE API CALL.
 * No individual token array, no loop, no database bottleneck!
 */
async function sendTopicNotification(topic, payload, condition = null) {
  const {
    title,
    body,
    imageUrl,
    iconUrl,
    badgeUrl,
    clickUrl,
    notificationType = 'video',
    campaignId = '',
    action1Title = '',
    action1Url = '',
    action2Title = '',
    action2Url = ''
  } = payload;
  const existingApps = admin.getApps ? admin.getApps() : (admin.apps || []);
  const isConfigured = existingApps.length > 0;

  const actions = [];
  if (action1Title && action1Title.trim()) {
    actions.push({ action: 'action1', title: action1Title.trim() });
  }
  if (action2Title && action2Title.trim()) {
    actions.push({ action: 'action2', title: action2Title.trim() });
  }

  // Build FCM message targeting topic or condition
  const message = {
    notification: {
      title: title || 'Push Notification',
      body: body || '',
      ...(imageUrl ? { imageUrl } : {})
    },
    data: {
      title: title || '',
      body: body || '',
      imageUrl: imageUrl || '',
      clickUrl: clickUrl || '',
      campaignId: campaignId || '',
      action1Title: action1Title || '',
      action1Url: action1Url || '',
      action2Title: action2Title || '',
      action2Url: action2Url || '',
      topic: topic || 'all_users',
      notificationType: notificationType || 'video',
      timestamp: String(Date.now())
    },
    webpush: {
      notification: {
        title: title || '',
        body: body || '',
        icon: iconUrl || '/icon-192.png',
        badge: badgeUrl || '/badge-72.png',
        ...(imageUrl ? { image: imageUrl } : {}),
        ...(actions.length > 0 ? { actions } : {}),
        data: {
          clickUrl: clickUrl || '',
          campaignId: campaignId || '',
          action1Url: action1Url || clickUrl || '',
          action2Url: action2Url || clickUrl || ''
        }
      },
      fcmOptions: {
        link: clickUrl || ''
      }
    },
    android: {
      priority: 'high',
      notification: {
        title: title || '',
        body: body || '',
        icon: iconUrl || '/icon-192.png',
        ...(imageUrl ? { imageUrl } : {}),
        defaultSound: true,
        defaultVibrateTimings: true
      },
      data: {
        clickUrl: clickUrl || '',
        campaignId: campaignId || ''
      }
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: title || '',
            body: body || ''
          },
          sound: 'default',
          'mutable-content': 1
        }
      },
      fcmOptions: {
        ...(imageUrl ? { image: imageUrl } : {})
      }
    }
  };

  // Target by boolean condition if provided, otherwise single topic
  if (condition) {
    message.condition = condition;
  } else {
    message.topic = topic;
  }

  // Simulation mode if credentials not yet loaded
  if (!isConfigured) {
    const mockMessageId = `projects/demo-project/messages/topic_${topic}_${Date.now()}`;
    console.log(`[SIMULATION MODE] Single API Call to Topic "${message.topic || message.condition}" delivered (10M Scalable Fan-out): ${mockMessageId}`);
    return {
      success: true,
      messageId: mockMessageId,
      targetTopic: message.topic || message.condition,
      mode: 'simulated',
      note: 'Broadcast sent via FCM Topics Simulation (Single API call fan-out).'
    };
  }

  // Production FCM Topic Single API Call: admin.messaging().send(message)
  const messaging = getMessaging(existingApps[0]);
  try {
    const messageId = await messaging.send(message);
    console.log(`🚀 [FCM TOPIC SENT] Single API call broadcasted to topic "${message.topic || message.condition}" with messageId: ${messageId}`);
    return {
      success: true,
      messageId,
      targetTopic: message.topic || message.condition,
      mode: 'fcm_topic'
    };
  } catch (err) {
    console.error(`❌ [FCM TOPIC ERROR] Failed to send to topic "${message.topic || message.condition}":`, err.message);
    throw err;
  }
}

module.exports = {
  admin,
  initFirebase,
  getFirebaseStatus,
  formatTopicName,
  subscribeTokenToTopics,
  sendTopicNotification,
  getFirestore: () => firestoreDb
};
