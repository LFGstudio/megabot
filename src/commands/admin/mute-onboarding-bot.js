const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const OnboardingProgress = require('../../models/OnboardingProgress');

module.exports = {
  name: 'mute-onboarding-bot',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('mute-onboarding-bot')
    .setDescription('Mute/unmute the bot in an onboarding channel (Admin/Mod only)')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The onboarding channel (leave empty for current channel)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('mute')
        .setDescription('True to mute, false to unmute')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    try {
      // Check if user is moderator or admin
      const member = interaction.member;
      const isModerator = client.config.roles.moderator && 
                         member.roles.cache.has(client.config.roles.moderator);
      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator) ||
                     (client.config.roles.admin && member.roles.cache.has(client.config.roles.admin));

      if (!isModerator && !isAdmin) {
        return await interaction.reply({
          content: '❌ You need moderator or admin permissions to use this command.',
          ephemeral: true
        });
      }

      const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
      const shouldMute = interaction.options.getBoolean('mute');

      // Check if this is an onboarding channel
      const onboardingProgress = await OnboardingProgress.findOne({
        channel_id: targetChannel.id
      });

      if (!onboardingProgress) {
        return await interaction.reply({
          content: '❌ This is not an onboarding channel.',
          ephemeral: true
        });
      }

      // Update mute status
      onboardingProgress.bot_muted = shouldMute;
      if (shouldMute) {
        onboardingProgress.muted_by = interaction.user.id;
        onboardingProgress.muted_at = new Date();
      } else {
        onboardingProgress.muted_by = null;
        onboardingProgress.muted_at = null;
      }
      await onboardingProgress.save();

      const statusEmbed = new EmbedBuilder()
        .setTitle(shouldMute ? '🔇 Bot Muted' : '🔊 Bot Unmuted')
        .setDescription(
          shouldMute
            ? `The bot will no longer reply when moderators/admins are speaking in this channel.\nRegular users can still interact with the bot.`
            : `The bot will now reply to all messages in this channel.`
        )
        .addFields(
          { name: 'Channel', value: `<#${targetChannel.id}>`, inline: true },
          { name: 'Status', value: shouldMute ? '🔇 Muted' : '🔊 Unmuted', inline: true },
          { name: 'Action by', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor(shouldMute ? 0xff6b6b : 0x00ff00)
        .setTimestamp();

      await interaction.reply({
        embeds: [statusEmbed],
        ephemeral: true
      });

      // Also send a message in the channel to notify
      try {
        await targetChannel.send({
          content: shouldMute 
            ? '🔇 **Bot Muted**: Moderators and admins can now chat with users without the bot replying. Regular users can still interact with the bot.'
            : '🔊 **Bot Unmuted**: The bot will now respond to all messages.',
          allowedMentions: { parse: [] }
        });
      } catch (err) {
        console.error('Error sending mute notification:', err);
      }

    } catch (error) {
      console.error('Error in mute-onboarding-bot command:', error);
      await interaction.reply({
        content: '❌ An error occurred while muting/unmuting the bot.',
        ephemeral: true
      });
    }
  }
};

