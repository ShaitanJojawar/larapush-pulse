const firestoreDB = require('../db');
const rssService = require('./rssService');
const { formatTopicName, sendTopicNotification } = require('../firebase');

class SchedulerService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  start(intervalMs = 20000) {
    if (this.intervalId) return;
    console.log('⏰ LaraPush Automation & Campaign Scheduler Engine started (checking every 20s)');
    
    // Initial run after 5s
    setTimeout(() => this.tick(), 5000);
    this.intervalId = setInterval(() => this.tick(), intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async tick() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      await this.processScheduledCampaigns();
      await this.processRssAutomations();
    } catch (err) {
      console.warn('[Scheduler] Error in cycle:', err.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 1. Send Scheduled Campaigns
   */
  async processScheduledCampaigns() {
    const scheduledList = await firestoreDB.getScheduledNotifications();
    if (!scheduledList || scheduledList.length === 0) return;

    console.log(`[Scheduler] Processing ${scheduledList.length} scheduled campaign(s)...`);
    for (const campaign of scheduledList) {
      try {
        const topic = campaign.topic || formatTopicName(campaign.projectId);
        
        let condition = null;
        if (campaign.target && campaign.target !== 'all') {
          condition = `'${topic}' in topics && 'platform_${campaign.target}' in topics`;
        }

        const sendResult = await sendTopicNotification(
          topic,
          {
            title: campaign.title,
            body: campaign.body,
            imageUrl: campaign.imageUrl,
            clickUrl: campaign.clickUrl,
            notificationType: campaign.notificationType || 'article',
            actions: campaign.actions || []
          },
          condition
        );

        await firestoreDB.updateNotification(campaign.id, {
          status: 'sent',
          sentAt: new Date().toISOString(),
          fcmMessageId: sendResult.messageId
        });

        console.log(`✅ [Scheduler] Dispatched scheduled campaign "${campaign.title}" to topic "${topic}"`);
      } catch (err) {
        console.error(`❌ [Scheduler] Failed to dispatch campaign ${campaign.id}:`, err.message);
        await firestoreDB.updateNotification(campaign.id, {
          status: 'failed',
          error: err.message
        });
      }
    }
  }

  /**
   * 2. Check RSS / Atom feeds for AutoMagic Push-on-Publish
   */
  async processRssAutomations() {
    const automations = await firestoreDB.getAutomations();
    const active = automations.filter(a => a.active && a.rssUrl);

    for (const auto of active) {
      try {
        const now = Date.now();
        const lastCheckedTime = auto.lastChecked ? new Date(auto.lastChecked).getTime() : 0;
        const intervalMs = (auto.intervalMinutes || 15) * 60 * 1000;

        // Skip if checked recently
        if (now - lastCheckedTime < intervalMs) {
          continue;
        }

        const feedData = await rssService.fetchFeed(auto.rssUrl);
        if (!feedData.items || feedData.items.length === 0) {
          await firestoreDB.updateAutomation(auto.id, { lastChecked: new Date().toISOString() });
          continue;
        }

        const latestItem = feedData.items[0];

        // If first run, set baseline without spamming
        if (!auto.lastPostGuid) {
          await firestoreDB.updateAutomation(auto.id, {
            lastChecked: new Date().toISOString(),
            lastPostGuid: latestItem.guid
          });
          continue;
        }

        // New item detected!
        if (latestItem.guid !== auto.lastPostGuid) {
          console.log(`🔥 [AutoMagic Push] New post published in feed: "${latestItem.title}"`);

          const targetTopic = formatTopicName(auto.projectId);
          const sendResult = await sendTopicNotification(targetTopic, {
            title: `📢 ${latestItem.title}`,
            body: latestItem.description || 'Tap to check out our newest published update!',
            imageUrl: latestItem.imageUrl || '',
            clickUrl: latestItem.link,
            notificationType: 'article'
          });

          // Save notification
          await firestoreDB.saveNotification({
            title: latestItem.title,
            body: latestItem.description,
            imageUrl: latestItem.imageUrl,
            clickUrl: latestItem.link,
            projectId: auto.projectId,
            projectName: auto.projectName,
            topic: targetTopic,
            target: 'all',
            source: 'automation_rss',
            automationId: auto.id,
            fcmMessageId: sendResult.messageId,
            status: 'sent'
          });

          // Update automation
          await firestoreDB.updateAutomation(auto.id, {
            lastChecked: new Date().toISOString(),
            lastPostGuid: latestItem.guid,
            totalPushed: (auto.totalPushed || 0) + 1
          });
        } else {
          await firestoreDB.updateAutomation(auto.id, { lastChecked: new Date().toISOString() });
        }
      } catch (err) {
        // Record timestamp and error so it does not hammer on every 20s tick
        await firestoreDB.updateAutomation(auto.id, {
          lastChecked: new Date().toISOString(),
          lastError: err.message
        });
        console.warn(`[Scheduler] RSS check error for ${auto.name}:`, err.message);
      }
    }
  }
}

const schedulerInstance = new SchedulerService();
module.exports = schedulerInstance;
