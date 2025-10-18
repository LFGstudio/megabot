const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'view',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View your TikTok stats and payout information')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('View stats for another user (Admin only)')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const User = require('../../models/User');
    
    try {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      
      // Check if user is trying to view someone else's stats without admin permissions
      if (targetUser.id !== interaction.user.id && !isAdmin) {
        return interaction.reply({
          content: '❌ You can only view your own stats unless you have administrator permissions.',
          ephemeral: true
        });
      }

      const user = await User.findOne({ discord_id: targetUser.id });

      if (!user) {
        return interaction.reply({
          content: '❌ User not found in database. They may not have completed the verification process.',
          ephemeral: true
        });
      }

      if (!user.tiktok_username) {
        const notConnectedEmbed = new EmbedBuilder()
          .setTitle('📊 Stats Not Available')
          .setColor(0xff8800)
          .setDescription('You need to connect your TikTok account to view stats.')
          .addFields(
            { name: '🔗 Connect TikTok', value: 'Use `/tiktok connect` to link your account', inline: false },
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

      // Create stats embed
      const statsEmbed = new EmbedBuilder()
        .setTitle(`📊 ${targetUser.displayName}'s TikTok Stats`)
        .setColor(0x0099ff)
        .setThumbnail(targetUser.displayAvatarURL())
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
        .addFields(
          { name: '📋 Status', value: 
            `✅ Verified: ${user.verified ? 'Yes' : 'No'}\n` +
            `🔥 Warm-up: ${user.warmup_done ? 'Complete' : 'Pending'}\n` +
            `🔗 TikTok: ${user.tiktok_connected_at ? 'Connected' : 'Not Connected'}`,
            inline: false
          }
        )
        .setFooter({ text: 'Stats update every 12 hours • Use /tiktok connect to link your account' })
        .setTimestamp(user.last_updated);

      // Add last payout info if available
      if (user.last_payout) {
        statsEmbed.addFields({
          name: '💰 Last Payout',
          value: `<t:${Math.floor(user.last_payout / 1000)}:R>`,
          inline: true
        });
      }

      await interaction.reply({
        embeds: [statsEmbed],
        ephemeral: targetUser.id !== interaction.user.id // Only show ephemeral if viewing someone else's stats
      });

    } catch (error) {
      console.error('Error in stats command:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching stats.',
        ephemeral: true
      });
    }
  }
};
