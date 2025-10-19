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
            value: '• Use email or phone login\n• Make sure you\'re in a Tier 1 country or use a VPN before downloading TikTok!\n• Choose a clean, professional username',
            inline: false
          },
          {
            name: '👤 Username Format Examples',
            value: '• amanda.goviral\n• harper.viral\n• growth.claudia\n• tips.by.jenna\n\nFollow this exactly. It\'s what makes your videos go viral 🚀',
            inline: false
          },
          {
            name: '📅 Day 1:',
            value: '• Scroll naturally on your FYP — no searching\n• Engage like a real person (like, comment, follow)\n• If "Go Viral" niche appears, engage with it',
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
        .setTitle('🔥 Day 2: Algorithm Warm-up')
        .setDescription('Great job! Now let\'s warm up the algorithm to make your videos go viral.')
        .addFields(
          {
            name: '📅 Day 2 Instructions',
            value: '• Search "how to go viral" and interact with a few of those videos\n• Keep scrolling and engaging with similar content\n• Engage like a real person (like, comment, follow) videos in the "how to go viral" niche.',
            inline: false
          },
          {
            name: '🎯 Goal',
            value: 'Build engagement history and train the algorithm to show you relevant content.',
            inline: false
          },
          {
            name: '⏰ Next Steps',
            value: 'Complete today\'s warm-up, then proceed to Day 3 tomorrow.',
            inline: false
          }
        )
        .setColor(0xff6b6b)
        .setFooter({ text: 'Complete today\'s warm-up, then continue tomorrow!' })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('complete_day_2')
            .setLabel('I\'ve Completed Day 2')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success)
        );

      await interaction.reply({
        embeds: [day2Embed],
        components: [row]
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

  async handleCompleteDay2(interaction, client) {
    try {
      // Send Day 3 instructions
      const day3Embed = new EmbedBuilder()
        .setTitle('🎯 Day 3: Final Branding & Verification')
        .setDescription('Almost there! Let\'s finalize your account branding and get verified.')
        .addFields(
          {
            name: '📅 Day 3 — Brand Your Account:',
            value: '• Username, display name, and profile photo should now be set\n• Make sure your bio matches the example:\n"Helping small creators grow 💖\nApp you\'re looking for is \'MegaViral: AI Creator Agent\'"\n• Your FYP should now mostly show "Go Viral" or creator-growth content',
            inline: false
          },
          {
            name: '🏷️ Final Branding Check',
            value: '• Username, display name, and profile photo should be set\n• Bio: "Helping small creators grow 💖\nApp you\'re looking for is \'MegaViral: AI Creator Agent\'"\n• Your FYP should show "Go Viral" or creator-growth content',
            inline: false
          },
          {
            name: '💖 Actions',
            value: '• Engage like a real person (like, comment, follow) 15m twice a day.',
            inline: false
          },
          {
            name: '🎉 Ready for Verification',
            value: 'Once you complete Day 3, you\'ll submit your account for final verification!',
            inline: false
          }
        )
        .setColor(0xff4444)
        .setFooter({ text: 'Complete Day 3, then submit for verification!' })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('complete_day_3')
            .setLabel('I\'ve Completed Day 3 - Submit for Verification')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.reply({
        embeds: [day3Embed],
        components: [row]
      });

      // Log the action
      await client.logAction(
        'Day 2 Completed',
        `<@${interaction.user.id}> completed Day 2 of onboarding`
      );

    } catch (error) {
      console.error('Error in handleCompleteDay2:', error);
      await interaction.reply({
        content: '❌ An error occurred while completing Day 2.',
        ephemeral: true
      });
    }
  }

  async handleCompleteDay3(interaction, client) {
    try {
      // Create verification modal
      const modal = new ModalBuilder()
        .setCustomId('final_verification_modal')
        .setTitle('Submit Account for Final Verification');

      // Add input fields
      const tiktokUsername = new TextInputBuilder()
        .setCustomId('tiktok_username')
        .setLabel('Your TikTok Username')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('@yourusername')
        .setRequired(true);

      const accountUrl = new TextInputBuilder()
        .setCustomId('account_url')
        .setLabel('Your TikTok Account URL')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://www.tiktok.com/@yourusername')
        .setRequired(true);

      const warmupConfirmation = new TextInputBuilder()
        .setCustomId('warmup_confirmation')
        .setLabel('Confirm 3-day warm-up completion')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Type "YES" to confirm')
        .setRequired(true);

      // Add inputs to modal
      modal.addComponents(
        new ActionRowBuilder().addComponents(tiktokUsername),
        new ActionRowBuilder().addComponents(accountUrl),
        new ActionRowBuilder().addComponents(warmupConfirmation)
      );

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error creating final verification modal:', error);
      await interaction.reply({
        content: '❌ An error occurred while creating the verification form.',
        ephemeral: true
      });
    }
  }

  async handleFinalVerificationSubmit(interaction, client) {
    try {
      const tiktokUsername = interaction.fields.getTextInputValue('tiktok_username');
      const accountUrl = interaction.fields.getTextInputValue('account_url');
      const warmupConfirmation = interaction.fields.getTextInputValue('warmup_confirmation');

      // Validate warmup confirmation
      if (warmupConfirmation.toLowerCase() !== 'yes') {
        return await interaction.reply({
          content: '❌ Please confirm you completed the 3-day warm-up process by typing "YES".',
          ephemeral: true
        });
      }

      // Find verification category
      const verificationCategory = client.channels.cache.get(client.config.categories.verification);
      if (!verificationCategory) {
        return await interaction.reply({
          content: '❌ Verification category not found. Please contact an administrator.',
          ephemeral: true
        });
      }

      // Create private verification channel
      const channelName = `verification-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      
      try {
        const verificationChannel = await verificationCategory.guild.channels.create({
          name: channelName,
          type: 0, // Text channel
          parent: verificationCategory.id,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              deny: ['ViewChannel']
            },
            {
              id: interaction.user.id,
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
            },
            {
              id: client.config.roles.moderator,
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
            },
            {
              id: client.config.roles.admin,
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages', 'ManageChannels']
            }
          ]
        });

        // Create verification embed
        const verificationEmbed = new EmbedBuilder()
          .setTitle('🎫 Final Verification Request')
          .setColor(0xff6b6b)
          .setDescription(`**User:** ${interaction.user.tag} (<@${interaction.user.id}>)\n**Status:** Ready for Final Verification`)
          .addFields(
            { name: '📱 TikTok Username', value: tiktokUsername, inline: true },
            { name: '🔗 Account URL', value: accountUrl, inline: true },
            { name: '🔥 Warm-up Completed', value: '✅ Confirmed', inline: true },
            { name: '📅 Submitted', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
          )
          .setFooter({ text: 'Review account and approve for earning access' })
          .setTimestamp();

        // Create action row with verification buttons
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`approve_final_verification_${interaction.user.id}`)
              .setLabel('✅ Approve & Grant Access')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`reject_final_verification_${interaction.user.id}`)
              .setLabel('❌ Reject')
              .setStyle(ButtonStyle.Danger)
          );

        // Send verification request to the new channel
        await verificationChannel.send({ 
          content: `@here Final verification request from <@${interaction.user.id}>`,
          embeds: [verificationEmbed], 
          components: [row] 
        });

      } catch (channelError) {
        console.error('Error creating verification channel:', channelError);
        return await interaction.reply({
          content: '❌ Failed to create verification channel. Please contact an administrator.',
          ephemeral: true
        });
      }

      // Confirm submission to user
      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Verification Submitted!')
        .setColor(0x00ff00)
        .setDescription('Your account has been submitted for final verification.')
        .addFields(
          { name: '📱 Account', value: tiktokUsername, inline: true },
          { name: '📋 Verification Channel', value: `#${channelName}`, inline: true },
          { name: '⏰ Review Time', value: '24-48 hours', inline: true },
          { name: '🎉 What\'s Next', value: 'Once approved, you\'ll receive access to our content library and can start earning!', inline: false }
        )
        .setFooter({ text: 'Thank you for completing the 3-day onboarding process!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true
      });

      // Log the action
      await client.logAction(
        'Final Verification Submitted',
        `<@${interaction.user.id}> submitted final verification for ${tiktokUsername}`
      );

    } catch (error) {
      console.error('Error in handleFinalVerificationSubmit:', error);
      await interaction.reply({
        content: '❌ An error occurred while submitting your verification.',
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