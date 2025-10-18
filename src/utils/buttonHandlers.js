const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const User = require('../models/User');

class ButtonHandlers {
  constructor() {}

  async handleTicketRegister(interaction, client) {
    try {
      // Check if user already has a pending verification
      let user = await User.findOne({ discord_id: interaction.user.id });
      
      if (user && user.verification_submitted_at) {
        return interaction.reply({
          content: '❌ You have already submitted a verification request. Please wait for staff review.',
          ephemeral: true
        });
      }

      if (user && user.verified) {
        return interaction.reply({
          content: '❌ You are already verified!',
          ephemeral: true
        });
      }

      // Create modal for verification submission
      const modal = new ModalBuilder()
        .setCustomId('verify_modal')
        .setTitle('Account Verification');

      const tiktokUsernameInput = new TextInputBuilder()
        .setCustomId('tiktok_username')
        .setLabel('TikTok Username (without @)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter your TikTok username')
        .setRequired(true)
        .setMaxLength(24);

      const countryInput = new TextInputBuilder()
        .setCustomId('country')
        .setLabel('Country')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter your country')
        .setRequired(true)
        .setMaxLength(50);

      const profileLinkInput = new TextInputBuilder()
        .setCustomId('profile_link')
        .setLabel('TikTok Profile Link (optional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://www.tiktok.com/@username')
        .setRequired(false)
        .setMaxLength(100);

      const firstActionRow = new ActionRowBuilder().addComponents(tiktokUsernameInput);
      const secondActionRow = new ActionRowBuilder().addComponents(countryInput);
      const thirdActionRow = new ActionRowBuilder().addComponents(profileLinkInput);

      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error in handleTicketRegister:', error);
      await interaction.reply({
        content: '❌ An error occurred while opening the verification form.',
        ephemeral: true
      });
    }
  }

  async handleTicketWarmup(interaction, client) {
    try {
      const user = await User.findOne({ discord_id: interaction.user.id });
      
      if (!user || !user.verified) {
        return interaction.reply({
          content: '❌ You must complete verification first before submitting warm-up.',
          ephemeral: true
        });
      }

      if (user.warmup_done) {
        return interaction.reply({
          content: '❌ You have already completed the warm-up phase!',
          ephemeral: true
        });
      }

      // Create modal for warm-up submission
      const modal = new ModalBuilder()
        .setCustomId('warmup_modal')
        .setTitle('Warm-up Completion');

      const tiktokUsernameInput = new TextInputBuilder()
        .setCustomId('warmup_tiktok_username')
        .setLabel('TikTok Username')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter your TikTok username')
        .setRequired(true)
        .setMaxLength(24);

      const analyticsNoteInput = new TextInputBuilder()
        .setCustomId('analytics_note')
        .setLabel('Analytics Screenshot Note')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Upload your analytics screenshot in the next step')
        .setRequired(false)
        .setMaxLength(200);

      const firstActionRow = new ActionRowBuilder().addComponents(tiktokUsernameInput);
      const secondActionRow = new ActionRowBuilder().addComponents(analyticsNoteInput);

      modal.addComponents(firstActionRow, secondActionRow);

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error in handleTicketWarmup:', error);
      await interaction.reply({
        content: '❌ An error occurred while opening the warm-up form.',
        ephemeral: true
      });
    }
  }

