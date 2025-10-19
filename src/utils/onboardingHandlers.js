const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const User = require('../models/User');

class OnboardingHandlers {
  constructor() {}

  async handleGetStarted(interaction, client) {
    try {
      // Send 3-day step process message
      const getStartedEmbed = new EmbedBuilder()
        .setTitle('🚀 Your 3-Day Journey to Success')
        .setDescription('Welcome to MegaViral! Follow this 3-day process to get started and begin earning.')
        .addFields(
          {
            name: '📅 Day 1: Account Setup',
            value: '• Create your TikTok account\n• Set up your profile\n• Choose your username format',
            inline: false
          },
          {
            name: '📅 Day 2: Verification',
            value: '• Submit your account for verification\n• Wait for approval\n• Get ready for warm-up',
            inline: false
          },
          {
            name: '📅 Day 3: Algorithm Warm-up',
            value: '• Follow the 3-day warm-up process\n• Engage with relevant content\n• Start posting and earning!',
            inline: false
          }
        )
        .setColor(0x00ff00)
        .setFooter({ text: 'Ready to begin? Let\'s start with Day 1!' })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('start_day_1')
            .setLabel('Start Day 1: Account Setup')
            .setEmoji('📱')
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.reply({
        embeds: [getStartedEmbed],
        components: [row]
      });

    } catch (error) {
      console.error('Error in handleGetStarted:', error);
      await interaction.reply({
        content: '❌ An error occurred while starting your journey.',
        ephemeral: true
      });
    }
  }

  async handleStartDay1(interaction, client) {
    try {
      // Send Day 1 instructions
      const day1Embed = new EmbedBuilder()
        .setTitle('📱 Day 1: Account Setup')
        .setDescription('Let\'s create your TikTok account and set it up for success!')
        .addFields(
          {
            name: '🎯 Create Your TikTok Account',
            value: '• Use email or phone login\n• Make sure you\'re in a Tier 1 country or use a VPN\n• Choose a clean, professional username',
            inline: false
          },
          {
            name: '👤 Username Format Examples',
            value: '• amanda.goviral\n• harper.viral\n• growth.claudia\n• tips.by.jenna\n\nKeep it clean, short, and authentic!',
            inline: false
          },
          {
            name: '🖼️ Profile Setup',
            value: '• Use a friendly selfie or professional avatar\n• Display name: "Grow With [Your Name]"\n• Bio: "Helping small creators grow 💖\nApp you\'re looking for is \'MegaViral: AI Creator Agent\'"',
            inline: false
          }
        )
        .setColor(0xff8800)
        .setFooter({ text: 'Complete these steps, then click below to continue!' })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('complete_day_1')
            .setLabel('I\'ve Completed Day 1')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success)
        );

