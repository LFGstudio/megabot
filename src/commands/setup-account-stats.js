const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'setup-account-stats',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('setup-account-stats')
    .setDescription('Setup the My Account Stats channel with interactive buttons (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      // Create the main account stats embed
      const embed = new EmbedBuilder()
        .setTitle('📊 My Account Stats')
        .setDescription('Manage your TikTok accounts and view your performance statistics')
        .setColor(0x0099ff)
        .addFields(
          { 
            name: '🎯 Account Management', 
            value: 'Add new TikTok accounts, view your stats, and manage your portfolio', 
            inline: false 
          },
          { 
            name: '📈 Performance Tracking', 
            value: 'Monitor your views, earnings, and account performance', 
            inline: false 
          },
          { 
            name: '💰 Payouts', 
            value: 'Track your earnings and payout history', 
            inline: false 
          }
        )
        .setFooter({ text: 'Use the buttons below to manage your accounts' })
        .setTimestamp();

      // Create action row with buttons
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_new_account')
            .setLabel('➕ Add New Account')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📱'),
          new ButtonBuilder()
            .setCustomId('view_my_accounts')
            .setLabel('📊 View My Accounts')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👥'),
          new ButtonBuilder()
            .setCustomId('view_my_stats')
            .setLabel('📈 My Performance')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📊'),
          new ButtonBuilder()
            .setCustomId('view_my_earnings')
            .setLabel('💰 My Earnings')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💵'),
          new ButtonBuilder()
            .setCustomId('account_help')
            .setLabel('❓ Help')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🆘')
        );

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });

      // Log the action
      await client.logAction(
        'Account Stats Channel Setup',
        `<@${interaction.user.id}> set up the My Account Stats channel`
      );

    } catch (error) {
      console.error('Error in setup-account-stats command:', error);
      await interaction.reply({
        content: '❌ An error occurred while setting up the account stats channel.',
        ephemeral: true
      });
    }
  }
};
