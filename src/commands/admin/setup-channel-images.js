const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'setup-channel-images',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('setup-channel-images')
    .setDescription('Setup automatic image posting in channels (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('welcome')
        .setDescription('Setup welcome channel with image')
        .addAttachmentOption(option =>
          option.setName('image')
            .setDescription('Welcome image')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Welcome message title')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Welcome message description')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('onboarding')
        .setDescription('Setup onboarding channel with image')
        .addAttachmentOption(option =>
          option.setName('image')
            .setDescription('Onboarding image')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Onboarding message title')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Onboarding message description')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('rules')
        .setDescription('Setup rules channel with image')
        .addAttachmentOption(option =>
          option.setName('image')
            .setDescription('Rules image')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Rules message title')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Rules message description')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('custom')
        .setDescription('Setup custom channel with image')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel to setup')
            .setRequired(true)
        )
        .addAttachmentOption(option =>
          option.setName('image')
            .setDescription('Image to post')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Message title')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Message description')
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      await interaction.deferReply({ ephemeral: true });

      if (subcommand === 'welcome') {
        await this.setupWelcomeChannel(interaction);
      } else if (subcommand === 'onboarding') {
        await this.setupOnboardingChannel(interaction);
      } else if (subcommand === 'rules') {
        await this.setupRulesChannel(interaction);
      } else if (subcommand === 'custom') {
        await this.setupCustomChannel(interaction);
      }

    } catch (error) {
      console.error('Error in setup-channel-images command:', error);
      await interaction.editReply({
        content: `❌ **Error setting up channel images:**\n\`\`\`${error.message}\`\`\``,
        ephemeral: true
      });
    }
  },

  async setupWelcomeChannel(interaction) {
    const imageAttachment = interaction.options.getAttachment('image');
    const title = interaction.options.getString('title') || '👋 Welcome to MegaViral!';
    const description = interaction.options.getString('description') || 'Welcome to our community! Get started by completing the onboarding process.';

    // Validate image
    if (!imageAttachment.contentType?.startsWith('image/')) {
      return await interaction.editReply({
        content: '❌ Please provide a valid image file.',
        ephemeral: true
      });
    }

    // Find welcome channel
    const welcomeChannel = interaction.guild.channels.cache.find(
      channel => channel.name.toLowerCase().includes('welcome') && channel.isTextBased()
    );

    if (!welcomeChannel) {
      return await interaction.editReply({
        content: '❌ Welcome channel not found. Please create a channel with "welcome" in the name.',
        ephemeral: true
      });
    }

    // Create welcome embed with image
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0x00ff00)
      .setImage(imageAttachment.url)
      .addFields(
        {
          name: '🚀 Getting Started',
          value: '1️⃣ Complete onboarding\n2️⃣ Verify your TikTok account\n3️⃣ Start earning!',
          inline: false
        },
        {
          name: '📋 Next Steps',
          value: 'Head to the onboarding channel to begin your journey.',
          inline: false
        }
      )
      .setFooter({ text: 'MegaViral Community' })
      .setTimestamp();

    // Post in welcome channel
    await welcomeChannel.send({ embeds: [welcomeEmbed] });

    await interaction.editReply({
      content: `✅ **Welcome channel setup complete!**\n\n📸 **Image:** ${imageAttachment.name}\n📍 **Channel:** ${welcomeChannel}\n📝 **Title:** ${title}`
    });

    console.log(`✅ Setup welcome channel with image: ${imageAttachment.name}`);
  },

  async setupOnboardingChannel(interaction) {
    const imageAttachment = interaction.options.getAttachment('image');
    const title = interaction.options.getString('title') || '📋 Onboarding Guide';
    const description = interaction.options.getString('description') || 'Follow these steps to get started with MegaViral.';

    // Validate image
    if (!imageAttachment.contentType?.startsWith('image/')) {
      return await interaction.editReply({
        content: '❌ Please provide a valid image file.',
        ephemeral: true
      });
    }

    // Find onboarding channel
    const onboardingChannel = interaction.guild.channels.cache.find(
      channel => channel.name.toLowerCase().includes('onboarding') && channel.isTextBased()
    );

    if (!onboardingChannel) {
      return await interaction.editReply({
        content: '❌ Onboarding channel not found. Please create a channel with "onboarding" in the name.',
        ephemeral: true
      });
    }

    // Create onboarding embed with image
    const onboardingEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0xff6b6b)
      .setImage(imageAttachment.url)
      .addFields(
        {
          name: '📅 Step 1: Account Setup',
          value: 'Create your TikTok account and complete verification',
          inline: false
        },
        {
          name: '🔥 Step 2: Warm-up Process',
          value: 'Follow the 3-day algorithm warm-up guide',
          inline: false
        },
        {
          name: '💰 Step 3: Start Earning',
          value: 'Connect your account and begin tracking earnings',
          inline: false
        }
      )
      .setFooter({ text: 'MegaViral Onboarding' })
      .setTimestamp();

    // Post in onboarding channel
    await onboardingChannel.send({ embeds: [onboardingEmbed] });

    await interaction.editReply({
      content: `✅ **Onboarding channel setup complete!**\n\n📸 **Image:** ${imageAttachment.name}\n📍 **Channel:** ${onboardingChannel}\n📝 **Title:** ${title}`
    });

    console.log(`✅ Setup onboarding channel with image: ${imageAttachment.name}`);
  },

  async setupRulesChannel(interaction) {
    const imageAttachment = interaction.options.getAttachment('image');
    const title = interaction.options.getString('title') || '📜 Community Rules';
    const description = interaction.options.getString('description') || 'Please read and follow these community guidelines.';

    // Validate image
    if (!imageAttachment.contentType?.startsWith('image/')) {
      return await interaction.editReply({
        content: '❌ Please provide a valid image file.',
        ephemeral: true
      });
    }

    // Find rules channel
    const rulesChannel = interaction.guild.channels.cache.find(
      channel => channel.name.toLowerCase().includes('rules') && channel.isTextBased()
    );

    if (!rulesChannel) {
      return await interaction.editReply({
        content: '❌ Rules channel not found. Please create a channel with "rules" in the name.',
        ephemeral: true
      });
    }

    // Create rules embed with image
    const rulesEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0xff4444)
      .setImage(imageAttachment.url)
      .addFields(
        {
          name: '✅ Do\'s',
          value: '• Be respectful to all members\n• Follow Discord ToS\n• Use appropriate language\n• Help others when possible',
          inline: false
        },
        {
          name: '❌ Don\'ts',
          value: '• No spam or self-promotion\n• No NSFW content\n• No harassment or bullying\n• No sharing personal information',
          inline: false
        },
        {
          name: '⚠️ Consequences',
          value: 'Violations may result in warnings, mutes, or bans.',
          inline: false
        }
      )
      .setFooter({ text: 'MegaViral Community Rules' })
      .setTimestamp();

    // Post in rules channel
    await rulesChannel.send({ embeds: [rulesEmbed] });

    await interaction.editReply({
      content: `✅ **Rules channel setup complete!**\n\n📸 **Image:** ${imageAttachment.name}\n📍 **Channel:** ${rulesChannel}\n📝 **Title:** ${title}`
    });

    console.log(`✅ Setup rules channel with image: ${imageAttachment.name}`);
  },

  async setupCustomChannel(interaction) {
    const channel = interaction.options.getChannel('channel');
    const imageAttachment = interaction.options.getAttachment('image');
    const title = interaction.options.getString('title') || '📸 Custom Message';
    const description = interaction.options.getString('description') || '';

    // Validate image
    if (!imageAttachment.contentType?.startsWith('image/')) {
      return await interaction.editReply({
        content: '❌ Please provide a valid image file.',
        ephemeral: true
      });
    }

    // Validate channel
    if (!channel.isTextBased()) {
      return await interaction.editReply({
        content: '❌ Please select a text channel.',
        ephemeral: true
      });
    }

    // Create custom embed with image
    const customEmbed = new EmbedBuilder()
      .setTitle(title)
      .setColor(0x0099ff)
      .setImage(imageAttachment.url)
      .setTimestamp();

    if (description) {
      customEmbed.setDescription(description);
    }

    // Post in custom channel
    await channel.send({ embeds: [customEmbed] });

    await interaction.editReply({
      content: `✅ **Custom channel setup complete!**\n\n📸 **Image:** ${imageAttachment.name}\n📍 **Channel:** ${channel}\n📝 **Title:** ${title}`
    });

    console.log(`✅ Setup custom channel ${channel.name} with image: ${imageAttachment.name}`);
  }
};
