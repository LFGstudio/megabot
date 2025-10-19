const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  name: 'test-modal',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('test-modal')
    .setDescription('Test the modal system'),

  async execute(interaction, client) {
    try {
      // Create a simple test modal
      const modal = new ModalBuilder()
        .setCustomId('test_modal')
        .setTitle('Test Modal');

      const usernameInput = new TextInputBuilder()
        .setCustomId('test_username')
        .setLabel('Test Username')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter a test username')
        .setRequired(true)
        .setMaxLength(30);

      const firstActionRow = new ActionRowBuilder().addComponents(usernameInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error in test-modal command:', error);
      await interaction.reply({
        content: '❌ An error occurred while showing the modal.',
        ephemeral: true
      });
    }
  }
};
