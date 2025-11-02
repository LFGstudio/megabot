const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const User = require('../models/User');
const OnboardingProgress = require('../models/OnboardingProgress');
const { initializeTasks, getTasksForDay } = require('./onboardingTasks');
const llmService = require('./llmService');
const onboardingDataCollector = require('./onboardingDataCollector');

class OnboardingHandlers {
  constructor() {}

  async handleGetStarted(interaction, client) {
    try {
      console.log('🔍 Starting handleGetStarted for user:', interaction.user.tag);
      
      // Find ALL onboarding categories
      const allOnboardingCategories = interaction.guild.channels.cache.filter(
        channel => channel.name.toLowerCase().includes('onboarding') && channel.type === ChannelType.GuildCategory
      );
      console.log('🔍 Found onboarding categories:', allOnboardingCategories.map(c => c.name).join(', '));
      
      // Find the onboarding category with the least channels (or most recent)
      let onboardingCategory = null;
      let minChannelCount = Infinity;
      
      for (const category of allOnboardingCategories) {
        const channelCount = interaction.guild.channels.cache.filter(
          c => c.parentId === category.id && c.type === ChannelType.GuildText
        ).size;
        console.log(`🔍 Category ${category.name} has ${channelCount} channels`);
        
        if (channelCount < minChannelCount) {
          minChannelCount = channelCount;
          onboardingCategory = category;
        }
      }
      
      console.log('🔍 Selected onboarding category:', onboardingCategory ? onboardingCategory.name : 'none');

      // If no onboarding category found, try to use the guild's first category or create one
      if (!onboardingCategory) {
        // Try to find any category
        onboardingCategory = interaction.guild.channels.cache.find(channel => channel.type === ChannelType.GuildCategory);
        
        if (!onboardingCategory) {
          // Create onboarding category if none exists
          try {
            onboardingCategory = await interaction.guild.channels.create({
              name: 'Onboarding',
              type: ChannelType.GuildCategory
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
        // Reuse existing channel if already created - check by both name AND user permissions
        const existing = interaction.guild.channels.cache.find(c => 
          c.parentId === onboardingCategory.id && 
          c.name === channelName &&
          c.permissionsFor(interaction.user.id)?.has('ViewChannel')
        );
        
        // Build permission overwrites dynamically based on what roles exist
        const permissionOverwrites = [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel, 
              PermissionFlagsBits.SendMessages, 
              PermissionFlagsBits.ReadMessageHistory, 
              PermissionFlagsBits.EmbedLinks, 
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ManageChannels
            ]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel, 
              PermissionFlagsBits.SendMessages, 
              PermissionFlagsBits.ReadMessageHistory
            ]
          }
        ];
        
        // Only add moderator role if it exists in config
        if (client.config.roles.moderator) {
          permissionOverwrites.push({
            id: client.config.roles.moderator,
            allow: [
              PermissionFlagsBits.ViewChannel, 
              PermissionFlagsBits.SendMessages, 
              PermissionFlagsBits.ReadMessageHistory, 
              PermissionFlagsBits.ManageMessages
            ]
          });
        }
        
        // Only add admin role if it exists in config
        if (client.config.roles.admin) {
          permissionOverwrites.push({
            id: client.config.roles.admin,
            allow: [
              PermissionFlagsBits.ViewChannel, 
              PermissionFlagsBits.SendMessages, 
              PermissionFlagsBits.ReadMessageHistory, 
              PermissionFlagsBits.ManageMessages, 
              PermissionFlagsBits.ManageChannels
            ]
          });
        }
        
        console.log('🔧 Creating onboarding channel:', channelName, 'in category:', onboardingCategory?.name);
        console.log('🔧 Permission overwrites count:', permissionOverwrites.length);
        console.log('🔧 Existing channel found:', !!existing);
        
        const onboardingChannel = existing || await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: onboardingCategory.id,
          topic: `Personal onboarding journey for ${interaction.user.tag}`,
          permissionOverwrites: permissionOverwrites
        });
        
        console.log('✅ Onboarding channel created/found:', onboardingChannel.id);

        // Initialize or get onboarding progress (only if new channel)
        let onboardingProgress = null;
        if (!existing) {
          try {
            // Check if onboarding progress already exists
            onboardingProgress = await OnboardingProgress.findOne({ user_id: interaction.user.id });
            
            if (!onboardingProgress) {
              // Initialize new onboarding progress with tasks
              onboardingProgress = new OnboardingProgress({
                user_id: interaction.user.id,
                channel_id: onboardingChannel.id,
                current_day: 1,
                tasks: initializeTasks(),
                conversation_history: [],
                llm_enabled: llmService.isEnabled()
              });
              await onboardingProgress.save();
              console.log('✅ Onboarding progress initialized for user:', interaction.user.id);
            } else {
              // Update channel ID if it changed
              onboardingProgress.channel_id = onboardingChannel.id;
              await onboardingProgress.save();
            }

            // Initialize onboarding data collection
            try {
              const OnboardingData = require('../models/OnboardingData');
              let onboardingData = await OnboardingData.findOne({ user_id: interaction.user.id });
              
              if (!onboardingData) {
                onboardingData = new OnboardingData({
                  user_id: interaction.user.id,
                  discord_username: interaction.user.username,
                  discord_tag: `${interaction.user.username}#${interaction.user.discriminator}`,
                  collected_via: 'llm_conversation'
                });
                await onboardingData.save();
                console.log('✅ Onboarding data collection initialized for user:', interaction.user.id);
              }
            } catch (dataError) {
              console.error('Error initializing onboarding data:', dataError);
              // Continue even if data initialization fails
            }
          } catch (progressError) {
            console.error('Error initializing onboarding progress:', progressError);
            // Continue with manual onboarding if LLM setup fails
          }
        } else {
          // Get existing progress if channel already exists
          onboardingProgress = await OnboardingProgress.findOne({ user_id: interaction.user.id });
        }

        // Post LLM-guided onboarding welcome message (only if new channel)
        if (!existing) {
          await this.sendDayWelcomeMessage(onboardingChannel, interaction.user, client, onboardingProgress);
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
        
        // Check for specific Discord API errors
        let errorMessage = '❌ Failed to create onboarding channel.';
        if (channelError.code === 50035) {
          errorMessage = '❌ Too many channels exist. Please contact an administrator to clean up old channels.';
        } else if (channelError.message?.includes('Missing Access')) {
          errorMessage = '❌ Bot lacks permission to create channels. Please contact an administrator.';
        }
        
        return await interaction.reply({
          content: errorMessage,
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

  /**
   * Send welcome message for a specific day with tasks
   */
  async sendDayWelcomeMessage(channel, user, client, onboardingProgress) {
    try {
      const currentDay = onboardingProgress?.current_day || 1;
      const dayData = getTasksForDay(currentDay);
      
      if (!dayData) {
        console.error('No day data found for day:', currentDay);
        return;
      }

      const dayTasks = onboardingProgress?.getCurrentDayTasks() || { tasks: [] };

      // Build task list
      let taskList = '';
      dayTasks.tasks.forEach((task, index) => {
        const status = task.completed ? '✅' : '📋';
        taskList += `${status} **Task ${index + 1}**: ${task.title}\n`;
        if (!task.completed) {
          taskList += `   ${task.description}\n\n`;
        } else {
          taskList += `   ✓ Completed\n\n`;
        }
      });

      // Generate LLM welcome message if enabled
      let welcomeMessage = `Welcome to Day ${currentDay}! Let's get started with your tasks.`;
      if (llmService.isEnabled() && onboardingProgress) {
        try {
          const llmResponse = await llmService.generateResponse(
            `I'm starting Day ${currentDay} of onboarding. Can you welcome me and explain what I need to do today?`,
            onboardingProgress.conversation_history || [],
            {
              currentDay,
              tasks: dayTasks.tasks,
              userName: user.username,
              userRole: 'New Member'
            }
          );
          
          if (llmResponse.success) {
            welcomeMessage = llmResponse.message;
            await onboardingProgress.addConversationMessage('assistant', welcomeMessage, []);
          }
        } catch (llmError) {
          console.error('Error generating welcome message with LLM:', llmError);
          // Continue with default welcome message
        }
      }

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`🎯 Day ${currentDay}: ${dayData.day_title}`)
        .setDescription(`${welcomeMessage}\n\n${dayData.day_description}`)
        .addFields(
          { name: `📋 Today's Tasks (${dayTasks.tasks.filter(t => !t.completed).length} remaining)`, value: taskList || 'No tasks available', inline: false },
          { name: '💬 Need Help?', value: 'Just type your questions here! I\'m here to help guide you through each step.', inline: false }
        )
        .setColor(0x5865F2)
        .setFooter({ text: `Progress: Day ${currentDay} of 5 • You can chat with me anytime!` })
        .setTimestamp();

      // Build mention string
      const hasModerator = client.config.roles.moderator;
      const mentionString = hasModerator 
        ? `<@${user.id}> <@&${client.config.roles.moderator}>`
        : `<@${user.id}>`;

      await channel.send({
        content: mentionString,
        embeds: [welcomeEmbed]
      });

      // Add system message to conversation history
      if (onboardingProgress) {
        await onboardingProgress.addConversationMessage('system', `Day ${currentDay} started. Tasks: ${dayTasks.tasks.map(t => t.title).join(', ')}`, []);
      }

    } catch (error) {
      console.error('Error sending day welcome message:', error);
      // Fallback to basic message
      const fallbackEmbed = new EmbedBuilder()
        .setTitle('👋 Welcome to Your Onboarding Journey!')
        .setDescription(`Hi ${user}, welcome to your 5-day onboarding process!`)
        .setColor(0x5865F2)
        .setTimestamp();
      
      await channel.send({ embeds: [fallbackEmbed] });
    }
  }

  /**
   * Handle LLM conversation in onboarding channel
   */
  async handleOnboardingMessage(message, client) {
    try {
      // Ignore bot messages
      if (message.author.bot) return;

      // Check if this is an onboarding channel
      const onboardingProgress = await OnboardingProgress.findOne({ 
        channel_id: message.channel.id 
      });

      if (!onboardingProgress || !onboardingProgress.llm_enabled) {
        return; // Not an onboarding channel or LLM disabled
      }

      // Check if bot is muted (moderators/admins can mute bot)
      if (onboardingProgress.bot_muted) {
        // Check if the message is from a moderator/admin
        const member = message.member;
        const isModerator = client.config.roles.moderator && 
                           member.roles.cache.has(client.config.roles.moderator);
        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator) ||
                       (client.config.roles.admin && member.roles.cache.has(client.config.roles.admin));
        
        // If a moderator/admin is speaking, don't reply
        if (isModerator || isAdmin) {
          return; // Bot won't reply when muted and moderator/admin is talking
        }
        // Regular users can still interact even when muted (bot will respond to them)
      }

      // Get user model for context
      const user = await User.findOne({ discord_id: message.author.id });

      // Process images from message attachments
      const imageDataArray = [];
      const imageMetadata = [];
      
      if (message.attachments && message.attachments.size > 0) {
        for (const attachment of message.attachments.values()) {
          // Check if attachment is an image
          if (attachment.contentType && attachment.contentType.startsWith('image/')) {
            try {
              // Download image
              const response = await require('axios').get(attachment.url, {
                responseType: 'arraybuffer'
              });
              
              // Convert to base64
              const base64Image = Buffer.from(response.data).toString('base64');
              
              // Store image data for LLM
              imageDataArray.push({
                mimeType: attachment.contentType,
                data: base64Image
              });
              
              // Store image metadata
              imageMetadata.push({
                url: attachment.url,
                filename: attachment.name,
                mimeType: attachment.contentType,
                size: attachment.size,
                description: null // Will be filled by AI analysis
              });
              
              console.log(`📷 Processed image: ${attachment.name} (${attachment.contentType})`);
            } catch (imgError) {
              console.error('Error processing image:', imgError);
            }
          }
        }
      }

      // Generate image descriptions using AI if images were uploaded
      if (imageDataArray.length > 0) {
        for (let i = 0; i < imageDataArray.length; i++) {
          const analysis = await llmService.analyzeImage(
            imageDataArray[i],
            {
              currentDay: onboardingProgress.current_day,
              tasks: onboardingProgress.getCurrentDayTasks().tasks
            },
            'Describe what you see in this image. Be specific and helpful for the onboarding process.'
          );
          
          if (analysis.success) {
            imageMetadata[i].description = analysis.analysis;
          }
        }
      }

      // Add user message to conversation history with images
      await onboardingProgress.addConversationMessage('user', message.content || '[Image(s) shared]', imageMetadata);
      
      // Update last_user_message timestamp
      onboardingProgress.last_user_message = new Date();
      await onboardingProgress.save();

      // Extract and store data from user message (TikTok profile, country, etc.)
      try {
        await onboardingDataCollector.extractAndStoreData(
          message.author.id,
          message.content || '',
          imageDataArray.map((img, idx) => ({
            mimeType: img.mimeType,
            data: img.data,
            url: imageMetadata[idx]?.url,
            filename: imageMetadata[idx]?.filename,
            description: imageMetadata[idx]?.description
          })),
          {
            currentDay: onboardingProgress.current_day,
            tasks: onboardingProgress.getCurrentDayTasks().tasks,
            discordUser: message.author
          }
        );
      } catch (dataError) {
        console.error('Error collecting onboarding data:', dataError);
        // Continue even if data collection fails
      }

      // Generate LLM response with images
      const dayData = getTasksForDay(onboardingProgress.current_day);
      const dayTasks = onboardingProgress.getCurrentDayTasks();

      const llmResponse = await llmService.generateResponse(
        message.content || 'I\'ve shared some images. What do you see?',
        onboardingProgress.conversation_history.slice(-10), // Last 10 messages for context
        {
          currentDay: onboardingProgress.current_day,
          tasks: dayTasks.tasks,
          userName: message.author.username,
          userRole: user?.role || 'New Member'
        },
        imageDataArray // Pass images to LLM
      );

      if (llmResponse.success) {
        // Add assistant response to history
        await onboardingProgress.addConversationMessage('assistant', llmResponse.message);

        // Send response
        await message.reply(llmResponse.message);

        // Check if user mentioned completing a task
        await this.checkTaskCompletion(message.content || '', onboardingProgress, message);
      } else {
        await message.reply('I apologize, but I\'m having trouble right now. Please try again or contact a moderator.');
      }

    } catch (error) {
      console.error('Error handling onboarding message:', error);
      // Send a helpful error message
      try {
        await message.reply('❌ I encountered an error processing your message. Please try again or contact a moderator if the issue persists.');
      } catch (replyError) {
        console.error('Error sending error message:', replyError);
      }
    }
  }

  /**
   * Check if user message indicates task completion
   */
  async checkTaskCompletion(messageContent, onboardingProgress, discordMessage) {
    try {
      const dayTasks = onboardingProgress.getCurrentDayTasks();
      const lowerContent = messageContent.toLowerCase();

      // Check for task completion keywords
      const completionKeywords = ['completed', 'done', 'finished', 'complete', 'finished task', 'done with task'];
      const hasCompletionKeyword = completionKeywords.some(keyword => lowerContent.includes(keyword));

      if (hasCompletionKeyword) {
        // Try to identify which task
        for (const task of dayTasks.tasks) {
          if (!task.completed && lowerContent.includes(task.title.toLowerCase().substring(0, 10))) {
            // Mark task as completed
            await onboardingProgress.completeTask(onboardingProgress.current_day, task.id, messageContent);
            
            // Check if all tasks for the day are complete
            const allComplete = await onboardingProgress.checkDayCompletion(onboardingProgress.current_day);
            
            if (allComplete) {
              const currentDay = onboardingProgress.current_day;
              const isLastDay = currentDay === 5;
              
              const completionEmbed = new EmbedBuilder()
                .setTitle('🎉 Day Complete!')
                .setDescription(`Congratulations! You've completed all tasks for Day ${currentDay}!`)
                .setColor(0x00ff00)
                .setTimestamp();
              
              if (isLastDay) {
                completionEmbed.addFields(
                  { name: '🎊 Congratulations!', value: 'You\'ve completed the entire onboarding process! A moderator will verify your completion and grant you access.', inline: false }
                );
              } else {
                completionEmbed.addFields(
                  { name: '✅ Next Steps', value: `Great job! You're now ready for Day ${currentDay + 1}. I'll set that up for you now!`, inline: false }
                );
              }
              
              await discordMessage.channel.send({ embeds: [completionEmbed] });
              
              // Automatically advance to next day if not the last day
              if (!isLastDay) {
                // Wait a moment, then advance
                setTimeout(async () => {
                  await onboardingProgress.advanceToNextDay(false); // Use normal advance (day is complete)
                  
                  // Update channel name and category
                  const guild = client.guilds.cache.first();
                  await this.updateChannelForDay(onboardingProgress.channel_id, onboardingProgress.current_day, guild);
                  
                  const channel = await client.channels.fetch(onboardingProgress.channel_id);
                  const user = await client.users.fetch(onboardingProgress.user_id);
                  await this.sendDayWelcomeMessage(channel, user, client, onboardingProgress);
                }, 3000); // 3 second delay
              }
            } else {
              const remainingCount = dayTasks.tasks.filter(t => !t.completed).length;
              await discordMessage.react('✅');
              await discordMessage.channel.send(`Great! Task "${task.title}" marked as complete. ${remainingCount} task(s) remaining for today.`);
            }
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error checking task completion:', error);
    }
  }

  /**
   * Advance user to next day (can be called manually or automatically)
   */
  async advanceToNextDay(channelId, client) {
    try {
      const onboardingProgress = await OnboardingProgress.findOne({ channel_id: channelId });
      
      if (!onboardingProgress) {
        return false;
      }

      if (onboardingProgress.current_day < 5) {
        // Force advance (used by admin command)
        const advanced = await onboardingProgress.advanceToNextDay(true); // Force advance
        
        if (advanced) {
          // Update channel name and category based on new day
          await this.updateChannelForDay(channelId, onboardingProgress.current_day, client.guilds.cache.first());
          
          // Send next day welcome message
          const channel = await client.channels.fetch(channelId);
          const user = await client.users.fetch(onboardingProgress.user_id);
          
          await this.sendDayWelcomeMessage(channel, user, client, onboardingProgress);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error advancing to next day:', error);
      return false;
    }
  }

  /**
   * Update channel name and category based on current day
   */
  async updateChannelForDay(channelId, currentDay, guild) {
    try {
      const channel = await guild.channels.fetch(channelId);
      if (!channel) return;

      // Extract username from current channel name
      let userName;
      if (channel.name.startsWith('onboarding-')) {
        userName = channel.name.replace('onboarding-', '');
      } else if (channel.name.startsWith('day-')) {
        // Extract username from day-X-username format
        const parts = channel.name.split('-');
        userName = parts.slice(2).join('-');
      } else {
        userName = channel.name;
      }
      
      // Create new channel name based on current day
      let newChannelName;
      if (currentDay === 1) {
        newChannelName = `onboarding-${userName}`;
      } else {
        newChannelName = `day-${currentDay}-${userName}`;
      }

      // Only rename if different
      if (channel.name !== newChannelName) {
        await channel.setName(newChannelName);
        console.log(`✅ Renamed channel from ${channel.name} to ${newChannelName}`);
      }

      // Move channel to appropriate category
      await this.moveChannelToCategory(channel, currentDay, guild);
    } catch (error) {
      console.error('Error updating channel for day:', error);
    }
  }

  /**
   * Move channel to appropriate category based on day
   */
  async moveChannelToCategory(channel, currentDay, guild) {
    try {
      let categoryName;
      
      // Determine category based on day
      if (currentDay === 1) {
        categoryName = 'Onboarding';
      } else {
        categoryName = `Day ${currentDay}`;
      }

      // Find or create the category
      let category = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name === categoryName
      );

      if (!category) {
        // Create category if it doesn't exist
        category = await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory
        });
        console.log(`✅ Created category: ${categoryName}`);
      }

      // Only move if not already in the right category
      if (channel.parentId !== category.id) {
        await channel.setParent(category.id);
        console.log(`✅ Moved channel ${channel.name} to category ${categoryName}`);
      }
    } catch (error) {
      console.error('Error moving channel to category:', error);
    }
  }

  /**
   * Check for inactive onboarding channels and delete them (Days 1-2 only)
   */
  async checkAndDeleteInactiveChannels(client) {
    try {
      const OnboardingProgress = require('../models/OnboardingProgress');
      
      // Find all active onboarding progress documents
      const allProgress = await OnboardingProgress.find({ status: { $ne: 'completed' } });
      
      console.log(`🔍 Checking ${allProgress.length} active onboarding channels for inactivity...`);
      
      let deletedCount = 0;
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      for (const progress of allProgress) {
        try {
          // Only check Days 1-2
          if (progress.current_day > 2) {
            continue;
          }

          const channel = await client.channels.fetch(progress.channel_id).catch(() => null);
          if (!channel) {
            console.log(`⚠️ Channel ${progress.channel_id} not found, skipping...`);
            continue;
          }

          // Check if user has sent a message in the last 24 hours
          // We'll check the last_user_message timestamp from progress
          const hasRecentActivity = progress.last_user_message && 
                                     new Date(progress.last_user_message) > twentyFourHoursAgo;

          if (!hasRecentActivity) {
            // Delete the channel and mark progress as inactive
            console.log(`🗑️ Deleting inactive channel: ${channel.name} (Day ${progress.current_day})`);
            
            // Notify user before deletion
            const warningEmbed = new EmbedBuilder()
              .setTitle('⏰ Channel Inactivity Warning')
              .setDescription(`This onboarding channel has been inactive for 24 hours and will be deleted.`)
              .addFields(
                { name: '📋 Status', value: `Day ${progress.current_day} - No activity detected`, inline: false },
                { name: '💡 Note', value: 'Channels with no activity for 24+ hours on Days 1-2 are automatically cleaned up. Start fresh anytime!', inline: false }
              )
              .setColor(0xff9900)
              .setTimestamp();

            try {
              await channel.send({ embeds: [warningEmbed] });
              await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second warning
            } catch (notifyError) {
              console.log('Could not send warning message, proceeding with deletion');
            }

            // Delete channel
            await channel.delete();
            
            // Mark progress as inactive
            progress.status = 'inactive';
            await progress.save();
            
            deletedCount++;
          }
        } catch (error) {
          console.error(`Error processing channel ${progress.channel_id}:`, error);
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} inactive onboarding channels (Days 1-2 only)`);
      } else {
        console.log('✅ No inactive channels found (Days 1-2)');
      }
    } catch (error) {
      console.error('Error checking and deleting inactive channels:', error);
    }
  }
}

module.exports = new OnboardingHandlers();