  async handleTicketHelp(interaction, client) {
    try {
      const helpEmbed = new EmbedBuilder()
        .setTitle('❓ General Help - MegaViral Community')
        .setDescription('Here\'s how to get help and support in our community:')
        .addFields(
          {
            name: '📋 Getting Started',
            value: '1. Click "Register Account" to submit verification\n2. Wait for staff approval\n3. Complete warm-up phase\n4. Connect your TikTok for stats tracking',
            inline: false
          },
          {
            name: '🔧 Need Help?',
            value: '• Check our community guidelines\n• Ask questions in support channels\n• Contact staff members\n• Use the help buttons above',
            inline: false
          },
          {
            name: '📊 Tracking Progress',
            value: '• Use "View My Stats" to check your progress\n• Check the leaderboard for rankings\n• Monitor your payout estimates',
            inline: false
          }
        )
        .setColor(0x0099ff)
        .setFooter({ text: 'MegaBot Help System' })
        .setTimestamp();

      await interaction.reply({
        embeds: [helpEmbed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handleTicketHelp:', error);
      await interaction.reply({
        content: '❌ An error occurred while showing help information.',
        ephemeral: true
      });
    }
  }

  async handleTicketStats(interaction, client) {
    try {
      const user = await User.findOne({ discord_id: interaction.user.id });

      if (!user) {
        return interaction.reply({
          content: '❌ You are not registered in our system. Please use "Register Account" first.',
          ephemeral: true
        });
      }

      if (!user.tiktok_username) {
        const notConnectedEmbed = new EmbedBuilder()
          .setTitle('📊 Stats Not Available')
          .setColor(0xff8800)
          .setDescription('You need to connect your TikTok account to view stats.')
          .addFields(
            { name: '🔗 Connect TikTok', value: 'Complete the verification and warm-up process first', inline: false },
            { name: '📋 Requirements', value: '• Complete verification\n• Complete warm-up phase\n• Be a verified clipper', inline: false }
          )
          .setFooter({ text: 'MegaBot Stats System' })
          .setTimestamp();

        return interaction.reply({
          embeds: [notConnectedEmbed],
          ephemeral: true
        });
      }

      // Calculate stats
      const estimatedPayout = user.calculateEstimatedPayout();
      const nextPayout = user.getNextPayoutDate();
      const tier1Percentage = user.total_views > 0 ? ((user.tier1_views / user.total_views) * 100).toFixed(1) : 0;

      const statsEmbed = new EmbedBuilder()
        .setTitle(`📊 ${interaction.user.displayName}'s TikTok Stats`)
        .setColor(0x0099ff)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '📱 TikTok Username', value: user.tiktok_username, inline: true },
          { name: '🌍 Country', value: user.country || 'Not provided', inline: true },
          { name: '🏷️ Role', value: user.role, inline: true },
          { name: '📈 Total Views', value: user.total_views.toLocaleString(), inline: true },
          { name: '🎯 Tier 1 Views', value: user.tier1_views.toLocaleString(), inline: true },
          { name: '📊 Tier 1 %', value: `${tier1Percentage}%`, inline: true },
          { name: '💰 Estimated Payout', value: `$${estimatedPayout}`, inline: true },
          { name: '💳 Current Balance', value: `$${user.payout_balance}`, inline: true },
          { name: '📅 Next Payout', value: `<t:${Math.floor(nextPayout / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: 'Stats update every 12 hours' })
        .setTimestamp(user.last_updated);

      await interaction.reply({
        embeds: [statsEmbed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handleTicketStats:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching your stats.',
        ephemeral: true
      });
    }
  }

  async handleTicketLeaderboard(interaction, client) {
    try {
      const topUsers = await User.find({
        role: 'Clipper',
        tiktok_username: { $exists: true, $ne: null },
        tier1_views: { $gt: 0 }
      })
      .sort({ tier1_views: -1 })
      .limit(10);

      if (topUsers.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setTitle('🏆 Leaderboard')
          .setColor(0xffd700)
          .setDescription('No users found with the specified criteria.')
          .setFooter({ text: 'Users need to connect their TikTok accounts to appear on the leaderboard' })
          .setTimestamp();

        return interaction.reply({
          embeds: [emptyEmbed],
          ephemeral: true
        });
      }

      const leaderboardEmbed = new EmbedBuilder()
        .setTitle('🏆 Top 10 Clippers - Tier 1 Views')
        .setColor(0xffd700)
        .setDescription(
          topUsers.map((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const payout = Math.floor((user.tier1_views / 100000) * 15);
            return `${medal} <@${user.discord_id}> - ${user.tier1_views.toLocaleString()} views ($${payout})`;
          }).join('\n')
        )
        .setFooter({ text: 'Updates every 24 hours' })
        .setTimestamp();

      await interaction.reply({
        embeds: [leaderboardEmbed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handleTicketLeaderboard:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching the leaderboard.',
        ephemeral: true
      });
    }
  }
}

module.exports = new ButtonHandlers();
