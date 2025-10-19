const cron = require('node-cron');
const TikTokScraper = require('./tiktokScraper');

class CronJobs {
  constructor() {
    this.jobs = new Map();
  }

  initialize(client) {
    this.client = client;
    this.setupStatsUpdate();
    this.setupLeaderboardUpdate();
    this.setupHealthCheck();
    this.setupTikTokScraping();
    console.log('✅ All cron jobs initialized');
  }

  setupStatsUpdate() {
    // Update stats every 12 hours at 6 AM and 6 PM
    const statsJob = cron.schedule('0 6,18 * * *', async () => {
      console.log('📊 Starting scheduled stats update...');
      await this.updateAllUserStats();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.set('statsUpdate', statsJob);
    statsJob.start();
    console.log('⏰ Stats update job scheduled (every 12 hours)');
  }

  setupLeaderboardUpdate() {
    // Update leaderboard daily at 12 PM UTC
    const leaderboardJob = cron.schedule('0 12 * * *', async () => {
      console.log('🏆 Starting scheduled leaderboard update...');
      await this.updateLeaderboard();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.set('leaderboardUpdate', leaderboardJob);
    leaderboardJob.start();
    console.log('⏰ Leaderboard update job scheduled (daily at 12 PM UTC)');
  }

  setupHealthCheck() {
    // Health check every hour
    const healthJob = cron.schedule('0 * * * *', async () => {
      console.log('💓 Health check running...');
      await this.performHealthCheck();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.set('healthCheck', healthJob);
    healthJob.start();
    console.log('⏰ Health check job scheduled (every hour)');
  }

  setupTikTokScraping() {
    // TikTok scraping every 6 hours
    const tiktokJob = cron.schedule('0 */6 * * *', async () => {
      console.log('📱 Starting scheduled TikTok scraping...');
      await TikTokScraper.scrapeAllAccounts();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.set('tiktokScraping', tiktokJob);
    tiktokJob.start();
    console.log('⏰ TikTok scraping job scheduled (every 6 hours)');
  }

  async updateAllUserStats() {
    try {
      const User = require('../models/User');
      const users = await User.find({
        role: 'Clipper',
        tiktok_username: { $exists: true, $ne: null }
      });

      console.log(`📊 Updating stats for ${users.length} users...`);

      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          await this.fetchAndUpdateUserStats(user);
          successCount++;
        } catch (error) {
          console.error(`Error updating stats for user ${user.discord_id}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Stats update complete: ${successCount} successful, ${errorCount} errors`);

      // Log the action
      if (this.client) {
        await this.client.logAction(
          'Scheduled Stats Update',
          `Updated stats for ${successCount} users (${errorCount} errors)`
        );
      }

    } catch (error) {
      console.error('Error in updateAllUserStats:', error);
    }
  }

  async fetchAndUpdateUserStats(user) {
    // Placeholder for TikTok API integration
    // This is where you would integrate with TikTok API or scraper service
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data for now - replace with actual TikTok API calls
      const mockStats = this.generateMockStats();
      
      await user.updateStats(mockStats.totalViews, mockStats.tier1Views);
      
      console.log(`📈 Updated stats for ${user.tiktok_username}: ${mockStats.tier1Views.toLocaleString()} Tier 1 views`);
      
    } catch (error) {
      console.error(`Error fetching stats for ${user.tiktok_username}:`, error);
      throw error;
    }
  }

  generateMockStats() {
    // Generate realistic mock data for testing
    const totalViews = Math.floor(Math.random() * 10000000) + 100000; // 100k to 10M views
    const tier1Percentage = Math.random() * 0.4 + 0.1; // 10-50% tier 1 views
    const tier1Views = Math.floor(totalViews * tier1Percentage);
    
    return {
      totalViews,
      tier1Views
    };
  }

  async updateLeaderboard() {
    try {
      const User = require('../models/User');
      const leaderboardChannel = this.client?.channels.cache.get(this.client.config.channels.leaderboard);
      
      if (!leaderboardChannel) {
        console.log('❌ Leaderboard channel not found');
        return;
      }

      // Get top 10 users by tier 1 views
      const topUsers = await User.find({
        role: 'Clipper',
        tiktok_username: { $exists: true, $ne: null },
        tier1_views: { $gt: 0 }
      })
      .sort({ tier1_views: -1 })
      .limit(10);

      if (topUsers.length === 0) {
        console.log('📊 No users found for leaderboard');
        return;
      }

      // Create leaderboard embed
      const leaderboardEmbed = await this.client.createLeaderboardEmbed(topUsers);
      
      // Send or update leaderboard message
      try {
        // Try to find existing leaderboard message
        const messages = await leaderboardChannel.messages.fetch({ limit: 10 });
        const existingMessage = messages.find(msg => 
          msg.author.id === this.client.user.id && 
          msg.embeds.length > 0 && 
          msg.embeds[0].title?.includes('Leaderboard')
        );

        if (existingMessage) {
          await existingMessage.edit(leaderboardEmbed);
          console.log('🏆 Updated existing leaderboard message');
        } else {
          await leaderboardChannel.send(leaderboardEmbed);
          console.log('🏆 Posted new leaderboard message');
        }
      } catch (error) {
        console.error('Error posting leaderboard:', error);
      }

      console.log(`🏆 Leaderboard updated with ${topUsers.length} users`);

    } catch (error) {
      console.error('Error in updateLeaderboard:', error);
    }
  }

  async performHealthCheck() {
    try {
      const healthData = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        guildCount: this.client?.guilds.cache.size || 0,
        userCount: this.client?.users.cache.size || 0,
        timestamp: new Date()
      };

      // Check database connection
      const User = require('../models/User');
      const userCount = await User.countDocuments();
      healthData.databaseUsers = userCount;

      console.log('💓 Health check:', {
        uptime: `${Math.floor(healthData.uptime / 3600)}h ${Math.floor((healthData.uptime % 3600) / 60)}m`,
        memory: `${Math.round(healthData.memoryUsage.heapUsed / 1024 / 1024)}MB`,
        guilds: healthData.guildCount,
        users: healthData.userCount,
        dbUsers: healthData.databaseUsers
      });

      // Log to admin channel if there are issues
      if (this.client && (healthData.memoryUsage.heapUsed > 500 * 1024 * 1024)) { // > 500MB
        await this.client.logAction(
          'Health Warning',
          `High memory usage detected: ${Math.round(healthData.memoryUsage.heapUsed / 1024 / 1024)}MB`
        );
      }

    } catch (error) {
      console.error('Error in health check:', error);
    }
  }

  stopAll() {
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`⏹️ Stopped cron job: ${name}`);
    }
    this.jobs.clear();
  }

  getJobStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        nextRun: job.nextDate?.toISO() || 'Not scheduled'
      };
    }
    return status;
  }
}

module.exports = new CronJobs();
