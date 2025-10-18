const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'top',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top clippers leaderboard')
    .addStringOption(option =>
      option
        .setName('metric')
        .setDescription('Choose the ranking metric')
        .setRequired(false)
        .addChoices(
          { name: 'Tier 1 Views', value: 'tier1_views' },
          { name: 'Total Views', value: 'total_views' },
          { name: 'Payout Balance', value: 'payout_balance' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('limit')
        .setDescription('Number of users to show (max 25)')
        .setRequired(false)
        .setMinValue(5)
        .setMaxValue(25)
    ),

  async execute(interaction, client) {
    const User = require('../../models/User');
    
    try {
      const metric = interaction.options.getString('metric') || 'tier1_views';
      const limit = interaction.options.getInteger('limit') || 10;

      // Build sort object
      const sortObject = {};
      sortObject[metric] = -1;

      // Get top users
      const topUsers = await User.find({ 
        tiktok_username: { $exists: true, $ne: null },
        [metric]: { $gt: 0 }
      })
      .sort(sortObject)
      .limit(limit);

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

      // Get metric display info
      const metricInfo = {
        tier1_views: {
          title: 'Top Clippers - Tier 1 Views',
          emoji: '🎯',
          suffix: ' views',
          color: 0xffd700
        },
        total_views: {
          title: 'Top Clippers - Total Views',
          emoji: '📈',
          suffix: ' views',
          color: 0x00ff00
        },
        payout_balance: {
          title: 'Top Clippers - Payout Balance',
          emoji: '💰',
          suffix: '',
          color: 0x0099ff
        }
      };

      const info = metricInfo[metric];

      // Create leaderboard embed
      const leaderboardEmbed = new EmbedBuilder()
        .setTitle(`${info.emoji} ${info.title}`)
        .setColor(info.color)
        .setDescription(
          topUsers.map((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const value = metric === 'payout_balance' ? 
              `$${user[metric]}` : 
              user[metric].toLocaleString() + info.suffix;
            
            // Calculate additional payout for tier1_views and total_views
            let payoutInfo = '';
            if (metric !== 'payout_balance') {
              const estimatedPayout = Math.floor((user.tier1_views / 100000) * 15);
              payoutInfo = ` ($${estimatedPayout})`;
            }

            return `${medal} <@${user.discord_id}> - ${value}${payoutInfo}`;
          }).join('\n')
        )
        .setFooter({ text: `Showing top ${topUsers.length} users • Updates every 24 hours` })
        .setTimestamp();

      await interaction.reply({
        embeds: [leaderboardEmbed]
      });

    } catch (error) {
      console.error('Error in leaderboard command:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching the leaderboard.',
        ephemeral: true
      });
    }
  }
};
