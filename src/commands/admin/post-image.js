const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'post-image',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('post-image')
    .setDescription('Post a message with image in a specific channel (Admin only)')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to post the message in')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Image to post')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Title for the message')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Description text')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Embed color (hex code like #ff0000)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel('channel');
      const imageAttachment = interaction.options.getAttachment('image');
      const title = interaction.options.getString('title') || '📸 Image Post';
      const description = interaction.options.getString('description') || '';
      const color = interaction.options.getString('color') || '#0099ff';

      // Validate image
      if (!imageAttachment.contentType?.startsWith('image/')) {
        return await interaction.reply({
          content: '❌ Please provide a valid image file.',
          ephemeral: true
        });
      }

      // Validate channel
      if (!channel.isTextBased()) {
        return await interaction.reply({
          content: '❌ Please select a text channel.',
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      // Create embed with the image
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setImage(imageAttachment.url)
        .setTimestamp();

      if (description) {
        embed.setDescription(description);
      }

      // Post the message in the specified channel
      await channel.send({ embeds: [embed] });

      await interaction.editReply({
        content: `✅ **Image posted successfully in ${channel}!**\n\n📸 **Image:** ${imageAttachment.name}\n📝 **Title:** ${title}\n📍 **Channel:** ${channel}`
      });

      console.log(`📸 Posted image in ${channel.name}: ${imageAttachment.name}`);

    } catch (error) {
      console.error('Error in post-image command:', error);
      await interaction.editReply({
        content: `❌ **Error posting image:**\n\`\`\`${error.message}\`\`\``,
        ephemeral: true
      });
    }
  }
};
