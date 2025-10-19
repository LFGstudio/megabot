const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const TikTokWebScraper = require('../../utils/tiktokWebScraper');

module.exports = {
  name: 'scraperhealth',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('scraperhealth')
    .setDescription('Check TikTok scraper health and status (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      await interaction.reply({
        content: '🔍 Checking TikTok scraper health...',
        ephemeral: true
      });

      // Test scraper health
      const isHealthy = await TikTokWebScraper.healthCheck();
      
      const embed = new EmbedBuilder()
        .setTitle('🏥 TikTok Scraper Health Check')
        .setColor(isHealthy ? 0x00ff00 : 0xff0000)
        .addFields(
          { 
            name: 'Status', 
            value: isHealthy ? '✅ Healthy' : '❌ Unhealthy', 
            inline: true 
          },
          { 
            name: 'Browser Status', 
            value: TikTokWebScraper.isInitialized ? '✅ Initialized' : '❌ Not Initialized', 
            inline: true 
          },
          { 
            name: 'Last Check', 
            value: new Date().toLocaleString(), 
            inline: true 
          }
        )
        .setFooter({ text: 'Use /scrapetiktok to test scraping functionality' })
        .setTimestamp();

      if (isHealthy) {
        embed.addFields({
          name: '💡 Next Steps',
          value: 'Scraper is ready! You can now use `/scrapetiktok` to test scraping.',
          inline: false
        });
      } else {
        embed.addFields({
          name: '⚠️ Issues Detected',
          value: 'Scraper health check failed. Check logs for more details.',
          inline: false
        });
      }

      await interaction.editReply({
        content: '',
        embeds: [embed]
      });

      // Log the health check
      await client.logAction(
        'Scraper Health Check',
        `<@${interaction.user.id}> checked TikTok scraper health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`
      );

    } catch (error) {
      console.error('Error in scraperhealth command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while checking scraper health.',
      });
    }
  }
};
