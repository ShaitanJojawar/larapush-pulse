/**
 * LaraPush Pulse - Client SDK with Floating Bell Widget & 2-Step Permission Modal
 * Features:
 * - Floating Bell Widget (animated bell, custom color, position bottom-right/bottom-left)
 * - 2-Step Soft Opt-in Modal with custom title, body, and buttons
 * - 1 Device = 1 Subscriber strictly (zero duplicate DB loops)
 * - Seamless integration for WordPress, Shopify, and custom HTML websites
 */

(function (window) {
  'use strict';

  // Helper to detect Browser & OS
  function detectClientInfo() {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    let platform = 'web';

    if (/edg/i.test(userAgent)) browser = 'Microsoft Edge';
    else if (/chrome|crios/i.test(userAgent)) browser = 'Google Chrome';
    else if (/firefox|fxios/i.test(userAgent)) browser = 'Mozilla Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Apple Safari';
    else if (/opr\//i.test(userAgent)) browser = 'Opera';

    if (/windows nt 10/i.test(userAgent)) os = 'Windows 10/11';
    else if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
    else if (/android/i.test(userAgent)) {
      os = 'Android';
      platform = 'android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      os = 'iOS';
      platform = 'ios';
    } else if (/linux/i.test(userAgent)) os = 'Linux';

    return { browser, os, platform, userAgent };
  }

  // Stable persistent Device ID per device
  function getPersistentDeviceId() {
    try {
      let devId = localStorage.getItem('push_device_id');
      if (!devId) {
        devId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
        localStorage.setItem('push_device_id', devId);
      }
      return devId;
    } catch (e) {
      return 'dev_' + Date.now();
    }
  }

  // Stable persistent Token per device
  function getPersistentLocalToken() {
    try {
      let token = localStorage.getItem('push_device_token');
      if (!token) {
        token = 'fcm_web_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
        localStorage.setItem('push_device_token', token);
      }
      return token;
    } catch (e) {
      return 'fcm_web_' + Date.now();
    }
  }

  const PushSDK = {
    config: {
      apiUrl: window.location.origin,
      projectId: 'all',
      projectName: 'Website',
      vapidKey: '',
      firebaseConfig: null,
      serviceWorkerPath: '/firebase-messaging-sw.js',
      autoPrompt: true,
      optin: {
        promptType: 'both', // 'both' | 'bell_widget' | 'two_step_modal' | 'native'
        bellPosition: 'bottom-right',
        bellColor: '#6366f1',
        modalTitle: "🔔 Don't Miss Important Updates!",
        modalBody: 'Subscribe to get instant breaking alerts and exclusive updates directly on your device.',
        allowText: 'Allow Notifications',
        denyText: 'Later',
        delaySeconds: 2
      }
    },
    currentToken: null,
    isInitialized: false,

    /**
     * Initialize SDK
     */
    init: async function (options = {}) {
      if (options.optin) {
        options.optin = { ...this.config.optin, ...options.optin };
      }
      this.config = { ...this.config, ...options };
      this.isInitialized = true;
      const projectId = this.config.projectId || 'all';

      // Fetch remote widget settings if available
      try {
        const res = await fetch(`${this.config.apiUrl}/api/projects/${projectId}/widget-config`);
        if (res.ok) {
          const data = await res.json();
          if (data.optinSettings) {
            this.config.optin = { ...this.config.optin, ...data.optinSettings };
          }
        }
      } catch (e) { }

      // Check revoked permission
      if (window.Notification && Notification.permission !== 'granted') {
        const wasSubscribed = localStorage.getItem('push_subscribed_' + projectId) === 'true';
        if (wasSubscribed) {
          localStorage.removeItem('push_subscribed_' + projectId);
          const oldToken = localStorage.getItem('push_device_token');
          const devId = localStorage.getItem('push_device_id');
          try {
            fetch(`${this.config.apiUrl}/api/unsubscribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: oldToken, deviceId: devId, projectId })
            }).catch(() => {});
          } catch (e) { }
        }
      }

      // Check if already subscribed
      const isSubscribed = localStorage.getItem('push_subscribed_' + projectId) === 'true' &&
                           window.Notification && Notification.permission === 'granted';

      // Render Floating Bell if enabled
      if (this.config.optin.promptType === 'both' || this.config.optin.promptType === 'bell_widget') {
        this.renderFloatingBell(isSubscribed);
      }

      // If already subscribed, connect live notification listener and return
      if (isSubscribed) {
        this.currentToken = localStorage.getItem('push_device_token');
        this.listenToEvents();
        return { success: true, subscribed: true, token: this.currentToken };
      }

      // Show Opt-in Prompt after delay
      if (this.config.autoPrompt && window.Notification && Notification.permission !== 'denied') {
        const delayMs = (this.config.optin.delaySeconds || 2) * 1000;
        setTimeout(() => {
          if (this.config.optin.promptType === 'both' || this.config.optin.promptType === 'two_step_modal') {
            this.renderTwoStepModal();
          } else if (this.config.optin.promptType === 'native') {
            this.requestPermission();
          }
        }, delayMs);
      }

      return { success: true, initialized: true };
    },

    /**
     * Render LaraPush Floating Bell Widget
     */
    renderFloatingBell: function (isSubscribed = false) {
      if (document.getElementById('larapush-bell-container')) return;

      const optin = this.config.optin;
      const isRight = optin.bellPosition !== 'bottom-left';
      const bellColor = optin.bellColor || '#6366f1';

      const container = document.createElement('div');
      container.id = 'larapush-bell-container';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        ${isRight ? 'right: 24px;' : 'left: 24px;'}
        z-index: 999990;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;

      container.innerHTML = `
        <button id="larapush-bell-btn" title="${isSubscribed ? 'Notifications Enabled' : 'Subscribe to Notifications'}" style="
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: ${bellColor};
          color: #ffffff;
          border: none;
          box-shadow: 0 10px 25px -5px ${bellColor}80, 0 8px 10px -6px rgba(0,0,0,0.1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
          outline: none;
        ">
          <svg style="width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          ${!isSubscribed ? `
            <span style="
              position: absolute;
              top: 2px;
              right: 2px;
              width: 12px;
              height: 12px;
              background: #ef4444;
              border: 2px solid #ffffff;
              border-radius: 50%;
            "></span>
          ` : ''}
        </button>
      `;

      document.body.appendChild(container);

      const btn = document.getElementById('larapush-bell-btn');
      btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.1)');
      btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
      btn.addEventListener('click', () => {
        if (isSubscribed) {
          alert('✅ You are subscribed to updates for this website!');
        } else {
          this.renderTwoStepModal();
        }
      });
    },

    /**
     * Render LaraPush 2-Step Soft Opt-in Modal Dialog
     */
    renderTwoStepModal: function () {
      if (document.getElementById('larapush-optin-modal')) return;

      const optin = this.config.optin;
      const bellColor = optin.bellColor || '#6366f1';

      const overlay = document.createElement('div');
      overlay.id = 'larapush-optin-modal';
      overlay.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        width: 90%;
        max-width: 440px;
        background: #181924;
        color: #ffffff;
        border-radius: 16px;
        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        animation: larapushSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      `;

      // Add keyframes
      if (!document.getElementById('larapush-keyframes')) {
        const style = document.createElement('style');
        style.id = 'larapush-keyframes';
        style.textContent = `
          @keyframes larapushSlideDown {
            from { opacity: 0; transform: translate(-50%, -20px) scale(0.96); }
            to { opacity: 1; transform: translate(-50%, 0) scale(1); }
          }
        `;
        document.head.appendChild(style);
      }

      overlay.innerHTML = `
        <div style="display: flex; gap: 14px; align-items: flex-start;">
          <div style="
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: ${bellColor}25;
            color: ${bellColor};
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          ">
            <svg style="width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div style="flex: 1;">
            <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #ffffff; line-height: 1.3;">
              ${optin.modalTitle}
            </h3>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8; line-height: 1.45;">
              ${optin.modalBody}
            </p>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button id="larapush-btn-deny" style="
                padding: 8px 16px;
                background: transparent;
                border: 1px solid rgba(255,255,255,0.15);
                color: #cbd5e1;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
              ">${optin.denyText || 'Later'}</button>
              <button id="larapush-btn-allow" style="
                padding: 8px 18px;
                background: ${bellColor};
                border: none;
                color: #ffffff;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 12px ${bellColor}50;
              ">${optin.allowText || 'Allow Notifications'}</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      document.getElementById('larapush-btn-deny').addEventListener('click', () => {
        overlay.remove();
      });

      document.getElementById('larapush-btn-allow').addEventListener('click', async () => {
        overlay.remove();
        await this.requestPermission();
      });
    },

    /**
     * Request Native Browser Permission and Save Token
     */
    requestPermission: async function (projOverride) {
      if (!('Notification' in window)) {
        alert('This browser does not support desktop notifications.');
        return { success: false, error: 'Not supported', granted: false, permission: 'denied' };
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, permission, granted: false };
      }

      // Register Service Worker
      let swReg = null;
      if ('serviceWorker' in navigator) {
        try {
          swReg = await navigator.serviceWorker.register(this.config.serviceWorkerPath);
          console.log('[PushSDK] Service Worker registered:', swReg.scope);
        } catch (e) {
          console.warn('[PushSDK] SW registration error:', e.message);
        }
      }

      const clientInfo = detectClientInfo();
      const deviceId = getPersistentDeviceId();
      const localToken = getPersistentLocalToken();
      const projectId = projOverride || this.config.projectId || 'all';

      // Save token to Server
      try {
        const response = await fetch(`${this.config.apiUrl}/api/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: localToken,
            deviceId,
            projectId,
            projectName: this.config.projectName || projectId,
            platform: clientInfo.platform,
            type: 'website'
          })
        });

        const resData = await response.json();
        if (resData.success) {
          localStorage.setItem('push_subscribed_' + projectId, 'true');
          this.currentToken = localToken;

          // Connect real-time event listener for instant push alerts
          this.listenToEvents();

          // Update Bell UI
          const bellBtn = document.getElementById('larapush-bell-btn');
          if (bellBtn) {
            bellBtn.title = 'Notifications Enabled';
            const badge = bellBtn.querySelector('span');
            if (badge) badge.remove();
          }

          return {
            success: true,
            subscribed: true,
            granted: true,
            permission: 'granted',
            token: localToken
          };
        }
      } catch (err) {
        console.error('[PushSDK] Failed to save token:', err);
      }

      this.listenToEvents();
      return {
        success: true,
        subscribed: true,
        granted: true,
        permission: 'granted',
        token: localToken
      };
    },

    /**
     * Connect real-time SSE stream for instant browser push delivery
     */
    listenToEvents: function () {
      if (this._eventSource) return;
      const token = this.currentToken || getPersistentLocalToken();
      const proj = this.config.projectId || 'all';

      try {
        const url = `${this.config.apiUrl}/api/events?token=${encodeURIComponent(token)}&projectId=${encodeURIComponent(proj)}`;
        const es = new EventSource(url);

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.displayNativeNotification(data);
          } catch (e) { }
        };

        es.onerror = () => {
          // auto-reconnects by default in browser EventSource
        };

        this._eventSource = es;
        console.log('[PushSDK] Live push notification channel active');
      } catch (e) { }
    },

    /**
     * Display rich desktop notification on device
     */
    displayNativeNotification: function (data) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const title = data.title || 'LaraPush Pulse';
      const clickUrl = data.clickUrl || (window.location.origin + '/');
      const options = {
        body: data.body || '',
        icon: data.iconUrl || '/icon-192.png',
        badge: data.badgeUrl || '/badge-72.png',
        image: data.imageUrl || undefined,
        data: { clickUrl }
      };

      // Try Service Worker showNotification first for full system drawer notification
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, options);
        }).catch(() => {
          const n = new Notification(title, options);
          n.onclick = () => { window.focus(); window.location.href = clickUrl; };
        });
      } else {
        const n = new Notification(title, options);
        n.onclick = () => { window.focus(); window.location.href = clickUrl; };
      }
    }
  };

  window.PushSDK = PushSDK;
})(window);
