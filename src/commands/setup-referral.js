const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'setup-referral',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('setup-referral')
    .setDescription('Setup the referral system channels (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Create the referral setup channel with buttons')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('earnings')
        .setDescription('Create the referral earnings and ranking channel')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'channel') {
        await this.createReferralChannel(interaction, client);
      } else if (subcommand === 'earnings') {
        await this.createEarningsChannel(interaction, client);
      }

    } catch (error) {
      console.error('Error in setup-referral command:', error);
      await interaction.reply({
        content: '❌ An error occurred while setting up the referral channels.',
        ephemeral: true
      });
    }
  },

  async createReferralChannel(interaction, client) {
    const setupEmbed = new EmbedBuilder()
      .setTitle('🎯 MegaViral Referral System')
      .setDescription('Earn **10% commission** from every person you refer to our community!')
      .setColor(0x00ff00)
      .addFields(
        {
          name: '💰 How It Works',
          value: '1️⃣ Get your unique referral link\n2️⃣ Share it with friends\n3️⃣ When they join and start earning, you get 10% of their earnings!\n4️⃣ Get paid monthly with detailed reports',
          inline: false
        },
        {
          name: '🚀 Benefits',
          value: '• **Automatic tracking** - no codes needed\n• **Monthly payouts** - get paid regularly\n• **Detailed stats** - track your performance\n• **Leaderboards** - compete with other referrers\n• **Easy sharing** - simple link sharing',
          inline: false
        },
        {
          name: '📋 Requirements',
          value: '• Must complete onboarding and become a **Clipper**\n• Must have a verified TikTok account\n• Must be active in the community',
          inline: false
        },
        {
          name: '💡 Tips for Success',
          value: '• Share on social media platforms\n• Tell friends about the earning potential\n• Focus on quality referrals who will actually participate\n• Track your performance regularly',
          inline: false
        }
      )
      .setFooter({ text: 'Click the buttons below to get started!' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('get_referral_link')
          .setLabel('Get My Referral Link')
          .setEmoji('🔗')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('view_referral_stats')
          .setLabel('View My Stats')
          .setEmoji('📊')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('referral_leaderboard')
          .setLabel('Leaderboard')
          .setEmoji('🏆')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({
      embeds: [setupEmbed],
      components: [row]
    });
  },

  async createEarningsChannel(interaction, client) {
    const earningsEmbed = new EmbedBuilder()
      .setTitle('💰 Referral Earnings & Rankings')
      .setDescription('Track your referral performance and see how you rank against other community members!')
      .setColor(0xffd700)
      .addFields(
        {
          name: '📊 Your Performance',
          value: 'Use the buttons below to view your personal referral stats and earnings.',
          inline: false
        },
        {
          name: '🏆 Community Rankings',
          value: 'See who\'s earning the most from referrals and get inspired to grow your network!',
          inline: false
        },
        {
          name: '💡 Pro Tips',
          value: '• **Quality over quantity** - focus on active referrals\n• **Consistent sharing** - share your link regularly\n• **Track performance** - monitor your stats weekly\n• **Learn from top performers** - see what works for others',
          inline: false
        }
      )
      .setFooter({ text: 'Updated in real-time • Check back regularly!' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('my_referral_earnings')
          .setLabel('My Earnings')
          .setEmoji('💵')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('referral_rankings')
          .setLabel('View Rankings')
          .setEmoji('📈')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('referral_tips')
          .setLabel('Success Tips')
          .setEmoji('💡')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({
      embeds: [earningsEmbed],
      components: [row]
    });
  }
};
