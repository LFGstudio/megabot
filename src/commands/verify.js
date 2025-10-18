const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'verify',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Manage account verification')
    .addSubcommand(subcommand =>
      subcommand
        .setName('submit')
        .setDescription('Submit your TikTok account for verification')
        .addStringOption(option =>
          option
            .setName('tiktok_username')
            .setDescription('Your TikTok username (without @)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('country')
            .setDescription('Your country')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option
            .setName('profile_link')
            .setDescription('Your TikTok profile link')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('warmup')
        .setDescription('Submit proof of completed warm-up phase')
        .addStringOption(option =>
          option
            .setName('tiktok_username')
            .setDescription('Your TikTok username (without @)')
            .setRequired(true)
        )
        .addAttachmentOption(option =>
          option
            .setName('analytics_screenshot')
            .setDescription('Screenshot of your TikTok analytics')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('approve')
        .setDescription('Approve a user\'s verification request (Admin only)')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to approve')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Type of approval')
            .setRequired(true)
            .addChoices(
              { name: 'Verification', value: 'verification' },
              { name: 'Warm-up', value: 'warmup' }
            )
        )
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const choices = [
      'United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand',
      'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway',
      'Denmark', 'Finland', 'Switzerland', 'Austria', 'Belgium', 'Ireland',
      'Portugal', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria',
      'Croatia', 'Slovenia', 'Slovakia', 'Estonia', 'Latvia', 'Lithuania',
      'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'Taiwan', 'Malaysia',
      'Thailand', 'Philippines', 'Indonesia', 'Vietnam', 'India', 'Brazil',
      'Argentina', 'Chile', 'Mexico', 'Colombia', 'Peru', 'South Africa',
      'Nigeria', 'Kenya', 'Egypt', 'Morocco', 'Israel', 'Turkey', 'Russia',
      'Ukraine', 'Belarus', 'Kazakhstan', 'Uzbekistan', 'Other'
    ];

    const filtered = choices.filter(choice => 
      choice.toLowerCase().includes(focusedValue.toLowerCase())
    ).slice(0, 25);

    await interaction.respond(
      filtered.map(choice => ({ name: choice, value: choice }))
    );
  },

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'submit') {
      const submitCommand = require('./verify/submit');
      await submitCommand.execute(interaction, client);
    } else if (subcommand === 'warmup') {
      const warmupCommand = require('./verify/warmup');
      await warmupCommand.execute(interaction, client);
    } else if (subcommand === 'approve') {
      const approveCommand = require('./verify/approve');
      await approveCommand.execute(interaction, client);
    }
  }
};
