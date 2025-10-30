const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const User = require('../models/User');

class OnboardingHandlers {
  constructor() {}

  async handleGetStarted(interaction, client) {
    try {
      console.log('🔍 Starting handleGetStarted for user:', interaction.user.tag);
      
      // Find onboarding category - use interaction.guild instead of client.channels
      let onboardingCategory = interaction.guild.channels.cache.find(
        channel => channel.name.toLowerCase().includes('onboarding') && channel.type === 4
      );
      console.log('🔍 Onboarding category found:', onboardingCategory ? onboardingCategory.name : 'none');

      // If no onboarding category found, try to use the guild's first category or create one
      if (!onboardingCategory) {
        // Try to find any category
        onboardingCategory = interaction.guild.channels.cache.find(channel => channel.type === 4);
        
        if (!onboardingCategory) {
          // Create onboarding category if none exists
          try {
            onboardingCategory = await interaction.guild.channels.create({
              name: 'Onboarding',
              type: 4 // Category
            });
            console.log(`✅ Created onboarding category: ${onboardingCategory.id}`);
          } catch (createError) {
            console.error('Error creating onboarding category:', createError);
            return await interaction.reply({
              content: '❌ Could not create onboarding category. Please contact an administrator.',
              ephemeral: true
            });
          }
        }
      }

      // Create dedicated onboarding channel for user (idempotent)
      const channelName = `onboarding-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      try {
        // Reuse existing channel if already created
        const existing = interaction.guild.channels.cache.find(c => c.parentId === onboardingCategory.id && c.name === channelName);
        
        // Build permission overwrites dynamically based on what roles exist
        const permissionOverwrites = [
          {
            id: interaction.guild.roles.everyone.id,
            deny: ['ViewChannel']
          },
          {
            id: client.user.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles']
          },
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
          }
        ];
        
        // Only add moderator role if it exists in config
        if (client.config.roles.moderator) {
          permissionOverwrites.push({
            id: client.config.roles.moderator,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
          });
        }
        
        // Only add admin role if it exists in config
        if (client.config.roles.admin) {
          permissionOverwrites.push({
            id: client.config.roles.admin,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages', 'ManageChannels']
          });
        }
        
        console.log('🔧 Creating onboarding channel:', channelName, 'in category:', onboardingCategory.name);
        
        const onboardingChannel = existing || await interaction.guild.channels.create({
          name: channelName,
          type: 0, // Text channel
          parent: onboardingCategory.id,
          topic: `Personal onboarding journey for ${interaction.user.tag}`,
          permissionOverwrites: permissionOverwrites
        });
        
        console.log('✅ Onboarding channel created/found:', onboardingChannel.id);

        // Post manual onboarding welcome message and ping moderators (only if new)
        if (!existing) {
          // Build mention string and participant text based on available roles
          const hasModerator = client.config.roles.moderator;
          const mentionString = hasModerator 
            ? `<@${interaction.user.id}> <@&${client.config.roles.moderator}>`
            : `<@${interaction.user.id}>`;
          
          const participantsText = hasModerator
            ? `You, a moderator <@&${client.config.roles.moderator}> and our team`
            : `You and our team`;
          
          const manualEmbed = new EmbedBuilder()
          .setTitle('👋 Welcome — Manual Onboarding')
          .setDescription(`Hi ${interaction.user}, this private channel is for your manual onboarding with our team.`)
          .addFields(
            { name: '👥 Participants', value: participantsText, inline: false },
            { name: '✅ Next Step', value: 'Please briefly introduce yourself and share your goals. A moderator will be with you shortly.', inline: false },
            { name: '🔒 Privacy', value: 'Only you and our staff can see this channel.', inline: false }
          )
          .setColor(0x00ff00)
          .setTimestamp();
          
          await onboardingChannel.send({ 
            content: mentionString,
            embeds: [manualEmbed]
          });
        }

        // Confirm to the user in the original channel
        const confirmEmbed = new EmbedBuilder()
          .setTitle(existing ? '✅ Onboarding Channel Ready' : '✅ Onboarding Channel Created!')
          .setDescription(existing ? 'We found your onboarding channel.' : 'Your personal onboarding journey has started!')
          .addFields(
            { name: '📋 Your Channel', value: `<#${onboardingChannel.id}>`, inline: true },
            { name: '🎯 Next Step', value: 'Check your new channel to begin Day 1', inline: true }
          )
          .setColor(0x00ff00)
          .setFooter({ text: 'Your private onboarding space is ready!' })
          .setTimestamp();

        await interaction.reply({
          embeds: [confirmEmbed],
          ephemeral: true
        });

      } catch (channelError) {
        console.error('Error creating onboarding channel:', channelError);
        console.error('Channel error stack:', channelError.stack);
        return await interaction.reply({
          content: '❌ Failed to create onboarding channel. Please contact an administrator.',
          ephemeral: true
        });
      }

    } catch (error) {
      console.error('Error in handleGetStarted:', error);
      console.error('Error stack:', error.stack);
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
              id: client.user.id,
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles']
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

  async handleApproveFinalVerification(interaction, client) {
    try {
      // Check if user has moderator or admin role
      const member = interaction.member;
      const hasModRole = member.roles.cache.has(client.config.roles.moderator);
      const hasAdminRole = member.roles.cache.has(client.config.roles.admin);
      
      if (!hasModRole && !hasAdminRole) {
        return await interaction.reply({
          content: '❌ You do not have permission to approve verifications. Only moderators and admins can use this button.',
          ephemeral: true
        });
      }

      // Extract user ID from button customId
      const userId = interaction.customId.replace('approve_final_verification_', '');
      const user = await client.users.fetch(userId);
      
      if (!user) {
        return await interaction.reply({
          content: '❌ User not found.',
          ephemeral: true
        });
      }

      // Assign clipper role to approved user
      const approvedMember = await interaction.guild.members.fetch(userId);
      const clipperRole = interaction.guild.roles.cache.get(client.config.roles.clipper);
      
      if (clipperRole && approvedMember) {
        await approvedMember.roles.add(clipperRole);
      }

      // Create approval embed
      const approvalEmbed = new EmbedBuilder()
        .setTitle('✅ Verification Approved!')
        .setColor(0x00ff00)
        .setDescription(`**User:** ${user.tag} (<@${userId}>)\n**Status:** Approved by ${interaction.user.tag}`)
        .addFields(
          { name: '🎉 Access Granted', value: 'User can now access content library and start earning!', inline: false },
          { name: '📅 Approved', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
        )
        .setFooter({ text: 'Verification completed successfully!' })
        .setTimestamp();

      // Update the original message with approval status
      await interaction.update({
        embeds: [approvalEmbed],
        components: [] // Remove buttons
      });

      // Send DM to approved user
      try {
        const userApprovalEmbed = new EmbedBuilder()
          .setTitle('🎉 Your Account Has Been Approved!')
          .setColor(0x00ff00)
          .setDescription('Congratulations! Your TikTok account has been verified and approved.')
          .addFields(
            { name: '✅ Status', value: 'Account Verified', inline: true },
            { name: '🎯 Next Steps', value: 'You can now access our content library and start posting to earn!', inline: false }
          )
          .setFooter({ text: 'Welcome to the team!' })
          .setTimestamp();

        await user.send({ embeds: [userApprovalEmbed] });
      } catch (dmError) {
        console.log(`Could not send DM to ${user.tag}:`, dmError.message);
      }

      // Log the action
      await client.logAction(
        'Final Verification Approved',
        `${interaction.user.tag} approved final verification for ${user.tag} (${userId})`
      );

    } catch (error) {
      console.error('Error in handleApproveFinalVerification:', error);
      await interaction.reply({
        content: '❌ An error occurred while approving the verification.',
        ephemeral: true
      });
    }
  }

  async handleRejectFinalVerification(interaction, client) {
    try {
      // Check if user has moderator or admin role
      const member = interaction.member;
      const hasModRole = member.roles.cache.has(client.config.roles.moderator);
      const hasAdminRole = member.roles.cache.has(client.config.roles.admin);
      
      if (!hasModRole && !hasAdminRole) {
        return await interaction.reply({
          content: '❌ You do not have permission to reject verifications. Only moderators and admins can use this button.',
          ephemeral: true
        });
      }

      // Extract user ID from button customId
      const userId = interaction.customId.replace('reject_final_verification_', '');
      const user = await client.users.fetch(userId);
      
      if (!user) {
        return await interaction.reply({
          content: '❌ User not found.',
          ephemeral: true
        });
      }

      // Create rejection embed
      const rejectionEmbed = new EmbedBuilder()
        .setTitle('❌ Verification Rejected')
        .setColor(0xff0000)
        .setDescription(`**User:** ${user.tag} (<@${userId}>)\n**Status:** Rejected by ${interaction.user.tag}`)
        .addFields(
          { name: '📋 Reason', value: 'Please contact support for more information.', inline: false },
          { name: '📅 Rejected', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
        )
        .setFooter({ text: 'User can reapply after addressing issues' })
        .setTimestamp();

      // Update the original message with rejection status
      await interaction.update({
        embeds: [rejectionEmbed],
        components: [] // Remove buttons
      });

      // Send DM to rejected user
      try {
        const userRejectionEmbed = new EmbedBuilder()
          .setTitle('❌ Verification Needs Review')
          .setColor(0xff0000)
          .setDescription('Your TikTok account verification requires additional review.')
          .addFields(
            { name: '📋 Status', value: 'Verification Rejected', inline: true },
            { name: '🔍 Next Steps', value: 'Please contact our support team for more information about what needs to be addressed.', inline: false }
          )
          .setFooter({ text: 'You can reapply after addressing any issues' })
          .setTimestamp();

        await user.send({ embeds: [userRejectionEmbed] });
      } catch (dmError) {
        console.log(`Could not send DM to ${user.tag}:`, dmError.message);
      }

      // Log the action
      await client.logAction(
        'Final Verification Rejected',
        `${interaction.user.tag} rejected final verification for ${user.tag} (${userId})`
      );

    } catch (error) {
      console.error('Error in handleRejectFinalVerification:', error);
      await interaction.reply({
        content: '❌ An error occurred while rejecting the verification.',
        ephemeral: true
      });
    }
  }
}

module.exports = new OnboardingHandlers();