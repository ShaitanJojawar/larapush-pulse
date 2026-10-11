const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const firestoreDB = require('../db');
const rssService = require('../services/rssService');
const {
  formatTopicName,
  sendTopicNotification,
  initFirebase,
  getFirebaseStatus
} = require('../firebase');
const { parseYouTubeUrl } = require('../utils/youtube');
const fs = require('fs');
const path = require('path');

// ================= 1. POST /api/subscribe =================
const handleSubscribe = async (req, res) => {
  try {
    const { token, deviceId, projectId, projectName, type, platform } = req.body;

    if (!token || typeof token !== 'string' || token.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'A valid FCM registration token is required'
      });
    }

    const result = await dataService.saveSubscriber({
      token: token.trim(),
      deviceId: deviceId ? deviceId.trim() : null,
      projectId: projectId || 'all',
      projectName,
      type: type || 'website',
      platform: platform || 'web'
    });

    return res.status(200).json({
      success: true,
      isNew: result.isNew,
      message: result.isNew ? ('Token subscribed to FCM topics: ' + result.subscribedTopics.join(', ')) : 'Device already subscribed',
      subscribedTopics: result.subscribedTopics,
      subscriber: result.subscriber
    });
  } catch (error) {
    console.error('Error in /api/subscribe:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

router.post('/subscribe', handleSubscribe);
router.post('/save-token', handleSubscribe);

// ================= 2. GET /api/subscribers =================
router.get('/subscribers', async (req, res) => {
  try {
    const { projectId, platform } = req.query;
    const subscribers = await dataService.getSubscribers({ projectId, platform });
    return res.status(200).json({
      success: true,
      count: subscribers.length,
      subscribers
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/subscribers/:token', async (req, res) => {
  try {
    await dataService.deleteSubscriber(req.params.token);
    return res.status(200).json({ success: true, message: 'Subscriber deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/unsubscribe', async (req, res) => {
  try {
    const { token } = req.body;
    if (token) await dataService.deleteSubscriber(token);
    return res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ================= 3. PROJECTS & DOMAINS API =================
router.get('/projects', async (req, res) => {
  try {
    const projects = await dataService.getProjects();
    return res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const projectName = req.body.name || req.body.project_name;
    const { type, identifier, logo, id, optinSettings } = req.body;
    if (!projectName || !projectName.trim()) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ success: false, error: 'Identifier (YouTube Channel ID or Domain) is required' });
    }

    const newProject = await dataService.addProject({
      name: projectName.trim(),
      type: type || 'website',
      identifier: identifier.trim(),
      logo: logo ? logo.trim() : '',
      id,
      optinSettings
    });

    return res.status(201).json({
      success: true,
      message: 'Project registered successfully',
      project: newProject
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Widget config per domain
router.get('/projects/:id/widget-config', async (req, res) => {
  try {
    const proj = await dataService.getProjectById(req.params.id);
    return res.status(200).json({
      success: true,
      optinSettings: proj?.optinSettings || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/projects/:id/widget-config', async (req, res) => {
  try {
    const { optinSettings } = req.body;
    const updated = await dataService.updateProject(req.params.id, { optinSettings });
    return res.status(200).json({
      success: true,
      message: 'Widget settings saved successfully',
      project: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    await dataService.deleteProject(req.params.id);
    return res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ================= 4. POST /api/send (LaraPush Campaigns Engine) =================
router.post('/send', async (req, res) => {
  try {
    const {
      projectId = 'all',
      title,
      body,
      imageUrl,
      iconUrl,
      badgeUrl,
      youtubeLink,
      websiteLink,
      clickUrl,
      target = 'all',
      notificationType,
      // LaraPush Action Buttons
      action1Title,
      action1Url,
      action2Title,
      action2Url,
      // LaraPush UTM Parameters
      utmEnabled,
      utmSource = 'larapush',
      utmMedium = 'push_notification',
      utmCampaign,
      // LaraPush Scheduling
      isScheduled,
      scheduledAt
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Notification title is required' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, error: 'Notification body is required' });
    }

    let finalLink = (youtubeLink || websiteLink || clickUrl || '').trim();

    // Append UTM tags if enabled
    if (utmEnabled && finalLink) {
      try {
        const urlObj = new URL(finalLink.startsWith('http') ? finalLink : `https://${finalLink}`);
        urlObj.searchParams.set('utm_source', utmSource || 'larapush');
        urlObj.searchParams.set('utm_medium', utmMedium || 'push_notification');
        urlObj.searchParams.set('utm_campaign', utmCampaign || title.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 40));
        finalLink = urlObj.toString();
      } catch (e) { }
    }

    // Check YouTube link details
    const ytDetails = parseYouTubeUrl(finalLink);
    let finalImageUrl = imageUrl ? imageUrl.trim() : '';
    if (!finalImageUrl && ytDetails?.isYouTube && ytDetails.maxResThumbnail) {
      finalImageUrl = ytDetails.maxResThumbnail;
    }

    // Determine target FCM topic
    let targetTopic = 'all_users';
    let projectName = 'All Projects';

    if (projectId && projectId !== 'all') {
      const proj = await dataService.getProjectById(projectId);
      if (proj) {
        projectName = proj.name || proj.project_name || projectName;
        targetTopic = formatTopicName(proj.id || proj.project_id);
      } else {
        targetTopic = formatTopicName(projectId);
      }
    }

    const campaignId = 'camp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    // If Scheduled Campaign, save for background worker without sending right now
    if (isScheduled && scheduledAt) {
      const scheduledRecord = await dataService.saveNotification({
        id: campaignId,
        title: title.trim(),
        body: body.trim(),
        imageUrl: finalImageUrl,
        iconUrl,
        badgeUrl,
        clickUrl: finalLink,
        action1Title: action1Title ? action1Title.trim() : '',
        action1Url: action1Url ? action1Url.trim() : '',
        action2Title: action2Title ? action2Title.trim() : '',
        action2Url: action2Url ? action2Url.trim() : '',
        projectId,
        projectName,
        topic: targetTopic,
        target,
        status: 'scheduled',
        scheduledAt,
        notificationType: notificationType || (ytDetails?.isYouTube ? 'video' : 'article')
      });

      return res.status(200).json({
        success: true,
        scheduled: true,
        message: `Campaign scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        targetTopic,
        notification: scheduledRecord
      });
    }

    // Immediate Broadcast: Single API call to Google FCM Topic
    let topicCondition = null;
    if (target && target !== 'all') {
      topicCondition = `'${targetTopic}' in topics && 'platform_${target}' in topics`;
    }

    const sendResult = await sendTopicNotification(
      targetTopic,
      {
        campaignId,
        title: title.trim(),
        body: body.trim(),
        imageUrl: finalImageUrl,
        iconUrl,
        badgeUrl,
        clickUrl: finalLink,
        action1Title,
        action1Url,
        action2Title,
        action2Url,
        notificationType: notificationType || (ytDetails?.isYouTube ? 'video' : 'article')
      },
      topicCondition
    );

    // Save notification in Firestore / audit log
    const notificationRecord = await dataService.saveNotification({
      id: campaignId,
      title: title.trim(),
      body: body.trim(),
      imageUrl: finalImageUrl,
      iconUrl,
      badgeUrl,
      clickUrl: finalLink,
      youtubeLink: ytDetails?.isYouTube ? finalLink : '',
      action1Title: action1Title ? action1Title.trim() : '',
      action1Url: action1Url ? action1Url.trim() : '',
      action2Title: action2Title ? action2Title.trim() : '',
      action2Url: action2Url ? action2Url.trim() : '',
      projectId,
      projectName,
      topic: targetTopic,
      target,
      fcmMessageId: sendResult.messageId,
      status: 'sent'
    });

    return res.status(200).json({
      success: true,
      message: `Broadcast delivered via FCM Topic: ${targetTopic}`,
      fcmMessageId: sendResult.messageId,
      targetTopic,
      notification: notificationRecord
    });
  } catch (error) {
    console.error('Error in /api/send:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ================= 5. CLICK TRACKING & CTR =================
const handleClickTrack = async (req, res) => {
  try {
    const campaignId = req.query.campaignId || req.body?.campaignId;
    const action = req.query.action || req.body?.action || 'click';
    const platform = req.query.platform || req.body?.platform || 'web';
    const userAgent = req.headers['user-agent'] || '';

    await dataService.recordClick({
      campaignId,
      action,
      platform,
      userAgent
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(200).json({ success: false });
  }
};

router.get('/click-track', handleClickTrack);
router.post('/click-track', handleClickTrack);

// ================= 6. AUTOMATIONS (RSS to Push / AutoMagic) =================
router.get('/automations', async (req, res) => {
  try {
    const automations = await dataService.getAutomations(req.query.projectId || 'all');
    return res.status(200).json({ success: true, automations });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/automations', async (req, res) => {
  try {
    const { name, rssUrl, projectId, intervalMinutes } = req.body;
    if (!name || !rssUrl) {
      return res.status(400).json({ success: false, error: 'Name and RSS URL are required' });
    }

    const newAuto = await dataService.saveAutomation({
      name,
      rssUrl,
      projectId: projectId || 'all',
      intervalMinutes: parseInt(intervalMinutes, 10) || 15
    });

    return res.status(201).json({ success: true, automation: newAuto });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/automations/:id', async (req, res) => {
  try {
    const updated = await dataService.updateAutomation(req.params.id, req.body);
    return res.status(200).json({ success: true, automation: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/automations/:id', async (req, res) => {
  try {
    await dataService.deleteAutomation(req.params.id);
    return res.status(200).json({ success: true, message: 'Automation deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Live RSS test endpoint
router.get('/automations/test-rss', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });
    const feed = await rssService.fetchFeed(url);
    return res.status(200).json({ success: true, feed });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// ================= 7. WORDPRESS PLUGIN DOWNLOAD =================
router.get('/download/wordpress-plugin', (req, res) => {
  const zipPath = path.join(__dirname, '..', 'public', 'larapush-pulse-wp.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="larapush-pulse-wp.zip"');
    res.setHeader('Content-Type', 'application/zip');
    return res.sendFile(zipPath);
  }
  return res.status(404).json({ success: false, error: 'Plugin zip file not generated yet' });
});

// ================= 8. STATS & HISTORY =================
router.get('/stats', async (req, res) => {
  try {
    const stats = await dataService.getStats(req.query.projectId || 'all');
    return res.status(200).json({
      success: true,
      stats,
      system: {
        firebase: getFirebaseStatus(),
        database: firestoreDB.getStatus()
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get(['/history', '/notifications'], async (req, res) => {
  try {
    const history = await dataService.getNotifications(100, req.query.projectId || 'all');
    return res.status(200).json({
      success: true,
      count: history.length,
      history,
      notifications: history
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete(['/history/:id', '/notifications/:id'], async (req, res) => {
  try {
    await dataService.deleteNotification(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Campaign record deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete(['/history', '/notifications'], async (req, res) => {
  try {
    const projectId = req.query.projectId || 'all';
    await dataService.clearNotifications(projectId);
    return res.status(200).json({
      success: true,
      message: `Campaign history cleared for project [${projectId}]`
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});



// Settings endpoints
router.get('/settings', (req, res) => {
  return res.status(200).json({
    success: true,
    firebase: getFirebaseStatus(),
    database: firestoreDB.getStatus(),
    vapidKey: process.env.VAPID_PUBLIC_KEY || '',
    hasServiceAccountFile: fs.existsSync(path.join(__dirname, '..', 'serviceAccountKey.json'))
  });
});

router.post('/settings', (req, res) => {
  try {
    const { serviceAccountJson, vapidKey } = req.body;
    if (serviceAccountJson) {
      const parsedCreds = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;
      const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
      fs.writeFileSync(keyPath, JSON.stringify(parsedCreds, null, 2), 'utf8');

      const initResult = initFirebase(parsedCreds);
      if (!initResult.success) {
        return res.status(400).json({ success: false, error: initResult.error });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      firebase: getFirebaseStatus()
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/youtube/info', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: 'URL is required' });
  return res.status(200).json({ success: true, data: parseYouTubeUrl(url) });
});

module.exports = router;
