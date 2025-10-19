const { SlashCommandBuilder } = require('discord.js');
const TikTokAPI = require('../../utils/tiktokAPI');
const config = require('../../config/config');

module.exports = {
  name: 'testrapidapi',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('testrapidapi')
    .setDescription('Test RapidAPI TikTok integration')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('TikTok username to test (without @)')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');
      
      console.log(`🧪 Testing RapidAPI integration for @${username}`);

      // Check if RapidAPI key is configured
      if (!config.tiktok.rapidApiKey) {
        await interaction.editReply(`❌ **RapidAPI Key Not Configured**\n\nPlease add your RapidAPI key to Railway environment variables:\n\`RAPIDAPI_KEY=your_api_key_here\`\n\nCurrent key status: ${config.tiktok.rapidApiKey ? '✅ Configured' : '❌ Missing'}`);
        return;
      }

      await interaction.editReply(`🔍 Testing RapidAPI for @${username}...`);

      // Test RapidAPI integration
      const tiktokAPI = new TikTokAPI(config);
      const result = await tiktokAPI.fetchUserStats(username);

      if (result.success) {
        let resultMessage = `✅ **RapidAPI Test Results for @${username}**\n\n`;
        
        resultMessage += `📊 **Summary:**\n`;
        resultMessage += `• Source: ${result.data.source}\n`;
        resultMessage += `• Total Views: ${result.data.totalViews.toLocaleString()}\n`;
        resultMessage += `• Tier 1 Views: ${result.data.tier1Views.toLocaleString()}\n`;
        resultMessage += `• Followers: ${result.data.followers.toLocaleString()}\n`;
        resultMessage += `• Videos Found: ${result.data.videos.length}\n`;
        resultMessage += `• Last Updated: ${result.data.lastUpdated.toLocaleString()}\n\n`;

        if (result.data.videos && result.data.videos.length > 0) {
          resultMessage += `🎯 **Video Details:**\n`;
          
          // Show first 3 videos
          const videosToShow = result.data.videos.slice(0, 3);
          videosToShow.forEach((video, index) => {
            resultMessage += `\n**Video ${index + 1}:**\n`;
            resultMessage += `• Views: ${video.views.toLocaleString()}\n`;
            resultMessage += `• Likes: ${video.likes.toLocaleString()}\n`;
            resultMessage += `• Comments: ${video.comments.toLocaleString()}\n`;
            resultMessage += `• Shares: ${video.shares.toLocaleString()}\n`;
            resultMessage += `• Caption: ${video.caption?.substring(0, 50)}${video.caption?.length > 50 ? '...' : ''}\n`;
          });
          
          if (result.data.videos.length > 3) {
            resultMessage += `\n... and ${result.data.videos.length - 3} more videos`;
          }
        }

        resultMessage += `\n🔧 **RapidAPI Status:** ✅ Working perfectly!`;
        
        await interaction.editReply(resultMessage);
      } else {
        await interaction.editReply(`❌ **RapidAPI Test Failed**\n\nError: \`${result.error}\`\n\nPlease check your RapidAPI key and subscription.`);
      }

    } catch (error) {
      console.error('❌ Error in RapidAPI test:', error);
      await interaction.editReply(`❌ **Error testing RapidAPI:**\n\`\`\`${error.message}\`\`\`\n\nPlease check the console for more details.`);
    }
  },
};
