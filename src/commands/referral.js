const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const User = require('../models/User');
const Referral = require('../models/Referral');

module.exports = {
  name: 'referral',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('referral')
    .setDescription('Manage your referral system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('link')
        .setDescription('Get your referral invite link and stats')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View your referral performance and earnings')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('leaderboard')
        .setDescription('View the top referrers in the community')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('payouts')
        .setDescription('Generate affiliate payouts (Admin only)')
    ),

  async execute(interaction, client) {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'link') {
        await this.handleReferralLink(interaction, client);
      } else if (subcommand === 'stats') {
        await this.handleReferralStats(interaction, client);
      } else if (subcommand === 'leaderboard') {
        await this.handleReferralLeaderboard(interaction, client);
      } else if (subcommand === 'payouts') {
        // Check admin permissions for payouts
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: '❌ You need administrator permissions to use this command.',
            ephemeral: true
          });
        }
        await this.handleAffiliatePayouts(interaction, client);
      }

    } catch (error) {
      console.error('Error in referral command:', error);
      await interaction.reply({
        content: '❌ An error occurred while processing your referral request.',
        ephemeral: true
      });
    }
  },

  async handleReferralLink(interaction, client) {
    try {
      // Get or create user
      let user = await User.findOne({ discord_id: interaction.user.id });
      if (!user) {
        user = new User({ discord_id: interaction.user.id });
        await user.save();
      }

      // Check if user has completed onboarding (must be Clipper to get referral link)
      if (user.role !== 'Clipper') {
        const embed = new EmbedBuilder()
          .setTitle('❌ Access Denied')
          .setDescription('You must complete the onboarding process and become a Clipper to access the referral system.')
          .setColor(0xff0000)
          .addFields(
            { name: 'Current Status', value: user.role, inline: true },
            { name: 'Required Status', value: 'Clipper', inline: true }
          )
          .setFooter({ text: 'Complete your onboarding to start earning from referrals!' })
          .setTimestamp();

        return interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      // Generate referral code if not exists
      if (!user.referral_invite_code) {
        user.referral_invite_code = user.generateReferralCode();
        user.referral_invite_created_at = new Date();
        await user.save();

        // Create Discord invite
        try {
          const invite = await interaction.guild.invites.create(
            client.config.channels.welcome || interaction.channel.id,
            {
              code: user.referral_invite_code,
              maxUses: 0, // Unlimited uses
              maxAge: 0, // Never expires
              unique: true
            }
          );

          // Store the invite code
          user.referral_invite_code = invite.code;
          await user.save();

        } catch (inviteError) {
          console.error('Error creating Discord invite:', inviteError);
          // Fallback to a simple referral code
        }
      }

      // Get referral stats
      const referrals = await Referral.find({ referrer_id: interaction.user.id, status: 'active' });
      const totalCommission = referrals.reduce((sum, ref) => sum + ref.commission_earned, 0);
      const unpaidCommission = referrals.reduce((sum, ref) => sum + ref.getUnpaidCommission(), 0);

      const embed = new EmbedBuilder()
        .setTitle('🎯 Your Referral System')
        .setDescription('Share your link to earn 10% of your referrals\' earnings!')
        .setColor(0x00ff00)
        .addFields(
          { name: '🔗 Your Referral Link', value: `https://discord.gg/${user.referral_invite_code}`, inline: false },
          { name: '👥 Active Referrals', value: referrals.length.toString(), inline: true },
          { name: '💰 Total Commission Earned', value: `$${totalCommission.toFixed(2)}`, inline: true },
          { name: '💵 Unpaid Commission', value: `$${unpaidCommission.toFixed(2)}`, inline: true }
        )
        .setFooter({ text: 'Share your link and start earning!' })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('copy_referral_link')
            .setLabel('Copy Link')
            .setEmoji('📋')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handleReferralLink:', error);
      await interaction.reply({
        content: '❌ An error occurred while generating your referral link.',
        ephemeral: true
      });
    }
  },

  async handleReferralStats(interaction, client) {
    try {
      const referrals = await Referral.find({ referrer_id: interaction.user.id })
        .populate('referred_user_id', 'tiktok_username tier1_views payout_balance')
        .sort({ joined_at: -1 });

      if (referrals.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('📊 Your Referral Stats')
          .setDescription('You haven\'t made any referrals yet. Share your link to start earning!')
          .setColor(0xffa500)
          .setFooter({ text: 'Use /referral link to get your referral link' })
          .setTimestamp();

        return interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const totalCommission = referrals.reduce((sum, ref) => sum + ref.commission_earned, 0);
      const unpaidCommission = referrals.reduce((sum, ref) => sum + ref.getUnpaidCommission(), 0);
      const activeReferrals = referrals.filter(ref => ref.status === 'active').length;

      const embed = new EmbedBuilder()
        .setTitle('📊 Your Referral Performance')
        .setColor(0x0099ff)
        .addFields(
          { name: '👥 Total Referrals', value: referrals.length.toString(), inline: true },
          { name: '✅ Active Referrals', value: activeReferrals.toString(), inline: true },
          { name: '💰 Total Commission', value: `$${totalCommission.toFixed(2)}`, inline: true },
          { name: '💵 Unpaid Commission', value: `$${unpaidCommission.toFixed(2)}`, inline: true },
          { name: '📈 Average per Referral', value: `$${(totalCommission / referrals.length).toFixed(2)}`, inline: true }
        )
        .setFooter({ text: 'Keep sharing to grow your earnings!' })
        .setTimestamp();

      // Add recent referrals
      const recentReferrals = referrals.slice(0, 5);
      if (recentReferrals.length > 0) {
        const referralList = recentReferrals.map(ref => {
          const username = ref.referred_user_id?.tiktok_username || 'Unknown';
          const earnings = ref.affiliate_total_earnings || 0;
          const commission = ref.commission_earned || 0;
          return `• **${username}**: $${earnings.toFixed(2)} earned → $${commission.toFixed(2)} commission`;
        }).join('\n');

        embed.addFields({
          name: '📋 Recent Referrals',
          value: referralList,
          inline: false
        });
      }

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handleReferralStats:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching your referral stats.',
        ephemeral: true
      });
    }
  },

  async handleReferralLeaderboard(interaction, client) {
    try {
      // Get top referrers
      const topReferrers = await User.aggregate([
        { $match: { affiliate_count: { $gt: 0 } } },
        { $sort: { referral_earnings: -1 } },
        { $limit: 10 }
      ]);

      if (topReferrers.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('🏆 Referral Leaderboard')
          .setDescription('No referrals have been made yet. Be the first to start earning!')
          .setColor(0xffa500)
          .setTimestamp();

        return interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Top Referrers')
        .setDescription('The community members earning the most from referrals!')
        .setColor(0xffd700)
        .setFooter({ text: 'Earn 10% of your referrals\' earnings!' })
        .setTimestamp();

      const leaderboard = topReferrers.map((user, index) => {
        const position = index + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
        const username = user.tiktok_username || `User ${user.discord_id.slice(-4)}`;
        return `${emoji} **${username}**: $${user.referral_earnings.toFixed(2)} (${user.affiliate_count} referrals)`;
      }).join('\n');

      embed.addFields({
        name: '💰 Top Earners',
        value: leaderboard,
        inline: false
      });

      await interaction.reply({
        embeds: [embed],
        ephemeral: false
      });

    } catch (error) {
      console.error('Error in handleReferralLeaderboard:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching the referral leaderboard.',
        ephemeral: true
      });
    }
  },

  async handleAffiliatePayouts(interaction, client) {
    try {
      // Get all active referrals with unpaid commission
      const referrals = await Referral.find({ 
        status: 'active',
        $expr: { $gt: ['$commission_earned', '$total_commission_paid'] }
      }).populate('referrer_id', 'discord_id tiktok_username referral_earnings');

      if (referrals.length === 0) {
        return interaction.reply({
          content: '✅ No pending affiliate payouts found.',
          ephemeral: true
        });
      }

      let totalPayouts = 0;
      const payoutSummary = [];

      for (const referral of referrals) {
        const unpaidAmount = referral.getUnpaidCommission();
        if (unpaidAmount > 0) {
          // Update referrer's balance
          await referral.referrer_id.addReferralEarnings(unpaidAmount);
          await referral.markCommissionPaid(unpaidAmount);
          
          totalPayouts += unpaidAmount;
          payoutSummary.push({
            referrer: referral.referrer_id.tiktok_username || `User ${referral.referrer_id.discord_id.slice(-4)}`,
            amount: unpaidAmount
          });
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('💰 Affiliate Payouts Generated')
        .setColor(0x00ff00)
        .addFields(
          { name: '📊 Total Payouts', value: `$${totalPayouts.toFixed(2)}`, inline: true },
          { name: '👥 Recipients', value: payoutSummary.length.toString(), inline: true },
          { name: '📅 Generated', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: 'Affiliate commissions have been added to user balances' })
        .setTimestamp();

      // Add payout details
      if (payoutSummary.length > 0) {
        const payoutList = payoutSummary.slice(0, 10).map(payout => 
          `• **${payout.referrer}**: $${payout.amount.toFixed(2)}`
        ).join('\n');

        embed.addFields({
          name: '💵 Payout Details',
          value: payoutList + (payoutSummary.length > 10 ? `\n... and ${payoutSummary.length - 10} more` : ''),
          inline: false
        });
      }

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      // Log the action
      await client.logAction(
        'Affiliate Payouts Generated',
        `<@${interaction.user.id}> generated $${totalPayouts.toFixed(2)} in affiliate payouts for ${payoutSummary.length} users`
      );

    } catch (error) {
      console.error('Error in handleAffiliatePayouts:', error);
      await interaction.reply({
        content: '❌ An error occurred while generating affiliate payouts.',
        ephemeral: true
      });
    }
  }
};
