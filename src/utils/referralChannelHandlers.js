const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../models/User');
const Referral = require('../models/Referral');

class ReferralChannelHandlers {
  constructor() {}

  async handleGetReferralLink(interaction, client) {
    try {
      // Check if user has completed onboarding
      let user = await User.findOne({ discord_id: interaction.user.id });
      if (!user) {
        user = new User({ discord_id: interaction.user.id });
        await user.save();
      }

      // Check if user is a Clipper
      if (user.role !== 'Clipper') {
        const embed = new EmbedBuilder()
          .setTitle('❌ Access Denied')
          .setDescription('You must complete the onboarding process and become a **Clipper** to access the referral system.')
          .setColor(0xff0000)
          .addFields(
            { name: 'Current Status', value: user.role, inline: true },
            { name: 'Required Status', value: 'Clipper', inline: true },
            { name: 'Next Steps', value: 'Complete your TikTok verification and warm-up process first!', inline: false }
          )
          .setFooter({ text: 'Use the onboarding flow to become a Clipper!' })
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

          user.referral_invite_code = invite.code;
          await user.save();
        } catch (inviteError) {
          console.error('Error creating Discord invite:', inviteError);
        }
      }

      // Get referral stats
      const referrals = await Referral.find({ referrer_id: interaction.user.id, status: 'active' });
      const totalCommission = referrals.reduce((sum, ref) => sum + ref.commission_earned, 0);
      const unpaidCommission = referrals.reduce((sum, ref) => sum + ref.getUnpaidCommission(), 0);

      const embed = new EmbedBuilder()
        .setTitle('🔗 Your Referral Link is Ready!')
        .setDescription('Share this link to start earning 10% of your referrals\' earnings!')
        .setColor(0x00ff00)
        .addFields(
          { name: '🔗 Your Referral Link', value: `https://discord.gg/${user.referral_invite_code}`, inline: false },
          { name: '👥 Active Referrals', value: referrals.length.toString(), inline: true },
          { name: '💰 Total Commission Earned', value: `$${totalCommission.toFixed(2)}`, inline: true },
          { name: '💵 Unpaid Commission', value: `$${unpaidCommission.toFixed(2)}`, inline: true }
        )
        .setFooter({ text: 'Copy and share your link to start earning!' })
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
      console.error('Error in handleGetReferralLink:', error);
      await interaction.reply({
        content: '❌ An error occurred while generating your referral link.',
        ephemeral: true
      });
    }
  }

  async handleViewReferralStats(interaction, client) {
    try {
      const referrals = await Referral.find({ referrer_id: interaction.user.id })
        .populate('referred_user_id', 'tiktok_username tier1_views payout_balance')
        .sort({ joined_at: -1 });

      if (referrals.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('📊 Your Referral Stats')
          .setDescription('You haven\'t made any referrals yet. Share your link to start earning!')
          .setColor(0xffa500)
          .addFields(
            { name: '💡 Getting Started', value: 'Use the "Get My Referral Link" button to generate your unique link and start sharing!', inline: false }
          )
          .setFooter({ text: 'Share your link to start building your referral network!' })
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
      console.error('Error in handleViewReferralStats:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching your referral stats.',
        ephemeral: true
      });
    }
  }

  async handleReferralLeaderboard(interaction, client) {
    try {
      // Get top referrers
      const topReferrers = await User.aggregate([
        { $match: { affiliate_count: { $gt: 0 } } },
        { $sort: { referral_earnings: -1 } },
        { $limit: 15 }
      ]);

      if (topReferrers.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('🏆 Referral Leaderboard')
          .setDescription('No referrals have been made yet. Be the first to start earning!')
          .setColor(0xffa500)
          .addFields(
            { name: '💡 Getting Started', value: 'Complete your onboarding, get your referral link, and start sharing to appear on the leaderboard!', inline: false }
          )
          .setTimestamp();

        return interaction.reply({
          embeds: [embed],
          ephemeral: false
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
        const earnings = user.referral_earnings || 0;
        const count = user.affiliate_count || 0;
        return `${emoji} **${username}**: $${earnings.toFixed(2)} (${count} referrals)`;
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
  }

  async handleMyReferralEarnings(interaction, client) {
    try {
      const user = await User.findOne({ discord_id: interaction.user.id });
      if (!user) {
        return interaction.reply({
          content: '❌ You don\'t have a user profile yet. Complete the onboarding process first.',
          ephemeral: true
        });
      }

      const referrals = await Referral.find({ referrer_id: interaction.user.id, status: 'active' });
      const totalEarnings = referrals.reduce((sum, ref) => sum + ref.commission_earned, 0);
      const unpaidEarnings = referrals.reduce((sum, ref) => sum + ref.getUnpaidCommission(), 0);

      const embed = new EmbedBuilder()
        .setTitle('💵 Your Referral Earnings')
        .setColor(0x00ff00)
        .addFields(
          { name: '💰 Total Commission Earned', value: `$${totalEarnings.toFixed(2)}`, inline: true },
          { name: '💸 Unpaid Commission', value: `$${unpaidEarnings.toFixed(2)}`, inline: true },
          { name: '👥 Active Referrals', value: referrals.length.toString(), inline: true },
          { name: '📊 Average per Referral', value: referrals.length > 0 ? `$${(totalEarnings / referrals.length).toFixed(2)}` : '$0.00', inline: true }
        )
        .setFooter({ text: 'Commissions are paid monthly with regular payouts!' })
        .setTimestamp();

      if (referrals.length > 0) {
        const earningsBreakdown = referrals.slice(0, 10).map(ref => {
          const username = ref.referred_user_id?.tiktok_username || 'Unknown';
          const earnings = ref.affiliate_total_earnings || 0;
          const commission = ref.commission_earned || 0;
          return `• **${username}**: $${earnings.toFixed(2)} → $${commission.toFixed(2)} commission`;
        }).join('\n');

        embed.addFields({
          name: '📋 Earnings Breakdown',
          value: earningsBreakdown + (referrals.length > 10 ? `\n... and ${referrals.length - 10} more` : ''),
          inline: false
        });
      }

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handleMyReferralEarnings:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching your earnings.',
        ephemeral: true
      });
    }
  }

  async handleReferralRankings(interaction, client) {
    try {
      // Get comprehensive rankings
      const rankings = await User.aggregate([
        { $match: { affiliate_count: { $gt: 0 } } },
        { $sort: { referral_earnings: -1 } },
        { $limit: 20 }
      ]);

      if (rankings.length === 0) {
        return interaction.reply({
          content: '❌ No referral rankings available yet. Be the first to start earning!',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('📈 Referral Rankings')
        .setDescription('Community members ranked by referral earnings and performance!')
        .setColor(0x0099ff)
        .setFooter({ text: 'Updated in real-time • Climb the rankings!' })
        .setTimestamp();

      const rankingList = rankings.map((user, index) => {
        const position = index + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
        const username = user.tiktok_username || `User ${user.discord_id.slice(-4)}`;
        const earnings = user.referral_earnings || 0;
        const count = user.affiliate_count || 0;
        const avgEarnings = count > 0 ? (earnings / count).toFixed(2) : '0.00';
        return `${emoji} **${username}**: $${earnings.toFixed(2)} (${count} refs, $${avgEarnings} avg)`;
      }).join('\n');

      embed.addFields({
        name: '🏆 Rankings by Total Earnings',
        value: rankingList,
        inline: false
      });

      await interaction.reply({
        embeds: [embed],
        ephemeral: false
      });

    } catch (error) {
      console.error('Error in handleReferralRankings:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching the rankings.',
        ephemeral: true
      });
    }
  }

  async handleReferralTips(interaction, client) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('💡 Referral Success Tips')
        .setDescription('Learn how to maximize your referral earnings and grow your network!')
        .setColor(0xff8800)
        .addFields(
          {
            name: '🎯 Quality Over Quantity',
            value: 'Focus on referring people who will actually participate and earn. One active referral is worth more than 10 inactive ones.',
            inline: false
          },
          {
            name: '📱 Share on Multiple Platforms',
            value: '• Social media (Twitter, Instagram, TikTok)\n• Discord communities\n• Reddit (where appropriate)\n• Personal networks and friends',
            inline: false
          },
          {
            name: '💬 Effective Messaging',
            value: '• Highlight the earning potential\n• Explain the simple process\n• Share your own success story\n• Be transparent about requirements',
            inline: false
          },
          {
            name: '📊 Track and Optimize',
            value: '• Monitor your referral stats regularly\n• See which sources bring the best referrals\n• Learn from top performers\n• Adjust your strategy based on results',
            inline: false
          },
          {
            name: '🤝 Build Relationships',
            value: '• Help your referrals succeed\n• Answer their questions\n• Share tips and strategies\n• Celebrate their wins together',
            inline: false
          }
        )
        .setFooter({ text: 'Success comes from consistent effort and quality referrals!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handleReferralTips:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching referral tips.',
        ephemeral: true
      });
    }
  }
}

module.exports = new ReferralChannelHandlers();
