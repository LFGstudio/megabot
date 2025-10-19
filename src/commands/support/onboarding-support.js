const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  name: 'onboarding-support',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('onboarding-support')
    .setDescription('Get help with your onboarding process'),

  async execute(interaction) {
    try {
      // Create support ticket embed
      const supportEmbed = new EmbedBuilder()
        .setTitle('🆘 Onboarding Support')
        .setDescription('Need help with your onboarding process? We\'re here to assist you every step of the way!')
        .setColor(0x0099ff)
        .addFields(
          {
            name: '📋 Common Issues',
            value: '• Account verification problems\n• TikTok setup questions\n• Warm-up process guidance\n• Technical difficulties',
            inline: false
          },
          {
            name: '⚡ Quick Help',
            value: 'Click "Create Support Ticket" below to get personalized assistance from our support team.',
            inline: false
          },
          {
            name: '⏰ Response Time',
            value: 'We typically respond within 24 hours during business days.',
            inline: false
          }
        )
        .setFooter({ text: 'MegaViral Support Team' })
        .setTimestamp();

      // Create action row with support button
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('create_onboarding_ticket')
            .setLabel('Create Support Ticket')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.reply({
        embeds: [supportEmbed],
        components: [row]
      });

    } catch (error) {
      console.error('Error in onboarding-support command:', error);
      await interaction.reply({
        content: '❌ An error occurred while setting up support.',
        ephemeral: true
      });
    }
  }
};
