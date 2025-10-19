const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const TikTokPost = require('../../models/TikTokPost');
const User = require('../../models/User');

module.exports = {
  name: 'addpost',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('addpost')
    .setDescription('Add a TikTok post for tracking')
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription('TikTok video URL')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('caption')
        .setDescription('Post caption (optional)')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    try {
      const url = interaction.options.getString('url');
      const caption = interaction.options.getString('caption') || '';
      
      // Validate TikTok URL
      if (!this.isValidTikTokUrl(url)) {
        return interaction.reply({
          content: '❌ Invalid TikTok URL. Please provide a valid TikTok video URL.',
          ephemeral: true
        });
      }

      // Extract TikTok ID from URL
      const tiktokId = this.extractTikTokId(url);
      if (!tiktokId) {
        return interaction.reply({
          content: '❌ Could not extract TikTok ID from URL. Please check the URL format.',
          ephemeral: true
        });
      }

      // Check if post already exists
      const existingPost = await TikTokPost.findOne({ 
        $or: [
          { tiktok_url: url },
          { tiktok_id: tiktokId }
        ]
      });

      if (existingPost) {
        return interaction.reply({
          content: '❌ This TikTok post is already being tracked.',
          ephemeral: true
        });
      }

      // Check if user has Clipper role
      const clipperRole = interaction.guild.roles.cache.get(client.config.roles.clipper);
      const hasClipperRole = clipperRole && interaction.member.roles.cache.has(clipperRole.id);
      
      if (!hasClipperRole) {
        return interaction.reply({
          content: '❌ You must be a Clipper to track TikTok posts.',
          ephemeral: true
        });
      }

      // Get or create user
      let user = await User.findOne({ discord_id: interaction.user.id });
      if (!user) {
        user = new User({ discord_id: interaction.user.id });
        await user.save();
      }

      // Create new TikTok post
      const tiktokPost = new TikTokPost({
        user_id: interaction.user.id,
        tiktok_url: url,
        tiktok_id: tiktokId,
        caption: caption
      });

      await tiktokPost.save();

      // Update user's total posts count
      user.tiktok_posts_count = (user.tiktok_posts_count || 0) + 1;
      await user.save();

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('✅ TikTok Post Added for Tracking')
        .setColor(0x00ff00)
        .addFields(
          { name: '📱 TikTok URL', value: url, inline: false },
          { name: '🆔 TikTok ID', value: tiktokId, inline: true },
          { name: '📝 Caption', value: caption || 'No caption provided', inline: true },
          { name: '📊 Status', value: 'Tracking started', inline: true }
        )
        .setFooter({ text: 'Your post is now being tracked for views and payouts!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      // Log the action
      await client.logAction(
        'TikTok Post Added',
        `<@${interaction.user.id}> added TikTok post for tracking: ${url}`
      );

    } catch (error) {
      console.error('Error in addpost command:', error);
      await interaction.reply({
        content: '❌ An error occurred while adding your TikTok post.',
        ephemeral: true
      });
    }
  },

  isValidTikTokUrl(url) {
    const tiktokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)\/.+/;
    return tiktokRegex.test(url);
  },

  extractTikTokId(url) {
    try {
      // Handle different TikTok URL formats
      let videoId = null;
      
      if (url.includes('/video/')) {
        // Standard TikTok URL: https://www.tiktok.com/@username/video/1234567890
        const match = url.match(/\/video\/(\d+)/);
        videoId = match ? match[1] : null;
      } else if (url.includes('vm.tiktok.com') || url.includes('m.tiktok.com')) {
        // Short URL format - would need to resolve to get actual ID
        // For now, we'll use the short URL as the ID
        videoId = url.split('/').pop().split('?')[0];
      }
      
      return videoId;
    } catch (error) {
      console.error('Error extracting TikTok ID:', error);
      return null;
    }
  }
};
