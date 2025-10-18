const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'ticket',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a ticket system message (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      // Check if user has admin permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ You need administrator permissions to use this command.',
          ephemeral: true
        });
      }

      // Create the ticket embed
      const ticketEmbed = new EmbedBuilder()
        .setTitle('🎫 MegaViral Ticketing System')
        .setDescription('Welcome to the MegaViral community! Use the buttons below to get started or get help.')
        .addFields(
          {
            name: '📋 Available Options',
            value: '• **Register Account** - Submit your verification request\n• **Get Feedback** - Submit warm-up completion\n• **General Help** - Get assistance with any questions',
            inline: false
          }
        )
        .setColor(0x00ff00)
        .setFooter({ text: 'MegaBot Ticketing System' })
        .setTimestamp();

      // Create the buttons
      const row1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_register')
            .setLabel('Register Account')
            .setEmoji('📝')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('ticket_warmup')
            .setLabel('Submit Warm-up')
            .setEmoji('🔥')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('ticket_help')
            .setLabel('General Help')
            .setEmoji('❓')
            .setStyle(ButtonStyle.Secondary)
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_stats')
            .setLabel('View My Stats')
            .setEmoji('📊')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('ticket_leaderboard')
            .setLabel('Leaderboard')
            .setEmoji('🏆')
            .setStyle(ButtonStyle.Secondary)
        );

      // Send the ticket message
      await interaction.reply({
        embeds: [ticketEmbed],
        components: [row1, row2]
      });

      // Log the action
      await client.logAction(
        'Ticket System Created',
        `<@${interaction.user.id}> created the ticketing system message`
      );

    } catch (error) {
      console.error('Error in ticket command:', error);
      await interaction.reply({
        content: '❌ An error occurred while creating the ticket system.',
        ephemeral: true
      });
    }
  }
};
