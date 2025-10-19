const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const TikTokPost = require('../../models/TikTokPost');
const User = require('../../models/User');

module.exports = {
  name: 'updateviews',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('updateviews')
    .setDescription('Update TikTok post view counts (Admin only)')
    .addStringOption(option =>
      option
        .setName('post_id')
        .setDescription('TikTok post ID to update')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('total_views')
        .setDescription('Total view count')
        .setRequired(true)
        .setMinValue(0)
    )
    .addIntegerOption(option =>
      option
        .setName('tier1_views')
        .setDescription('Tier 1 view count')
        .setRequired(true)
        .setMinValue(0)
    )
    .addStringOption(option =>
      option
        .setName('analytics_screenshot')
        .setDescription('Analytics screenshot URL (optional)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      const postId = interaction.options.getString('post_id');
      const totalViews = interaction.options.getInteger('total_views');
      const tier1Views = interaction.options.getInteger('tier1_views');
      const analyticsScreenshot = interaction.options.getString('analytics_screenshot');

      // Validate tier1_views <= total_views
      if (tier1Views > totalViews) {
        return interaction.reply({
          content: '❌ Tier 1 views cannot be greater than total views.',
          ephemeral: true
        });
      }

      // Find the TikTok post
      const post = await TikTokPost.findOne({ tiktok_id: postId });
      if (!post) {
        return interaction.reply({
          content: '❌ TikTok post not found.',
          ephemeral: true
        });
      }

      // Update the post
      await post.updateViews(totalViews, tier1Views);
      
      if (analyticsScreenshot) {
        post.analytics_screenshot = analyticsScreenshot;
        await post.save();
      }

      // Update user's total stats
      const user = await User.findOne({ discord_id: post.user_id });
      if (user) {
        user.total_tiktok_views = (user.total_tiktok_views || 0) + (totalViews - post.total_views);
        user.total_tiktok_tier1_views = (user.total_tiktok_tier1_views || 0) + (tier1Views - post.tier1_views);
        await user.save();
      }

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('✅ TikTok Post Updated')
        .setColor(0x00ff00)
        .addFields(
          { name: '📱 TikTok ID', value: postId, inline: true },
          { name: '👀 Total Views', value: totalViews.toLocaleString(), inline: true },
          { name: '🎯 Tier 1 Views', value: tier1Views.toLocaleString(), inline: true },
          { name: '📈 Tier 1 Percentage', value: `${((tier1Views / totalViews) * 100).toFixed(1)}%`, inline: true },
          { name: '💵 Estimated Payout', value: `$${post.estimated_payout.toFixed(2)}`, inline: true },
          { name: '📊 Status', value: post.status, inline: true }
        )
        .setFooter({ text: 'Post updated successfully!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      // Send notification to user
      try {
        const user = await client.users.fetch(post.user_id);
        const userEmbed = new EmbedBuilder()
          .setTitle('📊 Your TikTok Post Updated!')
          .setColor(0x0099ff)
          .setDescription('Your TikTok post view counts have been updated!')
          .addFields(
            { name: '👀 Total Views', value: totalViews.toLocaleString(), inline: true },
            { name: '🎯 Tier 1 Views', value: tier1Views.toLocaleString(), inline: true },
            { name: '💵 Estimated Payout', value: `$${post.estimated_payout.toFixed(2)}`, inline: true }
          )
          .setFooter({ text: 'Keep posting to grow your earnings!' })
          .setTimestamp();

        await user.send({ embeds: [userEmbed] });
      } catch (dmError) {
        console.log(`Could not send DM to user ${post.user_id}:`, dmError.message);
      }

      // Log the action
      await client.logAction(
        'TikTok Views Updated',
        `<@${interaction.user.id}> updated views for TikTok post ${postId}: ${totalViews} total, ${tier1Views} tier1`
      );

    } catch (error) {
      console.error('Error in updateviews command:', error);
      await interaction.reply({
        content: '❌ An error occurred while updating the TikTok post.',
        ephemeral: true
      });
    }
  }
};
