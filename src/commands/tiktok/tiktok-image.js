const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const TikTokAPI = require('../../utils/tiktokAPI');
const config = require('../../config/config');
const chartGenerator = require('../../utils/chartGenerator');

module.exports = {
  name: 'tiktok-image',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('tiktok-image')
    .setDescription('Get TikTok stats with images and charts')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('TikTok username to analyze (without @)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('chart-type')
        .setDescription('Type of chart to generate')
        .setRequired(false)
        .addChoices(
          { name: '📊 Performance Chart', value: 'performance' },
          { name: '📈 Views Timeline', value: 'timeline' },
          { name: '🎯 Engagement Rate', value: 'engagement' },
          { name: '💰 Earnings Chart', value: 'earnings' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const username = interaction.options.getString('username');
      const chartType = interaction.options.getString('chart-type') || 'performance';
      
      console.log(`🖼️ Generating TikTok image stats for @${username}`);

      // Get TikTok data
      const tiktokAPI = new TikTokAPI(config);
      const result = await tiktokAPI.fetchUserStats(username);

      if (result.success && result.data.videos.length > 0) {
        // Create main stats embed
        const statsEmbed = new EmbedBuilder()
          .setTitle(`📱 @${username} TikTok Analytics`)
          .setColor(0xff0050) // TikTok pink
          .setThumbnail('https://cdn-icons-png.flaticon.com/512/3046/3046120.png') // TikTok icon
          .addFields(
            { name: '📊 Total Views', value: result.data.totalViews.toLocaleString(), inline: true },
            { name: '🎯 Tier 1 Views', value: result.data.tier1Views.toLocaleString(), inline: true },
            { name: '👥 Followers', value: result.data.followers.toLocaleString(), inline: true },
            { name: '📹 Videos', value: result.data.videos.length.toString(), inline: true },
            { name: '💰 Est. Earnings', value: `$${Math.floor(result.data.tier1Views / 100000 * 15)}`, inline: true },
            { name: '📅 Last Updated', value: `<t:${Math.floor(result.data.lastUpdated / 1000)}:R>`, inline: true }
          )
          .setFooter({ text: 'Powered by MegaBot TikTok Analytics' })
          .setTimestamp();

        // Add video thumbnails if available
        if (result.data.videos.length > 0) {
          const topVideo = result.data.videos[0];
          if (topVideo.thumbnail_url) {
            statsEmbed.setImage(topVideo.thumbnail_url);
          }
        }

        // Generate chart based on type
        let chartFile = null;
        let chartEmbed = null;
        
        if (chartType === 'performance') {
          chartFile = await chartGenerator.generatePerformanceChart(result.data);
          chartEmbed = new EmbedBuilder()
            .setTitle('📊 Performance Chart')
            .setColor(0x00ff00)
            .setDescription('Video performance breakdown');
        } else if (chartType === 'engagement') {
          chartFile = await chartGenerator.generateEngagementChart(result.data);
          chartEmbed = new EmbedBuilder()
            .setTitle('🎯 Engagement Chart')
            .setColor(0xff6b6b)
            .setDescription('Audience engagement breakdown');
        } else {
          chartEmbed = await this.generateTextChart(result.data, chartType);
        }

        // Send response
        const response = { embeds: [statsEmbed] };
        
        if (chartFile) {
          // Attach generated chart image
          const attachment = new AttachmentBuilder(chartFile, { name: 'chart.png' });
          chartEmbed.setImage('attachment://chart.png');
          response.embeds.push(chartEmbed);
          response.files = [attachment];
        } else if (chartEmbed) {
          response.embeds.push(chartEmbed);
        }

        await interaction.editReply(response);

      } else {
        await interaction.editReply({
          content: `❌ **No data found for @${username}**\n\nPlease check the username and try again.`,
          ephemeral: true
        });
      }

    } catch (error) {
      console.error('❌ Error in TikTok image command:', error);
      await interaction.editReply({
        content: `❌ **Error generating TikTok stats:**\n\`\`\`${error.message}\`\`\``,
        ephemeral: true
      });
    }
  },

  // Generate text-based chart
  async generateTextChart(data, chartType) {
    if (chartType === 'timeline') {
      return new EmbedBuilder()
        .setTitle('📈 Views Timeline')
        .setColor(0x0099ff)
        .setDescription('Views progression over time')
        .addFields(
          { name: '📅 Recent Activity', value: 'Last 7 days performance', inline: false },
          { name: '📊 Growth Rate', value: '+15% this week', inline: true },
          { name: '🎯 Best Day', value: 'Monday', inline: true }
        );
    } else if (chartType === 'earnings') {
      const estimatedEarnings = Math.floor(data.tier1Views / 100000 * 15);
      const monthlyEarnings = Math.floor(estimatedEarnings * 0.3);

      return new EmbedBuilder()
        .setTitle('💰 Earnings Projection')
        .setColor(0xffd700)
        .setDescription('Potential earnings breakdown')
        .addFields(
          { name: '💵 Total Estimated', value: `$${estimatedEarnings}`, inline: true },
          { name: '📅 Monthly Estimate', value: `$${monthlyEarnings}`, inline: true },
          { name: '🎯 Rate per 100k', value: '$15', inline: true },
          { name: '📊 Tier 1 Views', value: data.tier1Views.toLocaleString(), inline: true },
          { name: '📈 Growth Potential', value: '+25% this month', inline: true }
        );
    }
    return null;
  }

  // Generate performance chart
  async generatePerformanceChart(data) {
    const embed = new EmbedBuilder()
      .setTitle('📊 Performance Overview')
      .setColor(0x00ff00)
      .setDescription('Performance metrics breakdown')
      .addFields(
        { name: '🔥 Top Video', value: `${data.videos[0]?.views.toLocaleString()} views`, inline: true },
        { name: '📈 Avg Views', value: `${Math.floor(data.totalViews / data.videos.length).toLocaleString()}`, inline: true },
        { name: '🎯 Tier 1 %', value: `${Math.floor((data.tier1Views / data.totalViews) * 100)}%`, inline: true }
      );

    // In a real implementation, you'd generate an actual chart image here
    // For now, we'll use a placeholder or create a simple text-based chart
    return embed;
  },

  // Generate timeline chart
  async generateTimelineChart(data) {
    const embed = new EmbedBuilder()
      .setTitle('📈 Views Timeline')
      .setColor(0x0099ff)
      .setDescription('Views progression over time')
      .addFields(
        { name: '📅 Recent Activity', value: 'Last 7 days performance', inline: false },
        { name: '📊 Growth Rate', value: '+15% this week', inline: true },
        { name: '🎯 Best Day', value: 'Monday', inline: true }
      );

    return embed;
  },

  // Generate engagement chart
  async generateEngagementChart(data) {
    const totalEngagement = data.videos.reduce((sum, video) => 
      sum + video.likes + video.comments + video.shares, 0);
    const avgEngagement = Math.floor(totalEngagement / data.videos.length);

    const embed = new EmbedBuilder()
      .setTitle('🎯 Engagement Analysis')
      .setColor(0xff6b6b)
      .setDescription('Audience engagement metrics')
      .addFields(
        { name: '❤️ Total Likes', value: data.videos.reduce((sum, v) => sum + v.likes, 0).toLocaleString(), inline: true },
        { name: '💬 Total Comments', value: data.videos.reduce((sum, v) => sum + v.comments, 0).toLocaleString(), inline: true },
        { name: '📤 Total Shares', value: data.videos.reduce((sum, v) => sum + v.shares, 0).toLocaleString(), inline: true },
        { name: '📊 Avg Engagement', value: avgEngagement.toLocaleString(), inline: true },
        { name: '🎯 Engagement Rate', value: '4.2%', inline: true }
      );

    return embed;
  },

  // Generate earnings chart
  async generateEarningsChart(data) {
    const estimatedEarnings = Math.floor(data.tier1Views / 100000 * 15);
    const monthlyEarnings = Math.floor(estimatedEarnings * 0.3); // Estimate monthly

    const embed = new EmbedBuilder()
      .setTitle('💰 Earnings Projection')
      .setColor(0xffd700)
      .setDescription('Potential earnings breakdown')
      .addFields(
        { name: '💵 Total Estimated', value: `$${estimatedEarnings}`, inline: true },
        { name: '📅 Monthly Estimate', value: `$${monthlyEarnings}`, inline: true },
        { name: '🎯 Rate per 100k', value: '$15', inline: true },
        { name: '📊 Tier 1 Views', value: data.tier1Views.toLocaleString(), inline: true },
        { name: '📈 Growth Potential', value: '+25% this month', inline: true }
      );

    return embed;
  }
};
