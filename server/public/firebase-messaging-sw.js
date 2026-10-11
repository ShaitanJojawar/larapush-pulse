/**
 * LaraPush Pulse - Firebase Messaging Service Worker
 * Handles background push notifications, rich media (YouTube thumbnails & banners),
 * LaraPush multi-action buttons, and real-time Click/CTR tracking beacons.
 */

// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Parse search parameters if passed during service worker registration
const urlParams = new URLSearchParams(location.search);
const apiKey = urlParams.get('apiKey');
const projectId = urlParams.get('projectId');
const messagingSenderId = urlParams.get('messagingSenderId');
const appId = urlParams.get('appId');

// Initialize Firebase in Service Worker if config is provided
if (apiKey && projectId && messagingSenderId && appId) {
  try {
    firebase.initializeApp({
      apiKey,
      projectId,
      messagingSenderId,
      appId
    });

    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);
      const title = payload.notification?.title || payload.data?.title || 'New Notification';
      const body = payload.notification?.body || payload.data?.body || '';
      const imageUrl = payload.notification?.image || payload.notification?.imageUrl || payload.data?.imageUrl;
      const clickUrl = payload.data?.clickUrl || payload.fcmOptions?.link || '/';
      const campaignId = payload.data?.campaignId || '';

      const actions = [];
      if (payload.data?.action1Title) {
        actions.push({ action: 'action1', title: payload.data.action1Title });
      }
      if (payload.data?.action2Title) {
        actions.push({ action: 'action2', title: payload.data.action2Title });
      }

      const notificationOptions = {
        body,
        icon: payload.data?.iconUrl || '/icon-192.png',
        badge: payload.data?.badgeUrl || '/badge-72.png',
        image: imageUrl || undefined,
        data: {
          clickUrl,
          campaignId,
          action1Url: payload.data?.action1Url || clickUrl,
          action2Url: payload.data?.action2Url || clickUrl,
          ...payload.data
        },
        actions: actions.length > 0 ? actions : undefined
      };

      return self.registration.showNotification(title, notificationOptions);
    });
  } catch (e) {
    console.warn('[firebase-messaging-sw.js] Background message handler init notice:', e);
  }
}

// Fallback & Standard Native Push Event Handler
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    data = { body: event.data ? event.data.text() : 'You have a new update!' };
  }

  console.log('[Service Worker] Push event received:', data);

  const notification = data.notification || {};
  const customData = data.data || {};

  const title = notification.title || customData.title || 'New Update';
  const body = notification.body || customData.body || '';
  const imageUrl = notification.image || notification.imageUrl || customData.imageUrl;
  const clickUrl = customData.clickUrl || (data.fcmOptions && data.fcmOptions.link) || '/';
  const campaignId = customData.campaignId || '';

  // Handle LaraPush Action Buttons
  const actions = [];
  if (customData.action1Title) {
    actions.push({ action: 'action1', title: customData.action1Title });
  } else if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/i.test(clickUrl)) {
    actions.push({ action: 'open_video', title: '▶ Watch Video' });
  }

  if (customData.action2Title) {
    actions.push({ action: 'action2', title: customData.action2Title });
  }

  const options = {
    body,
    icon: notification.icon || customData.iconUrl || '/icon-192.png',
    badge: customData.badgeUrl || '/badge-72.png',
    image: imageUrl || undefined,
    vibrate: [200, 100, 200],
    data: {
      clickUrl,
      campaignId,
      action1Url: customData.action1Url || clickUrl,
      action2Url: customData.action2Url || clickUrl,
      timestamp: Date.now(),
      ...customData
    },
    actions: actions.length > 0 ? actions : undefined
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification Click & Action Buttons with Real-time CTR Tracking
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const clickedAction = event.action; // 'action1', 'action2', or ''
  const campaignId = data.campaignId || 'general';

  // Determine destination URL
  let destinationUrl = data.clickUrl || '/';
  if (clickedAction === 'action1' && data.action1Url) {
    destinationUrl = data.action1Url;
  } else if (clickedAction === 'action2' && data.action2Url) {
    destinationUrl = data.action2Url;
  }

  console.log(`[Service Worker] Clicked action: "${clickedAction || 'main'}" -> Target: ${destinationUrl}`);

  // Send Click Tracking Beacon to Server for Real-time CTR Analytics
  const trackPromise = fetch(`/api/click-track?campaignId=${encodeURIComponent(campaignId)}&action=${encodeURIComponent(clickedAction || 'click')}`, {
    method: 'GET',
    keepalive: true
  }).catch(() => {});

  const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/i.test(destinationUrl);

  const windowPromise = clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    // 1. YouTube videos always open fresh new tab
    if (isYouTube) {
      if (clients.openWindow) {
        return clients.openWindow(destinationUrl);
      }
    }

    // 2. For website article links: focus existing tab if open, else open new tab
    for (const client of clientList) {
      if (client.url === destinationUrl && 'focus' in client) {
        return client.focus();
      }
    }

    if (clients.openWindow) {
      return clients.openWindow(destinationUrl);
    }
  });

  event.waitUntil(Promise.all([trackPromise, windowPromise]));
});
