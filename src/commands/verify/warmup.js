const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'warmup',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Submit your warm-up completion')
    .addSubcommand(subcommand =>
      subcommand
        .setName('warmup')
        .setDescription('Submit proof of completed warm-up phase')
        .addStringOption(option =>
          option
            .setName('tiktok_username')
            .setDescription('Your TikTok username (without @)')
            .setRequired(true)
        )
        .addAttachmentOption(option =>
          option
            .setName('analytics_screenshot')
            .setDescription('Screenshot of your TikTok analytics')
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const User = require('../../models/User');
    
    try {
      const tiktokUsername = interaction.options.getString('tiktok_username');
      const analyticsScreenshot = interaction.options.getAttachment('analytics_screenshot');

      // Validate attachment
      if (!analyticsScreenshot.contentType.startsWith('image/')) {
        return interaction.reply({
          content: '❌ Please upload a valid image file for the analytics screenshot.',
          ephemeral: true
        });
      }

      // Check if user exists and is in warming up phase
      let user = await User.findOne({ discord_id: interaction.user.id });
      
      if (!user) {
        return interaction.reply({
          content: '❌ You must complete verification first. Use `/verify submit` to get started.',
          ephemeral: true
        });
      }

      if (!user.verified) {
        return interaction.reply({
          content: '❌ You must be verified first. Please wait for your verification to be approved.',
          ephemeral: true
        });
      }

      if (user.warmup_done) {
        return interaction.reply({
          content: '❌ You have already completed the warm-up phase!',
          ephemeral: true
        });
      }

      if (user.warmup_submitted_at) {
        return interaction.reply({
          content: '❌ You have already submitted a warm-up request. Please wait for staff review.',
          ephemeral: true
        });
      }

      if (user.role !== 'Warming Up') {
        return interaction.reply({
          content: '❌ You must be in the warming up phase to submit this request.',
          ephemeral: true
        });
      }

      // Update user
      user.tiktok_username = tiktokUsername;
      user.warmup_submitted_at = new Date();
      await user.save();

      // Send to warm-up review channel
      const warmupChannel = client.channels.cache.get(client.config.channels.warmup);
      if (warmupChannel) {
        const warmupMessage = await client.createWarmupEmbed(user);
        
        // Create embed with attachment
        const warmupEmbed = new EmbedBuilder()
          .setTitle('🔥 New Warm-up Request')
          .setColor(0xff8800)
          .addFields(
            { name: '👤 User', value: `<@${user.discord_id}>`, inline: true },
            { name: '📱 TikTok Username', value: tiktokUsername, inline: true },
            { name: '📅 Submitted', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
          )
          .setImage(analyticsScreenshot.url)
          .setFooter({ text: 'MegaBot Warm-up System' })
          .setTimestamp();

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`warmup_approve_${user.discord_id}`)
              .setLabel('✅ Approve')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`warmup_reject_${user.discord_id}`)
              .setLabel('❌ Reject')
              .setStyle(ButtonStyle.Danger)
          );

        await warmupChannel.send({ embeds: [warmupEmbed], components: [row] });
      }

      // Log the action
      await client.logAction(
        'Warm-up Submitted',
        `<@${interaction.user.id}> submitted warm-up completion for TikTok: ${tiktokUsername}`
      );

      // Confirmation embed
      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Warm-up Submitted')
        .setColor(0xff8800)
        .setDescription('Your warm-up completion request has been submitted successfully!')
        .addFields(
          { name: '📱 TikTok Username', value: tiktokUsername, inline: true },
          { name: '📊 Analytics Screenshot', value: 'Uploaded', inline: true },
          { name: '⏰ Status', value: 'Pending Review', inline: true }
        )
        .setFooter({ text: 'Staff will review your submission shortly.' })
        .setTimestamp();

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in warmup command:', error);
      await interaction.reply({
        content: '❌ An error occurred while processing your warm-up request.',
        ephemeral: true
      });
    }
  }
};
