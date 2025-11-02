const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const onboardingDataCollector = require('../../utils/onboardingDataCollector');
const OnboardingData = require('../../models/OnboardingData');

module.exports = {
  name: 'export-onboarding-data',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('export-onboarding-data')
    .setDescription('Export onboarding data (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('Export data for a specific user')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to export data for')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('all')
        .setDescription('Export all onboarding data as CSV')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View statistics about collected data')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      // Check admin permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
          content: '❌ You need administrator permissions to use this command.',
          ephemeral: true
        });
      }

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'user') {
        await handleExportUser(interaction);
      } else if (subcommand === 'all') {
        await handleExportAll(interaction);
      } else if (subcommand === 'stats') {
        await handleStats(interaction);
      }
    } catch (error) {
      console.error('Error in export-onboarding-data command:', error);
      await interaction.reply({
        content: '❌ An error occurred while processing your request.',
        ephemeral: true
      });
    }
  }
};

async function handleExportUser(interaction) {
  const targetUser = interaction.options.getUser('user');
  const data = await onboardingDataCollector.exportUserData(targetUser.id);

  if (!data) {
    return await interaction.reply({
      content: `❌ No onboarding data found for ${targetUser.tag}.`,
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`📊 Onboarding Data: ${targetUser.tag}`)
    .setDescription(`Complete data export for ${targetUser.tag}`)
    .addFields(
      { name: '📈 Data Completeness', value: `${data.data_completeness.overall}%`, inline: true },
      { name: '🌍 Country', value: data.personal_info.country || 'Not provided', inline: true },
      { name: '📱 TikTok Username', value: data.tiktok_info.username || 'Not provided', inline: true },
      { name: '🔗 TikTok Profile', value: data.tiktok_info.profile_link || 'Not provided', inline: false },
      { name: '💳 Payment Method', value: data.payment_info.payment_method || 'Not provided', inline: true },
      { name: '✅ Account Verified', value: data.verification.account_verified ? 'Yes' : 'No', inline: true },
      { name: '📅 Collected At', value: `<t:${Math.floor(new Date(data.collected_at).getTime() / 1000)}:F>`, inline: true },
      { name: '🔄 Last Updated', value: `<t:${Math.floor(new Date(data.last_updated).getTime() / 1000)}:F>`, inline: true }
    )
    .setColor(0x5865F2)
    .setTimestamp();

  // Create JSON file attachment
  const jsonData = JSON.stringify(data, null, 2);
  const attachment = new AttachmentBuilder(
    Buffer.from(jsonData),
    { name: `onboarding-data-${targetUser.id}.json` }
  );

  await interaction.reply({
    embeds: [embed],
    files: [attachment],
    ephemeral: true
  });
}

async function handleExportAll(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const allData = await OnboardingData.find({});
  
  if (allData.length === 0) {
    return await interaction.editReply({
      content: '❌ No onboarding data found.'
    });
  }

  // Create CSV
  const headers = [
    'User ID', 'Discord Username', 'Country', 'TikTok Username', 'TikTok Profile Link',
    'Payment Method', 'Payment Email', 'Account Verified', 'Warmup Verified',
    'Data Completeness %', 'Collected At', 'Last Updated'
  ];

  const rows = allData.map(data => [
    data.user_id,
    data.discord_tag,
    data.personal_info.country || '',
    data.tiktok_info.username || '',
    data.tiktok_info.profile_link || '',
    data.payment_info.payment_method || '',
    data.payment_info.payment_email || '',
    data.verification.account_verified ? 'Yes' : 'No',
    data.verification.warmup_verified ? 'Yes' : 'No',
    data.data_completeness.overall || 0,
    data.collected_at.toISOString(),
    data.last_updated.toISOString()
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const attachment = new AttachmentBuilder(
    Buffer.from(csv),
    { name: `onboarding-data-all-${Date.now()}.csv` }
  );

  const embed = new EmbedBuilder()
    .setTitle('📊 All Onboarding Data Export')
    .setDescription(`Exported data for ${allData.length} user(s)`)
    .setColor(0x00ff00)
    .setTimestamp();

  await interaction.editReply({
    embeds: [embed],
    files: [attachment]
  });
}

async function handleStats(interaction) {
  const stats = await onboardingDataCollector.getStatistics();

  const embed = new EmbedBuilder()
    .setTitle('📊 Onboarding Data Statistics')
    .addFields(
      { name: '👥 Total Users', value: stats.total.toString(), inline: true },
      { name: '✅ Verified Accounts', value: stats.verified.toString(), inline: true },
      { name: '💳 With Payment Info', value: stats.withPaymentInfo.toString(), inline: true },
      { name: '📊 Avg. Completeness', value: stats.averageCompleteness[0]?.avg ? `${Math.round(stats.averageCompleteness[0].avg)}%` : 'N/A', inline: true }
    )
    .setColor(0x5865F2)
    .setTimestamp();

  if (stats.byCountry && stats.byCountry.length > 0) {
    const topCountries = stats.byCountry.slice(0, 10).map(c => `**${c._id}**: ${c.count}`).join('\n');
    embed.addFields({
      name: '🌍 Top Countries',
      value: topCountries || 'No data',
      inline: false
    });
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

