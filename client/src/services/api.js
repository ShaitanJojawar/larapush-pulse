// API Service for Push SaaS Frontend (Unlimited Multi-Tenant Projects Support)

const BASE_URL = '';

function getHeaders() {
  const token = localStorage.getItem('push_admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  login: async (username, password) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return await res.json();
  },

  verifySession: async () => {
    const token = localStorage.getItem('push_admin_token');
    if (!token) return { success: false };
    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify`, {
        headers: getHeaders()
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  // Projects (Unlimited Support)
  getProjects: async () => {
    const res = await fetch(`${BASE_URL}/api/projects`, { headers: getHeaders() });
    return await res.json();
  },

  createProject: async (projectData) => {
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(projectData)
    });
    return await res.json();
  },

  updateProject: async (id, updateData) => {
    const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData)
    });
    return await res.json();
  },

  deleteProject: async (id) => {
    const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },

  // Stats (overall or segmented by project)
  getStats: async (projectId = 'all') => {
    const params = new URLSearchParams();
    if (projectId && projectId !== 'all') params.append('projectId', projectId);

    const res = await fetch(`${BASE_URL}/api/stats?${params.toString()}`, { headers: getHeaders() });
    return await res.json();
  },

  // Subscribers (with platform and project filter)
  getSubscribers: async (platform = 'all', search = '', projectId = 'all') => {
    const params = new URLSearchParams();
    if (platform && platform !== 'all') params.append('platform', platform);
    if (search) params.append('search', search);
    if (projectId && projectId !== 'all') params.append('projectId', projectId);

    const res = await fetch(`${BASE_URL}/api/subscribers?${params.toString()}`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  deleteSubscriber: async (id) => {
    const res = await fetch(`${BASE_URL}/api/subscribers/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },

  subscribe: async (tokenData) => {
    const res = await fetch(`${BASE_URL}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenData)
    });
    return await res.json();
  },
  saveToken: async (tokenData) => {
    const res = await fetch(`${BASE_URL}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenData)
    });
    return await res.json();
  },

  // Send Push
  sendNotification: async (payload) => {
    const res = await fetch(`${BASE_URL}/api/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  // History (filterable by project)
  getHistory: async (projectId = 'all') => {
    const params = new URLSearchParams();
    if (projectId && projectId !== 'all') params.append('projectId', projectId);

    const res = await fetch(`${BASE_URL}/api/history?${params.toString()}`, { headers: getHeaders() });
    return await res.json();
  },

  deleteNotification: async (id) => {
    const res = await fetch(`${BASE_URL}/api/history/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },

  clearHistory: async (projectId = 'all') => {
    const params = new URLSearchParams();
    if (projectId && projectId !== 'all') params.append('projectId', projectId);

    const res = await fetch(`${BASE_URL}/api/history?${params.toString()}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },

  // YouTube Info
  getYouTubeInfo: async (url) => {
    const res = await fetch(`${BASE_URL}/api/youtube/info?url=${encodeURIComponent(url)}`);
    return await res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${BASE_URL}/api/settings`, { headers: getHeaders() });
    return await res.json();
  },

  saveSettings: async (settingsData) => {
    const res = await fetch(`${BASE_URL}/api/settings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settingsData)
    });
    return await res.json();
  },

  // Automations (RSS to Push & AutoMagic)
  getAutomations: async (projectId = 'all') => {
    const res = await fetch(`${BASE_URL}/api/automations?projectId=${projectId}`, { headers: getHeaders() });
    return await res.json();
  },

  createAutomation: async (data) => {
    const res = await fetch(`${BASE_URL}/api/automations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  updateAutomation: async (id, data) => {
    const res = await fetch(`${BASE_URL}/api/automations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  deleteAutomation: async (id) => {
    const res = await fetch(`${BASE_URL}/api/automations/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },

  testRss: async (url) => {
    const res = await fetch(`${BASE_URL}/api/automations/test-rss?url=${encodeURIComponent(url)}`, { headers: getHeaders() });
    return await res.json();
  },

  // Opt-in Widget Settings
  getWidgetConfig: async (projectId) => {
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}/widget-config`, { headers: getHeaders() });
    return await res.json();
  },

  saveWidgetConfig: async (projectId, optinSettings) => {
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}/widget-config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ optinSettings })
    });
    return await res.json();
  }
};
