const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

// Onboarding flow command for step-by-step channel progression

module.exports = {
  name: 'onboarding',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('onboarding')
    .setDescription('Setup the MegaViral onboarding flow (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('welcome')
        .setDescription('Create the welcome message in #welcome channel')
        .addAttachmentOption(option =>
          option.setName('image')
            .setDescription('Welcome image to display')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Custom title for welcome message')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Custom description for welcome message')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('button-text')
            .setDescription('Custom button text')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('about')
        .setDescription('Create the about message in #about-megaviral channel')
        .addAttachmentOption(option =>
          option.setName('image')
            .setDescription('About image to display')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Custom title for about message')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Custom description for about message')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('button-text')
            .setDescription('Custom button text')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('create-account')
        .setDescription('Create the create account message in #create-your-account channel')
        .addAttachmentOption(option =>
          option.setName('image')
            .setDescription('Create account image to display')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Custom title for create account message')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Custom description for create account message')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('button-text')
            .setDescription('Custom button text')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('warmup-guide')
        .setDescription('Create the warm-up guide message in #warm-up-guide channel')
        .addAttachmentOption(option =>
          option.setName('image')
            .setDescription('Warmup guide image to display')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Custom title for warmup guide message')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Custom description for warmup guide message')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('button-text')
            .setDescription('Custom button text')
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'welcome') {
        await this.createWelcomeMessage(interaction, client);
      } else if (subcommand === 'about') {
        await this.createAboutMessage(interaction, client);
      } else if (subcommand === 'create-account') {
        await this.createAccountMessage(interaction, client);
      } else if (subcommand === 'warmup-guide') {
        await this.createWarmupMessage(interaction, client);
      }

    } catch (error) {
      console.error('Error in onboarding command:', error);
      await interaction.reply({
        content: '❌ An error occurred while setting up the onboarding flow.',
        ephemeral: true
      });
    }
  },

  async createWelcomeMessage(interaction, client) {
    const imageAttachment = interaction.options.getAttachment('image');
    const customTitle = interaction.options.getString('title');
    const customDescription = interaction.options.getString('description');
    const customButtonText = interaction.options.getString('button-text');
    
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(customTitle || '👋 Welcome to MegaViral!')
      .setDescription(customDescription || 'We pay creators to post viral TikTok clips using our content library.\n\nTo get started, follow our quick 3-step onboarding process to get verified and start earning 💸')
      .addFields(
        {
          name: '🚀 What You\'ll Get',
          value: '• Access to our viral content library\n• Automated payout tracking\n• Performance analytics\n• Community support',
          inline: false
        },
        {
          name: '📋 Onboarding Steps',
          value: '1️⃣ Learn about our program\n2️⃣ Create your TikTok account\n3️⃣ Get verified and start earning',
          inline: false
        }
      )
      .setColor(0x00ff00)
      .setFooter({ text: 'Click "Start Onboarding" below to begin your journey!' })
      .setTimestamp();

    // Add image if provided
    if (imageAttachment && imageAttachment.contentType?.startsWith('image/')) {
      welcomeEmbed.setImage(imageAttachment.url);
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('start_onboarding')
          .setLabel(customButtonText || 'Start Onboarding')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Success)
      );

    await interaction.reply({
      embeds: [welcomeEmbed],
      components: [row]
    });
  },

  async createAboutMessage(interaction, client) {
    const imageAttachment = interaction.options.getAttachment('image');
    const customTitle = interaction.options.getString('title');
    const customDescription = interaction.options.getString('description');
    const customButtonText = interaction.options.getString('button-text');
    
    const aboutEmbed = new EmbedBuilder()
      .setTitle(customTitle || '💰 How MegaViral Works')
      .setDescription(customDescription || 'Post TikTok videos from our content library and earn payouts based on your views!')
      .addFields(
        {
          name: '💸 How You Earn',
          value: '• Post viral TikTok clips from our library\n• Earn payouts based on Tier 1 country views\n• Get paid via PayPal or Wise\n• Track your performance in real-time',
          inline: false
        },
        {
          name: '⚙️ To Start Posting, You\'ll Need To:',
          value: '1️⃣ Create a fresh TikTok account\n2️⃣ Get it verified\n3️⃣ Warm up the algorithm\n4️⃣ Start posting and earning',
          inline: false
        },
        {
          name: '🎯 Tier 1 Countries',
          value: 'US, UK, Canada, Australia, New Zealand',
          inline: false
        }
      )
      .setColor(0x0099ff)
      .setFooter({ text: 'Ready to get verified? Click below to start!' })
      .setTimestamp();

    // Add image if provided
    if (imageAttachment && imageAttachment.contentType?.startsWith('image/')) {
      aboutEmbed.setImage(imageAttachment.url);
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('submit_account_verification')
          .setLabel(customButtonText || 'Submit Account for Verification')
          .setEmoji('🎫')
          .setStyle(ButtonStyle.Primary)
      );

    await interaction.reply({
      embeds: [aboutEmbed],
      components: [row]
    });
  },

  async createAccountMessage(interaction, client) {
    const imageAttachment = interaction.options.getAttachment('image');
    const customTitle = interaction.options.getString('title');
    const customDescription = interaction.options.getString('description');
    const customButtonText = interaction.options.getString('button-text');
    
    const accountEmbed = new EmbedBuilder()
      .setTitle(customTitle || '🎯 Create Your New TikTok Account')
      .setDescription(customDescription || 'To qualify for payouts, you must post using a new, dedicated TikTok account. This helps the algorithm push your videos faster and ensures we can track performance correctly.')
      .addFields(
        {
          name: '📱 Here\'s How to Create Your Account:',
          value: '1️⃣ Create a new TikTok account (email or phone login) Make sure you are in a tier 1 country or use a VPN!\n2️⃣ Choose a username using this format:\n   • amanda.goviral\n   • harper.viral\n   • growth.claudia\n   • tips.by.jenna\n\n   Keep it clean, short, and authentic.',
          inline: false
        },
        {
          name: '👤 Set Your Display Name:',
          value: 'Something like "Grow With Amanda" or "Creator Tips by Harper"',
          inline: false
        },
        {
          name: '🖼️ Profile Setup:',
          value: '• Use a friendly selfie or Ghibli-style avatar\n• Add a short bio like:\n  "Helping small creators grow 💖\n  App you\'re looking for is \'MegaViral: AI Creator Agent\'"',
          inline: false
        }
      )
      .setColor(0xff8800)
      .setFooter({ text: 'Once your TikTok account is ready, click below to submit it!' })
      .setTimestamp();

    // Add image if provided
    if (imageAttachment && imageAttachment.contentType?.startsWith('image/')) {
      accountEmbed.setImage(imageAttachment.url);
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('submit_tiktok_verification')
          .setLabel(customButtonText || 'Submit TikTok for Verification')
          .setEmoji('📤')
          .setStyle(ButtonStyle.Success)
      );

    await interaction.reply({
      embeds: [accountEmbed],
      components: [row]
    });
  },

  async createWarmupMessage(interaction, client) {
    const imageAttachment = interaction.options.getAttachment('image');
    const customTitle = interaction.options.getString('title');
    const customDescription = interaction.options.getString('description');
    const customButtonText = interaction.options.getString('button-text');
    
    const warmupEmbed = new EmbedBuilder()
      .setTitle(customTitle || '🔥 Warm Up the Algorithm — 3-Day Process')
      .setDescription(customDescription || 'Follow this exactly. It\'s what makes your videos go viral 🚀')
      .addFields(
        {
          name: '📅 Day 1:',
          value: '• Scroll naturally on your FYP — no searching\n• Engage like a real person (like, comment, follow)\n• If "Go Viral" niche appears, engage with it',
          inline: false
        },
        {
          name: '📅 Day 2:',
          value: '• Search "how to go viral" and interact with a few of those videos\n• Keep scrolling and engaging with similar content',
          inline: false
        },
        {
          name: '📅 Day 3 — Brand Your Account:',
          value: '• Username, display name, and profile photo should now be set\n• Make sure your bio matches the example:\n  "Helping small creators grow 💖\n  App you\'re looking for is \'Go Viral: AI Creator Assistant\'"\n• Your FYP should now mostly show "Go Viral" or creator-growth content',
          inline: false
        }
      )
      .setColor(0xff4444)
      .setFooter({ text: 'Once your FYP is warmed up, click below to submit for verification!' })
      .setTimestamp();

    // Add image if provided
    if (imageAttachment && imageAttachment.contentType?.startsWith('image/')) {
      warmupEmbed.setImage(imageAttachment.url);
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('submit_warmup_verification')
          .setLabel(customButtonText || 'Submit Warm-Up Verification')
          .setEmoji('🎫')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.reply({
      embeds: [warmupEmbed],
      components: [row]
    });
  }
};
