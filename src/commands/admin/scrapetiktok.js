const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const TikTokScraper = require('../../utils/tiktokScraper');
const User = require('../../models/User');

module.exports = {
  name: 'scrapetiktok',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('scrapetiktok')
    .setDescription('Manually trigger TikTok scraping (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('all')
        .setDescription('Scrape all TikTok accounts')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('Scrape specific user\'s TikTok account')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to scrape')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check scraping status for all users')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'all') {
        await this.handleScrapeAll(interaction, client);
      } else if (subcommand === 'user') {
        await this.handleScrapeUser(interaction, client);
      } else if (subcommand === 'status') {
        await this.handleStatus(interaction, client);
      }

    } catch (error) {
      console.error('Error in scrapetiktok command:', error);
      await interaction.reply({
        content: '❌ An error occurred while scraping TikTok accounts.',
        ephemeral: true
      });
    }
  },

  async handleScrapeAll(interaction, client) {
    try {
      await interaction.reply({
        content: '🔄 Starting TikTok scraping for all accounts...',
        ephemeral: true
      });

      // Start scraping
      await TikTokScraper.scrapeAllAccounts();

      // Get updated stats
      const users = await User.find({ 
        'tiktok_account_info.scraping_enabled': true,
        role: 'Clipper'
      });

      const embed = new EmbedBuilder()
        .setTitle('✅ TikTok Scraping Complete')
        .setColor(0x00ff00)
        .addFields(
          { name: '📊 Accounts Scraped', value: users.length.toString(), inline: true },
          { name: '⏰ Last Scraped', value: new Date().toLocaleString(), inline: true }
        )
        .setFooter({ text: 'Scraping completed successfully!' })
        .setTimestamp();

      await interaction.editReply({
        content: '',
        embeds: [embed]
      });

      // Log the action
      await client.logAction(
        'Manual TikTok Scraping',
        `<@${interaction.user.id}> manually triggered TikTok scraping for ${users.length} accounts`
      );

    } catch (error) {
      console.error('Error in handleScrapeAll:', error);
      await interaction.editReply({
        content: '❌ An error occurred during TikTok scraping.',
      });
    }
  },

  async handleScrapeUser(interaction, client) {
    try {
      const targetUser = interaction.options.getUser('user');
      
      const user = await User.findOne({ discord_id: targetUser.id });
      if (!user) {
        return interaction.reply({
          content: '❌ User not found in database.',
          ephemeral: true
        });
      }

      if (!user.tiktok_account_info?.scraping_enabled) {
        return interaction.reply({
          content: '❌ User does not have TikTok scraping enabled.',
          ephemeral: true
        });
      }

      await interaction.reply({
        content: `🔄 Scraping TikTok account for <@${targetUser.id}>...`,
        ephemeral: true
      });

      // Scrape specific user
      await TikTokScraper.scrapeUserAccount(user);

      const embed = new EmbedBuilder()
        .setTitle('✅ User TikTok Scraping Complete')
        .setColor(0x00ff00)
        .addFields(
          { name: '👤 User', value: `<@${targetUser.id}>`, inline: true },
          { name: '📱 TikTok Account', value: user.tiktok_account_info.username || 'Unknown', inline: true },
          { name: '⏰ Last Scraped', value: new Date().toLocaleString(), inline: true }
        )
        .setFooter({ text: 'User scraping completed successfully!' })
        .setTimestamp();

      await interaction.editReply({
        content: '',
        embeds: [embed]
      });

      // Log the action
      await client.logAction(
        'Manual User TikTok Scraping',
        `<@${interaction.user.id}> manually scraped TikTok account for <@${targetUser.id}>`
      );

    } catch (error) {
      console.error('Error in handleScrapeUser:', error);
      await interaction.editReply({
        content: '❌ An error occurred while scraping the user\'s TikTok account.',
      });
    }
  },

  async handleStatus(interaction, client) {
    try {
      const users = await User.find({ 
        'tiktok_account_info.scraping_enabled': true,
        role: 'Clipper'
      });

      if (users.length === 0) {
        return interaction.reply({
          content: '❌ No users have TikTok scraping enabled.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('📊 TikTok Scraping Status')
        .setColor(0x0099ff)
        .setDescription(`Found ${users.length} users with TikTok scraping enabled`)
        .setTimestamp();

      const statusList = users.slice(0, 10).map(user => {
        const lastScraped = user.tiktok_account_info.last_scraped_at 
          ? new Date(user.tiktok_account_info.last_scraped_at).toLocaleString()
          : 'Never';
        const username = user.tiktok_account_info.username || 'Unknown';
        return `**@${username}** (<@${user.discord_id}>): Last scraped ${lastScraped}`;
      }).join('\n');

      embed.addFields({
        name: '👥 Users with TikTok Scraping',
        value: statusList + (users.length > 10 ? `\n... and ${users.length - 10} more` : ''),
        inline: false
      });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handleStatus:', error);
      await interaction.reply({
        content: '❌ An error occurred while checking scraping status.',
        ephemeral: true
      });
    }
  }
};
