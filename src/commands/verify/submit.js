const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'submit',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Submit your account for verification')
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
    const User = require('../../models/User');
    
    try {
      const tiktokUsername = interaction.options.getString('tiktok_username');
      const country = interaction.options.getString('country');
      const profileLink = interaction.options.getString('profile_link');

      // Check if user already exists and is verified
      let user = await User.findOne({ discord_id: interaction.user.id });
      
      if (user && user.verified) {
        return interaction.reply({
          content: '❌ You are already verified!',
          ephemeral: true
        });
      }

      if (user && user.verification_submitted_at) {
        return interaction.reply({
          content: '❌ You have already submitted a verification request. Please wait for staff review.',
          ephemeral: true
        });
      }

      // Create or update user
      if (!user) {
        user = new User({ discord_id: interaction.user.id });
      }

      user.tiktok_username = tiktokUsername;
      user.country = country;
      user.verification_submitted_at = new Date();
      user.role = 'New Member';
      
      await user.save();

      // Send to verification channel
      const verificationChannel = client.channels.cache.get(client.config.channels.verification);
      if (verificationChannel) {
        const verificationMessage = await client.createVerificationEmbed(user);
        await verificationChannel.send(verificationMessage);
      }

      // Log the action
      await client.logAction(
        'Verification Submitted',
        `<@${interaction.user.id}> submitted verification for TikTok: ${tiktokUsername}`
      );

      // Confirmation embed
      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Verification Submitted')
        .setColor(0x00ff00)
        .setDescription('Your verification request has been submitted successfully!')
        .addFields(
          { name: '📱 TikTok Username', value: tiktokUsername, inline: true },
          { name: '🌍 Country', value: country, inline: true },
          { name: '⏰ Status', value: 'Pending Review', inline: true }
        )
        .setFooter({ text: 'Staff will review your submission shortly.' })
        .setTimestamp();

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in verify submit command:', error);
      await interaction.reply({
        content: '❌ An error occurred while processing your verification request.',
        ephemeral: true
      });
    }
  }
};
