const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const TikTokAccount = require('../models/TikTokAccount');
const User = require('../models/User');

async function handleAddNewAccount(interaction, client) {
  try {
    // Check if user has Clipper role
    const clipperRole = interaction.guild.roles.cache.get(client.config.roles.clipper);
    const hasClipperRole = clipperRole && interaction.member.roles.cache.has(clipperRole.id);
    
    if (!hasClipperRole) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Access Denied')
        .setDescription('You must complete the onboarding process and become a **Clipper** to add TikTok accounts.')
        .setColor(0xff0000)
        .addFields(
          { name: 'Current Status', value: hasClipperRole ? 'Clipper (Discord Role)' : 'Not Clipper', inline: true },
          { name: 'Required Status', value: 'Clipper', inline: true },
          { name: 'Next Steps', value: 'Complete your TikTok verification and warm-up process first!', inline: false }
        )
        .setFooter({ text: 'Use the onboarding flow to become a Clipper!' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if user has reached account limit (let's say 5 accounts max)
    const userAccounts = await TikTokAccount.getUserAccounts(interaction.user.id);
    if (userAccounts.length >= 5) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Account Limit Reached')
        .setDescription('You have reached the maximum number of TikTok accounts (5).')
        .setColor(0xff0000)
        .addFields(
          { name: 'Current Accounts', value: userAccounts.length.toString(), inline: true },
          { name: 'Maximum Allowed', value: '5', inline: true }
        )
        .setFooter({ text: 'Contact support if you need more accounts' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Create modal for TikTok account details
    const modal = new ModalBuilder()
      .setCustomId('add_tiktok_account_modal')
      .setTitle('Add New TikTok Account');

    const usernameInput = new TextInputBuilder()
      .setCustomId('tiktok_username')
      .setLabel('TikTok Username (without @)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., username123')
      .setRequired(true)
      .setMaxLength(30);

    const displayNameInput = new TextInputBuilder()
      .setCustomId('display_name')
      .setLabel('Display Name (optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., My TikTok Account')
      .setRequired(false)
      .setMaxLength(50);

    const countryInput = new TextInputBuilder()
      .setCustomId('country')
      .setLabel('Country (for payouts)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., United States, Canada, UK')
      .setRequired(true)
      .setMaxLength(50);

    const paymentMethodInput = new TextInputBuilder()
      .setCustomId('payment_method')
      .setLabel('Payment Method')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('PayPal or Wise')
      .setRequired(true)
      .setMaxLength(20);

    const notesInput = new TextInputBuilder()
      .setCustomId('account_notes')
      .setLabel('Notes (optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Any additional notes about this account...')
      .setRequired(false)
      .setMaxLength(500);

    const firstActionRow = new ActionRowBuilder().addComponents(usernameInput);
    const secondActionRow = new ActionRowBuilder().addComponents(displayNameInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(countryInput);
    const fourthActionRow = new ActionRowBuilder().addComponents(paymentMethodInput);
    const fifthActionRow = new ActionRowBuilder().addComponents(notesInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

    await interaction.showModal(modal);

  } catch (error) {
    console.error('Error in handleAddNewAccount:', error);
    await interaction.reply({
      content: '❌ An error occurred while setting up the account addition.',
      ephemeral: true
    });
  }
}

async function handleViewMyAccounts(interaction, client) {
  try {
    const userAccounts = await TikTokAccount.getUserAccounts(interaction.user.id);
    
    if (userAccounts.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📊 Your TikTok Accounts')
        .setDescription('You haven\'t added any TikTok accounts yet.')
        .setColor(0xffa500)
        .addFields(
          { name: '💡 Getting Started', value: 'Click "Add New Account" to add your first TikTok account!', inline: false }
        )
        .setFooter({ text: 'Your accounts will appear here once added' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 Your TikTok Accounts')
      .setDescription(`You have ${userAccounts.length} TikTok account(s) connected`)
      .setColor(0x00ff00)
      .setTimestamp();

    userAccounts.forEach((account, index) => {
      const statusEmoji = account.status === 'active' ? '✅' : '❌';
      const scrapingEmoji = account.scraping_enabled ? '🔄' : '⏸️';
      
      embed.addFields({
        name: `${statusEmoji} ${account.display_name || account.username}`,
        value: `**Username:** @${account.username}\n**Followers:** ${account.follower_count.toLocaleString()}\n**Videos:** ${account.video_count}\n**Scraping:** ${scrapingEmoji} ${account.scraping_enabled ? 'Enabled' : 'Disabled'}\n**Added:** ${new Date(account.added_at).toLocaleDateString()}`,
        inline: true
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (userAccounts) {
    console.error('Error in handleViewMyAccounts:', error);
    await interaction.reply({
      content: '❌ An error occurred while fetching your accounts.',
      ephemeral: true
    });
  }
}

async function handleViewMyStats(interaction, client) {
  try {
    // This would show performance stats for all user's accounts
    const embed = new EmbedBuilder()
      .setTitle('📈 Your Performance Stats')
      .setDescription('Performance statistics for all your TikTok accounts')
      .setColor(0x0099ff)
      .addFields(
        { name: '📊 Total Accounts', value: '3', inline: true },
        { name: '👀 Total Views', value: '1.2M', inline: true },
        { name: '💰 Total Earnings', value: '$450.00', inline: true },
        { name: '📈 Best Performing', value: '@account1 (500K views)', inline: false }
      )
      .setFooter({ text: 'Stats are updated every 6 hours' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Error in handleViewMyStats:', error);
    await interaction.reply({
      content: '❌ An error occurred while fetching your stats.',
      ephemeral: true
    });
  }
}

async function handleViewMyEarnings(interaction, client) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('💰 Your Earnings')
      .setDescription('Earnings breakdown for all your TikTok accounts')
      .setColor(0x00ff00)
      .addFields(
        { name: '💵 Total Earned', value: '$450.00', inline: true },
        { name: '💰 Pending', value: '$120.00', inline: true },
        { name: '📊 This Month', value: '$230.00', inline: true },
        { name: '🎯 Top Earner', value: '@account1: $180.00', inline: false }
      )
      .setFooter({ text: 'Payouts are processed weekly' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Error in handleViewMyEarnings:', error);
    await interaction.reply({
      content: '❌ An error occurred while fetching your earnings.',
      ephemeral: true
    });
  }
}

async function handleAccountHelp(interaction, client) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('❓ Account Management Help')
      .setDescription('Everything you need to know about managing your TikTok accounts')
      .setColor(0x0099ff)
      .addFields(
        { 
          name: '➕ Add New Account', 
          value: 'Add a new TikTok account for tracking. You can add up to 5 accounts.', 
          inline: false 
        },
        { 
          name: '📊 View My Accounts', 
          value: 'See all your connected TikTok accounts and their status.', 
          inline: false 
        },
        { 
          name: '📈 My Performance', 
          value: 'View performance statistics for all your accounts.', 
          inline: false 
        },
        { 
          name: '💰 My Earnings', 
          value: 'Check your earnings and payout information.', 
          inline: false 
        },
        { 
          name: '🔄 Automatic Tracking', 
          value: 'Your accounts are automatically scraped every 6 hours for new videos and view counts.', 
          inline: false 
        }
      )
      .setFooter({ text: 'Need more help? Contact support!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Error in handleAccountHelp:', error);
    await interaction.reply({
      content: '❌ An error occurred while fetching help information.',
      ephemeral: true
    });
  }
}

module.exports = {
  handleAddNewAccount,
  handleViewMyAccounts,
  handleViewMyStats,
  handleViewMyEarnings,
  handleAccountHelp
};
