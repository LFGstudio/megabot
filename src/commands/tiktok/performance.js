const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TikTokPost = require('../../models/TikTokPost');
const User = require('../../models/User');

module.exports = {
  name: 'performance',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('performance')
    .setDescription('View your TikTok performance and earnings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View your performance statistics')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('posts')
        .setDescription('View your tracked TikTok posts')
        .addIntegerOption(option =>
          option
            .setName('limit')
            .setDescription('Number of posts to show (max 10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('leaderboard')
        .setDescription('View top performing posts')
    ),

  async execute(interaction, client) {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'stats') {
        await this.handleStats(interaction, client);
      } else if (subcommand === 'posts') {
        await this.handlePosts(interaction, client);
      } else if (subcommand === 'leaderboard') {
        await this.handleLeaderboard(interaction, client);
      }

    } catch (error) {
      console.error('Error in performance command:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching performance data.',
        ephemeral: true
      });
    }
  },

  async handleStats(interaction, client) {
    try {
      // Get user's TikTok posts
      const posts = await TikTokPost.find({ user_id: interaction.user.id });
      
      if (posts.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('📊 Your Performance Stats')
          .setDescription('No TikTok posts found for your account yet.')
          .setColor(0xffa500)
          .addFields(
            { name: '💡 Getting Started', value: 'Your TikTok account is automatically tracked! Videos will appear here once they\'re scraped.', inline: false }
          )
          .setFooter({ text: 'Your account is monitored every 6 hours!' })
          .setTimestamp();

        return interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      // Calculate stats
      const totalViews = posts.reduce((sum, post) => sum + post.total_views, 0);
      const totalTier1Views = posts.reduce((sum, post) => sum + post.tier1_views, 0);
      const totalEstimatedPayout = posts.reduce((sum, post) => sum + post.estimated_payout, 0);
      const totalActualPayout = posts.reduce((sum, post) => sum + post.actual_payout, 0);
      const averageTier1Percentage = posts.length > 0 ? (totalTier1Views / totalViews) * 100 : 0;
      const completedPosts = posts.filter(post => post.status === 'completed').length;
      const paidPosts = posts.filter(post => post.status === 'paid').length;

      const embed = new EmbedBuilder()
        .setTitle('📊 Your Performance Stats')
        .setColor(0x0099ff)
        .addFields(
          { name: '📱 Total Posts Tracked', value: posts.length.toString(), inline: true },
          { name: '✅ Completed Posts', value: completedPosts.toString(), inline: true },
          { name: '💰 Paid Posts', value: paidPosts.toString(), inline: true },
          { name: '👀 Total Views', value: totalViews.toLocaleString(), inline: true },
          { name: '🎯 Tier 1 Views', value: totalTier1Views.toLocaleString(), inline: true },
          { name: '📈 Tier 1 Percentage', value: `${averageTier1Percentage.toFixed(1)}%`, inline: true },
          { name: '💵 Estimated Payout', value: `$${totalEstimatedPayout.toFixed(2)}`, inline: true },
          { name: '💰 Actual Payout', value: `$${totalActualPayout.toFixed(2)}`, inline: true },
          { name: '📊 Average per Post', value: `$${(totalEstimatedPayout / posts.length).toFixed(2)}`, inline: true }
        )
        .setFooter({ text: 'Keep posting to grow your earnings!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handleStats:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching your stats.',
        ephemeral: true
      });
    }
  },

  async handlePosts(interaction, client) {
    try {
      const limit = interaction.options.getInteger('limit') || 5;
      const posts = await TikTokPost.find({ user_id: interaction.user.id })
        .sort({ posted_at: -1 })
        .limit(limit);

      if (posts.length === 0) {
        return interaction.reply({
          content: '❌ You haven\'t added any TikTok posts for tracking yet.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('📱 Your TikTok Posts')
        .setDescription(`Showing your ${posts.length} most recent tracked posts`)
        .setColor(0x00ff00)
        .setTimestamp();

      posts.forEach((post, index) => {
        const statusEmoji = post.status === 'paid' ? '💰' : post.status === 'completed' ? '✅' : '📊';
        const payoutText = post.actual_payout > 0 ? `$${post.actual_payout.toFixed(2)}` : `$${post.estimated_payout.toFixed(2)}`;
        
        embed.addFields({
          name: `${statusEmoji} Post ${index + 1}`,
          value: `**Views:** ${post.total_views.toLocaleString()}\n**Tier 1:** ${post.tier1_views.toLocaleString()} (${post.tier1_percentage.toFixed(1)}%)\n**Payout:** ${payoutText}\n**Status:** ${post.status}\n[View Post](${post.tiktok_url})`,
          inline: true
        });
      });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handlePosts:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching your posts.',
        ephemeral: true
      });
    }
  },

  async handleLeaderboard(interaction, client) {
    try {
      const topPosts = await TikTokPost.find({ status: 'completed' })
        .sort({ tier1_views: -1 })
        .limit(10);

      if (topPosts.length === 0) {
        return interaction.reply({
          content: '❌ No completed posts found for the leaderboard.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Top Performing TikTok Posts')
        .setDescription('The highest performing posts in the community!')
        .setColor(0xffd700)
        .setFooter({ text: 'Ranked by Tier 1 views' })
        .setTimestamp();

      const leaderboard = topPosts.map((post, index) => {
        const position = index + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
        const username = post.user_id ? `<@${post.user_id}>` : 'Unknown User';
        return `${emoji} **${username}**: ${post.tier1_views.toLocaleString()} views → $${post.estimated_payout.toFixed(2)}`;
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
      console.error('Error in handleLeaderboard:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching the leaderboard.',
        ephemeral: true
      });
    }
  }
};