      await interaction.reply({
        embeds: [day1Embed],
        components: [row]
      });

    } catch (error) {
      console.error('Error in handleStartDay1:', error);
      await interaction.reply({
        content: '❌ An error occurred while starting Day 1.',
        ephemeral: true
      });
    }
  }

  async handleCompleteDay1(interaction, client) {
    try {
      // Send Day 2 instructions
      const day2Embed = new EmbedBuilder()
        .setTitle('🎫 Day 2: Verification')
        .setDescription('Great job! Now let\'s get your account verified so you can start earning.')
        .addFields(
          {
            name: '📋 What Happens Next',
            value: '• Your account will be reviewed by our team\n• We\'ll check your profile setup\n• Verification typically takes 24-48 hours',
            inline: false
          },
          {
            name: '✅ Verification Checklist',
            value: '• Account follows username format\n• Profile is professional and complete\n• Bio includes MegaViral branding\n• Account is in Tier 1 country or using VPN',
            inline: false
          },
          {
            name: '⏰ Next Steps',
            value: 'Once verified, you\'ll receive instructions for Day 3: Algorithm Warm-up',
            inline: false
          }
        )
        .setColor(0x0099ff)
        .setFooter({ text: 'Your account is now under review!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [day2Embed],
        ephemeral: true
      });

      // Log the action
      await client.logAction(
        'Day 1 Completed',
        `<@${interaction.user.id}> completed Day 1 of onboarding`
      );

    } catch (error) {
      console.error('Error in handleCompleteDay1:', error);
      await interaction.reply({
        content: '❌ An error occurred while completing Day 1.',
        ephemeral: true
      });
    }
  }

  async handleStartOnboarding(interaction, client) {
    try {
      // Assign "Onboarding Started" role
      const member = interaction.member;
      const onboardingRole = interaction.guild.roles.cache.get(client.config.roles.onboardingStarted);
      
      if (onboardingRole) {
        await member.roles.add(onboardingRole);
      }

      // Remove new member role if exists
      const newMemberRole = interaction.guild.roles.cache.get(client.config.roles.newMember);
      if (newMemberRole && member.roles.cache.has(newMemberRole.id)) {
        try {
          await member.roles.remove(newMemberRole);
        } catch (roleError) {
          console.log(`Could not remove new member role: ${roleError.message}`);
        }
      }

      // Send confirmation message
      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Onboarding Started!')
        .setDescription('Great! You\'ve started your MegaViral onboarding journey.')
        .addFields(
          { name: '📋 Next Step', value: 'Head to #about-megaviral to learn how our program works', inline: false },
          { name: '🎯 What\'s Next', value: 'You\'ll learn about payouts, requirements, and the verification process', inline: false }
        )
        .setColor(0x00ff00)
        .setFooter({ text: 'Welcome to the MegaViral community!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true
      });

      // Log the action
      await client.logAction(
        'Onboarding Started',
        `<@${interaction.user.id}> started the onboarding process`
      );

    } catch (error) {
      console.error('Error in handleStartOnboarding:', error);
      await interaction.reply({
        content: '❌ An error occurred while starting your onboarding.',
        ephemeral: true
      });
    }
  }

  async handleSubmitAccountVerification(interaction, client) {
    try {
      // Check if user has onboarding started role
      const member = interaction.member;
      const onboardingRole = interaction.guild.roles.cache.get(client.config.roles.onboardingStarted);
      
      if (!onboardingRole || !member.roles.cache.has(onboardingRole.id)) {
        return interaction.reply({
          content: '❌ Please complete the previous steps first. Start with the welcome message.',
          ephemeral: true
        });
      }

      // Create modal for account verification
      const modal = new ModalBuilder()
        .setCustomId('account_verification_modal')
        .setTitle('Account Verification');

      const tiktokUsernameInput = new TextInputBuilder()
        .setCustomId('tiktok_username')
        .setLabel('TikTok Username')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter your TikTok username (without @)')
        .setRequired(true)
        .setMaxLength(30);

      const profileLinkInput = new TextInputBuilder()
        .setCustomId('profile_link')
        .setLabel('TikTok Profile Link')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://www.tiktok.com/@username')
        .setRequired(true)
        .setMaxLength(100);

      const countryInput = new TextInputBuilder()
        .setCustomId('country')
        .setLabel('Country')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., United States, Canada, UK')
        .setRequired(true)
        .setMaxLength(50);

      const paymentMethodInput = new TextInputBuilder()
        .setCustomId('payment_method')
        .setLabel('Payment Method')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('PayPal or Wise')
        .setRequired(true)
        .setMaxLength(20);

      const firstActionRow = new ActionRowBuilder().addComponents(tiktokUsernameInput);
      const secondActionRow = new ActionRowBuilder().addComponents(profileLinkInput);
      const thirdActionRow = new ActionRowBuilder().addComponents(countryInput);
      const fourthActionRow = new ActionRowBuilder().addComponents(paymentMethodInput);

      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error in handleSubmitAccountVerification:', error);
      await interaction.reply({
        content: '❌ An error occurred while setting up account verification.',
        ephemeral: true
      });
    }
  }

  async handleSubmitTikTokVerification(interaction, client) {
    try {
      // Check if user has Account Created role
      const accountCreatedRole = interaction.guild.roles.cache.get(client.config.roles.accountCreated);
      const hasAccountCreatedRole = accountCreatedRole && interaction.member.roles.cache.has(accountCreatedRole.id);
      
      if (!hasAccountCreatedRole) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Access Denied')
          .setDescription('You must complete account creation first.')
          .setColor(0xff0000)
          .setTimestamp();
        
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Create modal for TikTok verification
      const modal = new ModalBuilder()
        .setCustomId('tiktok_verification_modal')
        .setTitle('TikTok Account Verification');

      const usernameInput = new TextInputBuilder()
        .setCustomId('tiktok_username')
        .setLabel('TikTok Username')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter your TikTok username')
        .setRequired(true)
        .setMaxLength(30);

      const profileLinkInput = new TextInputBuilder()
        .setCustomId('profile_link')
        .setLabel('TikTok Profile Link')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://www.tiktok.com/@username')
        .setRequired(true)
        .setMaxLength(100);

      const countryInput = new TextInputBuilder()
        .setCustomId('country')
        .setLabel('Country')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., United States')
        .setRequired(true)
        .setMaxLength(50);

      const paymentMethodInput = new TextInputBuilder()
        .setCustomId('payment_method')
        .setLabel('Payment Method')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('PayPal or Wise')
        .setRequired(true)
        .setMaxLength(20);

      const firstActionRow = new ActionRowBuilder().addComponents(usernameInput);
      const secondActionRow = new ActionRowBuilder().addComponents(profileLinkInput);
      const thirdActionRow = new ActionRowBuilder().addComponents(countryInput);
      const fourthActionRow = new ActionRowBuilder().addComponents(paymentMethodInput);

      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error in handleSubmitTikTokVerification:', error);
      await interaction.reply({
        content: '❌ An error occurred while setting up TikTok verification.',
        ephemeral: true
      });
    }
  }

  async handleSubmitWarmupVerification(interaction, client) {
    try {
      // Check if user has Warming Up role
      const warmingUpRole = interaction.guild.roles.cache.get(client.config.roles.warmingUp);
      const hasWarmingUpRole = warmingUpRole && interaction.member.roles.cache.has(warmingUpRole.id);
      
      if (!hasWarmingUpRole) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Access Denied')
          .setDescription('You must complete TikTok verification first.')
          .setColor(0xff0000)
          .setTimestamp();
        
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Create modal for warm-up verification
      const modal = new ModalBuilder()
        .setCustomId('warmup_verification_modal')
        .setTitle('Warm-up Verification');

      const warmupCompletedInput = new TextInputBuilder()
        .setCustomId('warmup_completed')
        .setLabel('Warm-up Completion Confirmation')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Confirm you have completed the 3-day warm-up process...')
        .setRequired(true)
        .setMaxLength(500);

      const profileLinkInput = new TextInputBuilder()
        .setCustomId('profile_link')
        .setLabel('Updated TikTok Profile Link')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://www.tiktok.com/@username')
        .setRequired(true)
        .setMaxLength(100);

      const fypScreenshotInput = new TextInputBuilder()
        .setCustomId('fyp_screenshot')
        .setLabel('FYP Screenshot Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe what you see on your FYP (Go Viral content, etc.)')
        .setRequired(true)
        .setMaxLength(500);

      const firstActionRow = new ActionRowBuilder().addComponents(warmupCompletedInput);
      const secondActionRow = new ActionRowBuilder().addComponents(profileLinkInput);
      const thirdActionRow = new ActionRowBuilder().addComponents(fypScreenshotInput);

      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error in handleSubmitWarmupVerification:', error);
      await interaction.reply({
        content: '❌ An error occurred while setting up warm-up verification.',
        ephemeral: true
      });
    }
  }
}

module.exports = new OnboardingHandlers();