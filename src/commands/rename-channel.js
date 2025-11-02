const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'rename-channel',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('rename-channel')
    .setDescription('Rename an onboarding channel')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to rename (leave empty to rename current channel)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('new-name')
        .setDescription('The new name for the channel')
        .setRequired(true)
        .setMaxLength(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    try {
      // Use provided channel or default to current channel
      const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
      const newName = interaction.options.getString('new-name');

      // Store old name before renaming
      const oldName = targetChannel.name;

      // Check if user has permission to manage the channel
      if (!targetChannel.permissionsFor(interaction.member).has(PermissionFlagsBits.ManageChannels)) {
        return await interaction.reply({
          content: '❌ You do not have permission to rename this channel.',
          ephemeral: true
        });
      }

      // Rename the channel
      await targetChannel.setName(newName);

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Channel Renamed')
        .setDescription(`Successfully renamed channel to: **${newName}**`)
        .addFields(
          { name: '📋 Old Name', value: oldName, inline: true },
          { name: '📝 New Name', value: newName, inline: true }
        )
        .setColor(0x00ff00)
        .setFooter({ text: 'Channel Management' })
        .setTimestamp();

      await interaction.reply({
        embeds: [successEmbed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error renaming channel:', error);
      console.error('Error stack:', error.stack);
      await interaction.reply({
        content: `❌ Failed to rename channel: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

