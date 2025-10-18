const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'setup',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the MegaBot interface (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      // Create the ticket embed
      const ticketEmbed = new EmbedBuilder()
        .setTitle('🎫 MegaViral Community Hub')
        .setDescription('Welcome to the MegaViral community! Click the buttons below to get started.')
        .addFields(
          {
            name: '📋 Available Actions',
            value: '• **Register Account** - Submit verification request\n• **Submit Warm-up** - Complete warm-up phase\n• **View Stats** - Check your performance\n• **Get Help** - Get assistance',
            inline: false
          }
        )
        .setColor(0x00ff00)
        .setFooter({ text: 'MegaBot Community System' })
        .setTimestamp();

      // Create the buttons
      const row1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('btn_register')
            .setLabel('Register Account')
            .setEmoji('📝')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('btn_warmup')
            .setLabel('Submit Warm-up')
            .setEmoji('🔥')
            .setStyle(ButtonStyle.Primary)
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('btn_stats')
            .setLabel('View My Stats')
            .setEmoji('📊')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('btn_help')
            .setLabel('Get Help')
            .setEmoji('❓')
            .setStyle(ButtonStyle.Secondary)
        );

      // Send the message
      await interaction.reply({
        embeds: [ticketEmbed],
        components: [row1, row2]
      });

    } catch (error) {
      console.error('Error in setup command:', error);
      await interaction.reply({
        content: '❌ An error occurred while setting up the interface.',
        ephemeral: true
      });
    }
  }
};
