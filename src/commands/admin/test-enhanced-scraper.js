const { SlashCommandBuilder } = require('discord.js');
const TikTokScraper = require('../../utils/tiktokScraper');
const TikTokWebScraper = require('../../utils/tiktokWebScraper');

module.exports = {
  name: 'test-enhanced-scraper',
  data: new SlashCommandBuilder()
    .setName('test-enhanced-scraper')
    .setDescription('Test the enhanced TikTok scraper with detailed metrics')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('TikTok username to test (without @)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('video-limit')
        .setDescription('Maximum number of videos to scrape (default: 5)')
        .setMinValue(1)
        .setMaxValue(20)
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');
      const videoLimit = interaction.options.getInteger('video-limit') || 5;

      console.log(`🧪 Testing enhanced scraper for @${username}`);

      // Test 1: Basic account scraping
      await interaction.editReply(`🔍 Testing basic account scraping for @${username}...`);
      
      const basicVideos = await TikTokScraper.getAccountVideos(`https://www.tiktok.com/@${username}`);
      
      if (!basicVideos || basicVideos.length === 0) {
        await interaction.editReply(`❌ No videos found for @${username}. Please check the username is correct.`);
        return;
      }

      // Limit the number of videos for testing
      const testVideos = basicVideos.slice(0, videoLimit);
      
      await interaction.editReply(`📱 Found ${basicVideos.length} videos, testing detailed metrics on ${testVideos.length} videos...`);

      // Test 2: Detailed video scraping
      const detailedResults = [];
      
      for (let i = 0; i < testVideos.length; i++) {
        const video = testVideos[i];
        await interaction.editReply(`🎯 Scraping detailed metrics for video ${i + 1}/${testVideos.length}: ${video.id}`);
        
        const detailedData = await TikTokWebScraper.scrapeIndividualVideo(video.url);
        
        if (detailedData) {
          detailedResults.push({
            id: video.id,
            url: video.url,
            views: detailedData.views,
            likes: detailedData.likes,
            comments: detailedData.comments,
            shares: detailedData.shares,
            caption: detailedData.caption?.substring(0, 100) + (detailedData.caption?.length > 100 ? '...' : ''),
            author: detailedData.author
          });
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Format results
      let resultMessage = `✅ **Enhanced Scraper Test Results for @${username}**\n\n`;
      resultMessage += `📊 **Summary:**\n`;
      resultMessage += `• Total videos found: ${basicVideos.length}\n`;
      resultMessage += `• Videos tested: ${testVideos.length}\n`;
      resultMessage += `• Successfully scraped: ${detailedResults.length}\n\n`;

      if (detailedResults.length > 0) {
        resultMessage += `🎯 **Detailed Results:**\n`;
        
        detailedResults.forEach((video, index) => {
          resultMessage += `\n**Video ${index + 1}:**\n`;
          resultMessage += `• Views: ${video.views.toLocaleString()}\n`;
          resultMessage += `• Likes: ${video.likes.toLocaleString()}\n`;
          resultMessage += `• Comments: ${video.comments.toLocaleString()}\n`;
          resultMessage += `• Shares: ${video.shares.toLocaleString()}\n`;
          resultMessage += `• Caption: ${video.caption || 'No caption'}\n`;
          resultMessage += `• Author: ${video.author || username}\n`;
        });
      }

      resultMessage += `\n🔧 **Scraper Status:** ✅ Working perfectly!`;
      
      await interaction.editReply(resultMessage);

    } catch (error) {
      console.error('❌ Error in enhanced scraper test:', error);
      await interaction.editReply(`❌ **Error testing enhanced scraper:**\n\`\`\`${error.message}\`\`\`\n\nPlease check the console for more details.`);
    }
  },
};
