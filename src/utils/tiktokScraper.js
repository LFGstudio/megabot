const TikTokPost = require('../models/TikTokPost');
const User = require('../models/User');

class TikTokScraper {
  constructor() {
    this.scrapingInterval = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  }

  // Main scraping function
  async scrapeAllAccounts() {
    try {
      console.log('🔄 Starting TikTok account scraping...');
      
      // Get all users with scraping enabled
      const users = await User.find({ 
        'tiktok_account_info.scraping_enabled': true,
        role: 'Clipper'
      });

      console.log(`📊 Found ${users.length} users to scrape`);

      for (const user of users) {
        await this.scrapeUserAccount(user);
      }

      console.log('✅ TikTok scraping completed');
    } catch (error) {
      console.error('❌ Error in TikTok scraping:', error);
    }
  }

  // Scrape individual user account
  async scrapeUserAccount(user) {
    try {
      const accountInfo = user.tiktok_account_info;
      if (!accountInfo.username || !accountInfo.account_url) {
        console.log(`⚠️ Skipping user ${user.discord_id}: No TikTok account info`);
        return;
      }

      console.log(`🔍 Scraping TikTok account: @${accountInfo.username}`);

      // Get all videos from the TikTok account
      const videos = await this.getAccountVideos(accountInfo.account_url);
      
      if (!videos || videos.length === 0) {
        console.log(`⚠️ No videos found for @${accountInfo.username}`);
        return;
      }

      console.log(`📱 Found ${videos.length} videos for @${accountInfo.username}`);

      // Process each video
      for (const video of videos) {
        await this.processVideo(user, video);
      }

      // Update user's last scraped time
      user.tiktok_account_info.last_scraped_at = new Date();
      await user.save();

      console.log(`✅ Completed scraping for @${accountInfo.username}`);
    } catch (error) {
      console.error(`❌ Error scraping user ${user.discord_id}:`, error);
    }
  }

  // Get videos from TikTok account (placeholder - needs real TikTok API)
  async getAccountVideos(accountUrl) {
    try {
      // This is a placeholder function
      // In reality, you would use TikTok API or web scraping
      // For now, we'll return mock data
      
      console.log(`🔍 Fetching videos from: ${accountUrl}`);
      
      // Mock video data - replace with real TikTok API call
      const mockVideos = [
        {
          id: `video_${Date.now()}_1`,
          url: `${accountUrl}/video/1`,
          caption: 'Sample video 1',
          posted_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          views: Math.floor(Math.random() * 10000),
          tier1_views: Math.floor(Math.random() * 5000)
        },
        {
          id: `video_${Date.now()}_2`,
          url: `${accountUrl}/video/2`,
          caption: 'Sample video 2',
          posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          views: Math.floor(Math.random() * 10000),
          tier1_views: Math.floor(Math.random() * 5000)
        }
      ];

      return mockVideos;
    } catch (error) {
      console.error('❌ Error fetching account videos:', error);
      return [];
    }
  }

  // Process individual video
  async processVideo(user, videoData) {
    try {
      // Check if video already exists
      let post = await TikTokPost.findOne({ 
        tiktok_id: videoData.id,
        user_id: user.discord_id
      });

      if (!post) {
        // Create new post
        post = new TikTokPost({
          user_id: user.discord_id,
          tiktok_url: videoData.url,
          tiktok_id: videoData.id,
          caption: videoData.caption,
          posted_at: videoData.posted_at,
          auto_tracked: true
        });
      }

      // Update views
      await post.updateViews(videoData.views, videoData.tier1_views);

      // Check if video just monetized
      if (videoData.views >= 1000 && !post.monetized) {
        console.log(`💰 Video ${videoData.id} just monetized! Views: ${videoData.views}`);
        await this.notifyMonetization(user, post);
      }

      console.log(`📊 Updated video ${videoData.id}: ${videoData.views} views`);
    } catch (error) {
      console.error(`❌ Error processing video ${videoData.id}:`, error);
    }
  }

  // Notify user when video monetizes
  async notifyMonetization(user, post) {
    try {
      // This would send a DM to the user
      console.log(`🎉 Notifying user ${user.discord_id} about monetization`);
      
      // You could add Discord DM notification here
      // await client.users.fetch(user.discord_id).then(user => {
      //   user.send(`🎉 Your video just monetized! ${post.total_views} views`);
      // });
    } catch (error) {
      console.error('❌ Error notifying monetization:', error);
    }
  }

  // Start the scraping cron job
  startScraping() {
    console.log('⏰ Starting TikTok scraping cron job...');
    
    // Run immediately
    this.scrapeAllAccounts();
    
    // Then run every 6 hours
    setInterval(() => {
      this.scrapeAllAccounts();
    }, this.scrapingInterval);
    
    console.log('✅ TikTok scraping cron job started');
  }
}

module.exports = new TikTokScraper();
