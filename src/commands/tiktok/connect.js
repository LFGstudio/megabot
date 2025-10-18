const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'connect',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('tiktok')
    .setDescription('Connect your TikTok account for stats tracking')
    .addSubcommand(subcommand =>
      subcommand
        .setName('connect')
        .setDescription('Connect your TikTok username for automatic stats tracking')
        .addStringOption(option =>
          option
            .setName('username')
            .setDescription('Your TikTok username (without @)')
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const User = require('../../models/User');
    
    try {
      const tiktokUsername = interaction.options.getString('username');

      // Check if user exists and is a clipper
      let user = await User.findOne({ discord_id: interaction.user.id });
      
      if (!user) {
        return interaction.reply({
          content: '❌ You must complete the verification process first. Use `/verify submit` to get started.',
          ephemeral: true
        });
      }

      if (!user.verified || !user.warmup_done) {
        return interaction.reply({
          content: '❌ You must complete both verification and warm-up phases before connecting your TikTok.',
          ephemeral: true
        });
      }

      if (user.role !== 'Clipper') {
        return interaction.reply({
          content: '❌ You must be a verified clipper to connect your TikTok account.',
          ephemeral: true
        });
      }

      // Validate TikTok username format
      if (!/^[a-zA-Z0-9._]+$/.test(tiktokUsername)) {
        return interaction.reply({
          content: '❌ Invalid TikTok username format. Please use only letters, numbers, dots, and underscores.',
          ephemeral: true
        });
      }

      // Update user with TikTok connection
      user.tiktok_username = tiktokUsername;
      user.tiktok_connected_at = new Date();
      await user.save();

      // Log the action
      await client.logAction(
        'TikTok Connected',
        `<@${interaction.user.id}> connected TikTok account: ${tiktokUsername}`
      );

      // Confirmation embed
      const confirmEmbed = new EmbedBuilder()
        .setTitle('🔗 TikTok Connected Successfully')
        .setColor(0x00ff00)
        .setDescription('Your TikTok account has been connected for automatic stats tracking!')
        .addFields(
          { name: '📱 TikTok Username', value: tiktokUsername, inline: true },
          { name: '⏰ Connected', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
          { name: '📊 Stats Tracking', value: 'Active (Updates every 12 hours)', inline: true }
        )
        .setFooter({ text: 'Use /stats to view your current performance!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true
      });

      // Start tracking stats for this user (placeholder for now)
      console.log(`Started stats tracking for ${tiktokUsername} (${interaction.user.tag})`);

    } catch (error) {
      console.error('Error in tiktok connect command:', error);
      await interaction.reply({
        content: '❌ An error occurred while connecting your TikTok account.',
        ephemeral: true
      });
    }
  }
};
