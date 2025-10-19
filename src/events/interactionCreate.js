const { InteractionType } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      console.log(`🔍 Interaction received: ${interaction.type} - ${interaction.customId || 'No customId'}`);
      
      if (interaction.type === InteractionType.ApplicationCommand) {
        // Handle slash commands
        await client.commandHandler.handleSlashCommand(interaction);
      } else if (interaction.type === InteractionType.MessageComponent) {
        // Handle button interactions
        await handleButtonInteraction(interaction, client);
      } else if (interaction.type === InteractionType.ModalSubmit) {
        // Handle modal submissions
        await handleModalSubmit(interaction, client);
      }
    } catch (error) {
      console.error('Error in interactionCreate event:', error);
      
      const errorMessage = {
        content: '❌ An error occurred while processing your request.',
        ephemeral: true
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
};

async function handleModalSubmit(interaction, client) {
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const User = require('../models/User');

  try {
    const customId = interaction.customId;

    if (customId === 'account_verification_modal') {
      await handleAccountVerificationModal(interaction, client);
    } else if (customId === 'tiktok_verification_modal') {
      await handleTikTokVerificationModal(interaction, client);
    } else if (customId === 'warmup_verification_modal') {
      await handleWarmupVerificationModal(interaction, client);
    } else if (customId === 'add_tiktok_account_modal') {
      await handleAddTikTokAccountModal(interaction, client);
    } else if (customId === 'onboarding_ticket_modal') {
      const onboardingSupportHandlers = require('../utils/onboardingSupportHandlers');
      await onboardingSupportHandlers.handleTicketSubmit(interaction, client);
    } else if (customId === 'test_modal') {
      await handleTestModal(interaction, client);
    }

  } catch (error) {
    console.error('Error in handleModalSubmit:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your submission.',
      ephemeral: true
    });
  }
}

async function handleButtonInteraction(interaction, client) {
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
  const User = require('../models/User');
  const ButtonHandlers = require('../utils/buttonHandlers');

  try {
    const customId = interaction.customId;
    console.log(`🔍 Button clicked: ${customId}`);
    console.log(`🔍 Button customId starts with 'verify_account_creation_': ${customId.startsWith('verify_account_creation_')}`);
    console.log(`🔍 Button customId starts with 'reject_account_creation_': ${customId.startsWith('reject_account_creation_')}`);
    
    // Handle ticket system buttons
    if (customId.startsWith('ticket_')) {
      if (customId === 'ticket_register') {
        await ButtonHandlers.handleTicketRegister(interaction, client);
      } else if (customId === 'ticket_warmup') {
        await ButtonHandlers.handleTicketWarmup(interaction, client);
      } else if (customId === 'ticket_help') {
        await ButtonHandlers.handleTicketHelp(interaction, client);
      } else if (customId === 'ticket_stats') {
        await ButtonHandlers.handleTicketStats(interaction, client);
      } else if (customId === 'ticket_leaderboard') {
        await ButtonHandlers.handleTicketLeaderboard(interaction, client);
      }
      return;
    }

    // Handle onboarding flow buttons
    const OnboardingHandlers = require('../utils/onboardingHandlers');
    if (customId === 'start_onboarding') {
      await OnboardingHandlers.handleStartOnboarding(interaction, client);
      return;
    } else if (customId === 'submit_account_verification') {
      await OnboardingHandlers.handleSubmitAccountVerification(interaction, client);
      return;
    } else if (customId === 'submit_tiktok_verification') {
      await OnboardingHandlers.handleSubmitTikTokVerification(interaction, client);
      return;
    } else if (customId === 'submit_warmup_verification') {
      await OnboardingHandlers.handleSubmitWarmupVerification(interaction, client);
      return;
    } else if (customId === 'copy_referral_link') {
      await handleCopyReferralLink(interaction, client);
      return;
    }

    // Handle onboarding support buttons
    if (customId === 'create_onboarding_ticket') {
      const onboardingSupportHandlers = require('../utils/onboardingSupportHandlers');
      await onboardingSupportHandlers.handleCreateTicket(interaction, client);
      return;
    } else if (customId.startsWith('close_ticket_')) {
      const onboardingSupportHandlers = require('../utils/onboardingSupportHandlers');
      await onboardingSupportHandlers.handleCloseTicket(interaction, client);
      return;
    } else if (customId.startsWith('escalate_ticket_')) {
      const onboardingSupportHandlers = require('../utils/onboardingSupportHandlers');
      await onboardingSupportHandlers.handleEscalateTicket(interaction, client);
      return;
    }

    // Handle referral channel buttons
    const ReferralChannelHandlers = require('../utils/referralChannelHandlers');
    if (customId === 'get_referral_link') {
      await ReferralChannelHandlers.handleGetReferralLink(interaction, client);
      return;
    } else if (customId === 'view_referral_stats') {
      await ReferralChannelHandlers.handleViewReferralStats(interaction, client);
      return;
    } else if (customId === 'referral_leaderboard') {
      await ReferralChannelHandlers.handleReferralLeaderboard(interaction, client);
      return;
    } else if (customId === 'my_referral_earnings') {
      await ReferralChannelHandlers.handleMyReferralEarnings(interaction, client);
      return;
    } else if (customId === 'referral_rankings') {
      await ReferralChannelHandlers.handleReferralRankings(interaction, client);
      return;
    } else if (customId === 'referral_tips') {
      await ReferralChannelHandlers.handleReferralTips(interaction, client);
      return;
    }

    // Handle account stats buttons
    const AccountStatsHandlers = require('../utils/accountStatsHandlers');
    if (customId === 'add_new_account') {
      await AccountStatsHandlers.handleAddNewAccount(interaction, client);
      return;
    } else if (customId === 'view_my_accounts') {
      await AccountStatsHandlers.handleViewMyAccounts(interaction, client);
      return;
    } else if (customId === 'view_my_stats') {
      await AccountStatsHandlers.handleViewMyStats(interaction, client);
      return;
    } else if (customId === 'view_my_earnings') {
      await AccountStatsHandlers.handleViewMyEarnings(interaction, client);
      return;
    } else if (customId === 'account_help') {
      await AccountStatsHandlers.handleAccountHelp(interaction, client);
      return;
    }
    
    // Handle account creation verification (MUST come before general account verification)
    if (customId.startsWith('verify_account_creation_') || customId.startsWith('reject_account_creation_')) {
      console.log(`🔍 Handling account creation verification: ${customId}`);
      try {
        const userId = customId.replace('verify_account_creation_', '').replace('reject_account_creation_', '');
        const action = customId.startsWith('verify_account_creation_') ? 'verify_account' : 'reject_account';
        
        console.log(`🔍 Parsed - userId: ${userId}, action: ${action}`);
        await handleAccountCreationVerification(interaction, client, action, userId);
        return;
      } catch (error) {
        console.error('❌ Error in account creation verification button handler:', error);
        console.error('❌ Error stack:', error.stack);
        await interaction.reply({
          content: `❌ Error processing verification: ${error.message}`,
          ephemeral: true
        });
        return;
      }
    }

    // Handle account verification approval/rejection (general)
    if (customId.startsWith('verify_account_') || customId.startsWith('reject_account_')) {
      const parts = customId.split('_');
      const action = parts[1]; // 'verify' or 'reject'
      const userId = parts[2];
      const username = parts[3];
      
      await handleAccountVerification(interaction, client, action, userId, username);
      return;
    }

    // Handle warmup verification
    if (customId.startsWith('verify_warmup_') || customId.startsWith('reject_warmup_')) {
      console.log(`🔍 Handling warmup verification: ${customId}`);
      const userId = customId.split('_')[2];
      const action = customId.startsWith('verify_warmup_') ? 'verify' : 'reject';
      
      console.log(`🔍 Warmup verification - userId: ${userId}, action: ${action}`);
      try {
        await handleWarmupVerification(interaction, client, action, userId);
      } catch (error) {
        console.error('❌ Error in warmup verification button handler:', error);
        console.error('❌ Error stack:', error.stack);
        await interaction.reply({
          content: `❌ Error processing warmup verification: ${error.message}`,
          ephemeral: true
        });
      }
      return;
    }

    // Handle verification approval/rejection (legacy)
    if (customId.startsWith('verify_approve_') || customId.startsWith('verify_reject_')) {
      const userId = customId.split('_')[2];
      const action = customId.split('_')[1];
      
      // Check if user has admin permissions
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({
          content: '❌ You need administrator permissions to approve/reject verifications.',
          ephemeral: true
        });
      }

      const user = await User.findOne({ discord_id: userId });
      if (!user) {
        return interaction.reply({
          content: '❌ User not found in database.',
          ephemeral: true
        });
      }

      if (action === 'approve') {
        // Update user role to next step
        if (user.role === 'new') {
          user.role = 'onboarding_started';
        } else if (user.role === 'onboarding_started') {
          user.role = 'account_created';
        } else if (user.role === 'account_created') {
          user.role = 'warming_up';
        } else if (user.role === 'warming_up') {
          user.role = 'clipper';
        }
        await user.save();

        const embed = new EmbedBuilder()
          .setTitle('✅ Verification Approved')
          .setDescription(`User <@${userId}> has been approved and their role updated.`)
          .setColor(0x00ff00)
          .addFields(
            { name: 'New Role', value: user.role, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else if (action === 'reject') {
        const embed = new EmbedBuilder()
          .setTitle('❌ Verification Rejected')
          .setDescription(`Verification for user <@${userId}> has been rejected.`)
          .setColor(0xff0000)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    }

  } catch (error) {
    console.error('❌ Error in handleButtonInteraction:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Button customId:', interaction.customId);
    console.error('❌ Interaction type:', interaction.type);
    
    try {
      await interaction.reply({
        content: `❌ An error occurred while processing your request: ${error.message}`,
        ephemeral: true
      });
    } catch (replyError) {
      console.error('❌ Error replying to button interaction:', replyError);
    }
  }
}

async function handleAccountVerificationModal(interaction, client) {
  const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  
  try {
    const username = interaction.fields.getTextInputValue('tiktok_username');
    const profileLink = interaction.fields.getTextInputValue('profile_link');
    const country = interaction.fields.getTextInputValue('country');
    const paymentMethod = interaction.fields.getTextInputValue('payment_method');

    // Create verification channel
    const verificationCategory = interaction.guild.channels.cache.get(client.config.categories.verification);
    console.log(`🔍 Verification category ID: ${client.config.categories.verification}`);
    console.log(`🔍 Verification category found: ${!!verificationCategory}`);
    console.log(`🔍 Available categories:`, interaction.guild.channels.cache.filter(c => c.type === 4).map(c => `${c.name} (${c.id})`));
    
    if (!verificationCategory) {
      return interaction.reply({
        content: '❌ Verification category not found. Please ensure VERIFICATION_CATEGORY_ID is set in the environment variables.',
        ephemeral: true
      });
    }

    // Check if bot has permission to create channels in this category
    const botMember = interaction.guild.members.cache.get(client.user.id);
    const categoryPermissions = verificationCategory.permissionsFor(botMember);
    console.log(`🔍 Bot permissions in category:`, categoryPermissions.toArray());
    
    if (!categoryPermissions.has('ManageChannels')) {
      return interaction.reply({
        content: '❌ Bot does not have permission to create channels in the verification category. Please contact an administrator.',
        ephemeral: true
      });
    }

    const channelName = `account-verify-${username}-${interaction.user.username}`;
    console.log(`🔧 Creating channel: ${channelName} in category: ${verificationCategory.name}`);
    
    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: verificationCategory,
      topic: `Account Creation Verification for ${interaction.user.tag}`,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        },
        {
          id: client.config.roles.admin,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
        },
        {
          id: client.config.roles.moderator || client.config.roles.admin,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        }
      ]
    });

    // Create verification embed
    const verificationEmbed = new EmbedBuilder()
      .setTitle('📱 Account Creation Verification Request')
      .setDescription(`**User:** ${interaction.user.tag} (<@${interaction.user.id}>)\n**Request:** Account Creation Verification`)
      .setColor(0xffa500)
      .addFields(
        { name: '👤 TikTok Username', value: `@${username}`, inline: true },
        { name: '🌍 Country', value: country, inline: true },
        { name: '💳 Payment Method', value: paymentMethod, inline: true },
        { name: '🔗 TikTok Profile Link', value: profileLink, inline: false },
        { name: '📋 Verification Type', value: 'Account Creation → Warm-up Role', inline: false }
      )
      .setFooter({ text: 'Review the information and click Verify to approve account creation' })
      .setTimestamp();

    // Create action row with verification buttons
    const verifyButtonId = `verify_account_creation_${interaction.user.id}`;
    const rejectButtonId = `reject_account_creation_${interaction.user.id}`;
    
    console.log(`🔧 Creating buttons - Verify: ${verifyButtonId}, Reject: ${rejectButtonId}`);
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(verifyButtonId)
          .setLabel('✅ Verify Account Creation')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(rejectButtonId)
          .setLabel('❌ Reject Account Creation')
          .setStyle(ButtonStyle.Danger)
      );

    // Send the verification message to the channel
    console.log(`📱 Channel created successfully: ${channel.id}`);
    console.log(`📱 Attempting to send verification message to channel: ${channel.name}`);
    
    try {
      await channel.send({ embeds: [verificationEmbed], components: [row] });
      console.log(`✅ Verification message sent successfully to channel: ${channel.name}`);
    } catch (sendError) {
      console.error('❌ Error sending verification message:', sendError);
      // If we can't send to the channel, delete it and inform the user
      try {
        await channel.delete('Failed to send verification message');
      } catch (deleteError) {
        console.error('Error deleting verification channel:', deleteError);
      }
      
      return interaction.reply({
        content: '❌ Failed to create verification channel. Please ensure the bot has proper permissions in the verification category.',
        ephemeral: true
      });
    }

    // Send confirmation to user
    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ Account Creation Verification Submitted')
      .setDescription(`Your account creation has been submitted for verification.`)
      .setColor(0x00ff00)
      .addFields(
        { name: '📱 Account', value: `@${username}`, inline: true },
        { name: '📋 Channel', value: `<#${channel.id}>`, inline: true },
        { name: '⏰ Status', value: 'Pending Review', inline: true }
      )
      .setFooter({ text: 'A moderator will review your account shortly' })
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

    // Log the action
    await client.logAction(
      'Account Creation Verification Requested',
      `<@${interaction.user.id}> requested account creation verification for TikTok account @${username}`
    );

  } catch (error) {
    console.error('Error in handleAccountVerificationModal:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your account creation verification request.',
      ephemeral: true
    });
  }
}

async function handleTikTokVerificationModal(interaction, client) {
  const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  
  try {
    const username = interaction.fields.getTextInputValue('tiktok_username');
    const profileLink = interaction.fields.getTextInputValue('profile_link');
    const country = interaction.fields.getTextInputValue('country');
    const paymentMethod = interaction.fields.getTextInputValue('payment_method');

    // Create verification channel
    const verificationCategory = interaction.guild.channels.cache.get(client.config.categories.verification);
    if (!verificationCategory) {
      return interaction.reply({
        content: '❌ Verification category not found. Please contact an administrator.',
        ephemeral: true
      });
    }

    const channelName = `tiktok-verify-${username}-${interaction.user.username}`;
    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: verificationCategory,
      topic: `TikTok Verification for ${interaction.user.tag}`,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        },
        {
          id: client.config.roles.admin,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
        },
        {
          id: client.config.roles.moderator || client.config.roles.admin,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        }
      ]
    });

    // Create verification embed
    const verificationEmbed = new EmbedBuilder()
      .setTitle('📱 TikTok Account Verification')
      .setDescription(`**User:** ${interaction.user.tag} (<@${interaction.user.id}>)`)
      .setColor(0xffa500)
      .addFields(
        { name: '👤 TikTok Username', value: username, inline: true },
        { name: '🔗 Profile Link', value: profileLink, inline: true },
        { name: '🌍 Country', value: country, inline: true },
        { name: '💳 Payment Method', value: paymentMethod, inline: true }
      )
      .setFooter({ text: 'Review the information and click Verify or Reject' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`verify_approve_${interaction.user.id}`)
          .setLabel('✅ Verify')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`verify_reject_${interaction.user.id}`)
          .setLabel('❌ Reject')
          .setStyle(ButtonStyle.Danger)
      );

    try {
      await channel.send({ embeds: [verificationEmbed], components: [row] });
    } catch (sendError) {
      console.error('Error sending verification message:', sendError);
      // If we can't send to the channel, delete it and inform the user
      try {
        await channel.delete('Failed to send verification message');
      } catch (deleteError) {
        console.error('Error deleting verification channel:', deleteError);
      }
      
      return interaction.reply({
        content: '❌ Failed to create verification channel. Please ensure the bot has proper permissions in the verification category.',
        ephemeral: true
      });
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ Verification Submitted')
      .setDescription('Your TikTok verification has been submitted for review.')
      .setColor(0x00ff00)
      .addFields(
        { name: '📋 Channel', value: `<#${channel.id}>`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

  } catch (error) {
    console.error('Error in handleTikTokVerificationModal:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your submission.',
      ephemeral: true
    });
  }
}

async function handleWarmupVerificationModal(interaction, client) {
  const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  
  try {
    const warmupCompleted = interaction.fields.getTextInputValue('warmup_completed');
    const profileLink = interaction.fields.getTextInputValue('profile_link');
    const fypScreenshot = interaction.fields.getTextInputValue('fyp_screenshot');

    // Create verification channel
    const verificationCategory = interaction.guild.channels.cache.get(client.config.categories.verification);
    if (!verificationCategory) {
      return interaction.reply({
        content: '❌ Verification category not found. Please contact an administrator.',
        ephemeral: true
      });
    }

    const channelName = `warmup-verify-${interaction.user.username}`;
    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: verificationCategory,
      topic: `Warm-up Verification for ${interaction.user.tag}`,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        },
        {
          id: client.config.roles.admin,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
        },
        {
          id: client.config.roles.moderator || client.config.roles.admin,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        }
      ]
    });

    // Create verification embed
    const verificationEmbed = new EmbedBuilder()
      .setTitle('🔥 Warm-up Verification Request')
      .setDescription(`**User:** ${interaction.user.tag} (<@${interaction.user.id}>)\n**Request:** Warm-up Verification`)
      .setColor(0xffa500)
      .addFields(
        { name: '✅ Warm-up Completed', value: warmupCompleted, inline: false },
        { name: '🔗 Updated Profile Link', value: profileLink, inline: false },
        { name: '📸 FYP Screenshot Description', value: fypScreenshot, inline: false },
        { name: '📋 Verification Type', value: 'Warm-up → Clipper Role', inline: false }
      )
      .setFooter({ text: 'Review the information and click Verify to approve warm-up completion' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`verify_warmup_${interaction.user.id}`)
          .setLabel('✅ Verify Warm-up → Clipper')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject_warmup_${interaction.user.id}`)
          .setLabel('❌ Reject Warm-up')
          .setStyle(ButtonStyle.Danger)
      );

    try {
      await channel.send({ embeds: [verificationEmbed], components: [row] });
    } catch (sendError) {
      console.error('Error sending verification message:', sendError);
      // If we can't send to the channel, delete it and inform the user
      try {
        await channel.delete('Failed to send verification message');
      } catch (deleteError) {
        console.error('Error deleting verification channel:', deleteError);
      }
      
      return interaction.reply({
        content: '❌ Failed to create verification channel. Please ensure the bot has proper permissions in the verification category.',
        ephemeral: true
      });
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ Verification Submitted')
      .setDescription('Your warm-up verification has been submitted for review.')
      .setColor(0x00ff00)
      .addFields(
        { name: '📋 Channel', value: `<#${channel.id}>`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

  } catch (error) {
    console.error('Error in handleWarmupVerificationModal:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your submission.',
      ephemeral: true
    });
  }
}

async function handleCopyReferralLink(interaction, client) {
  const User = require('../models/User');
  
  try {
    const user = await User.findOne({ discord_id: interaction.user.id });
    if (!user || !user.referral_invite_code) {
      return interaction.reply({
        content: '❌ You don\'t have a referral link yet. Use `/referral link` to generate one.',
        ephemeral: true
      });
    }

    const referralLink = `https://discord.gg/${user.referral_invite_code}`;
    
    await interaction.reply({
      content: `📋 **Your Referral Link:**\n\`${referralLink}\`\n\n💡 **Tip:** Share this link to earn 10% of your referrals' earnings!`,
      ephemeral: true
    });

  } catch (error) {
    console.error('Error in handleCopyReferralLink:', error);
    await interaction.reply({
      content: '❌ An error occurred while copying your referral link.',
      ephemeral: true
    });
  }
}

async function handleAddTikTokAccountModal(interaction, client) {
  const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  
  try {
    const username = interaction.fields.getTextInputValue('tiktok_username');
    const displayName = interaction.fields.getTextInputValue('display_name') || username;
    const country = interaction.fields.getTextInputValue('country');
    const paymentMethod = interaction.fields.getTextInputValue('payment_method');
    const notes = interaction.fields.getTextInputValue('account_notes') || '';

    // Check if account already exists
    const TikTokAccount = require('../models/TikTokAccount');
    const existingAccount = await TikTokAccount.getAccountByUsername(username);
    if (existingAccount) {
      return interaction.reply({
        content: '❌ This TikTok account is already being tracked by another user.',
        ephemeral: true
      });
    }

    // Create verification channel
    const verificationCategory = interaction.guild.channels.cache.get(client.config.categories.verification);
    if (!verificationCategory) {
      return interaction.reply({
        content: '❌ Verification category not found. Please contact an administrator.',
        ephemeral: true
      });
    }

    const channelName = `tiktok-verify-${username}-${interaction.user.username}`;
    console.log(`🔧 Creating verification channel: ${channelName}`);
    
    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: verificationCategory,
      topic: `TikTok Account Verification for ${interaction.user.tag} - @${username}`,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        },
        {
          id: client.config.roles.admin,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
        },
        {
          id: client.config.roles.moderator || client.config.roles.admin,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        }
      ]
    });

    console.log(`✅ Verification channel created successfully: ${channel.id}`);

    // Create verification embed with account details
    const verificationEmbed = new EmbedBuilder()
      .setTitle('📱 TikTok Account Verification Request')
      .setDescription(`**User:** ${interaction.user.tag} (<@${interaction.user.id}>)\n**Account:** @${username}`)
      .setColor(0xffa500)
      .addFields(
        { name: '👤 TikTok Username', value: `@${username}`, inline: true },
        { name: '📝 Display Name', value: displayName, inline: true },
        { name: '🌍 Country', value: country, inline: true },
        { name: '💳 Payment Method', value: paymentMethod, inline: true },
        { name: '🔗 TikTok Account URL', value: `https://www.tiktok.com/@${username}`, inline: false },
        { name: '📋 Additional Notes', value: notes || 'None provided', inline: false }
      )
      .setFooter({ text: 'Review all details and click Verify Account or Reject Account' })
      .setTimestamp();

    // Create action row with verification buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`verify_account_${interaction.user.id}_${username}`)
          .setLabel('✅ Verify Account')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject_account_${interaction.user.id}_${username}`)
          .setLabel('❌ Reject Account')
          .setStyle(ButtonStyle.Danger)
      );

    // Send the verification message to the channel
    console.log(`📱 Sending verification message to channel ${channel.id}`);
    try {
      const verificationMessage = await channel.send({ embeds: [verificationEmbed], components: [row] });
      console.log(`✅ Verification message sent successfully: ${verificationMessage.id}`);
    } catch (sendError) {
      console.error('Error sending verification message:', sendError);
      // If we can't send to the channel, delete it and inform the user
      try {
        await channel.delete('Failed to send verification message');
      } catch (deleteError) {
        console.error('Error deleting verification channel:', deleteError);
      }
      
      return interaction.reply({
        content: '❌ Failed to create verification channel. Please ensure the bot has proper permissions in the verification category.',
        ephemeral: true
      });
    }

    // Send confirmation to user
    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ Account Verification Submitted')
      .setDescription(`Your TikTok account **@${username}** has been submitted for verification.`)
      .setColor(0x00ff00)
      .addFields(
        { name: '📱 Account', value: `@${username}`, inline: true },
        { name: '📋 Channel', value: `<#${channel.id}>`, inline: true },
        { name: '⏰ Status', value: 'Pending Review', inline: true }
      )
      .setFooter({ text: 'A moderator will review your account shortly' })
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

    // Log the action
    await client.logAction(
      'TikTok Account Verification Requested',
      `<@${interaction.user.id}> requested verification for TikTok account @${username}`
    );

  } catch (error) {
    console.error('Error in handleAddTikTokAccountModal:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your account verification request.',
      ephemeral: true
    });
  }
}

async function handleTestModal(interaction, client) {
  try {
    const testUsername = interaction.fields.getTextInputValue('test_username');
    console.log(`🧪 Test modal submitted with username: ${testUsername}`);
    
    await interaction.reply({
      content: `✅ Test modal worked! Username: ${testUsername}`,
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in handleTestModal:', error);
    await interaction.reply({
      content: '❌ Test modal failed.',
      ephemeral: true
    });
  }
}

async function handleAccountCreationVerification(interaction, client, action, userId) {
  const { EmbedBuilder } = require('discord.js');
  const User = require('../models/User');
  console.log(`🚀 ENTERING handleAccountCreationVerification function`);
  try {
    console.log(`🔍 Processing account creation verification: action=${action}, userId=${userId}`);
    console.log(`🔍 User roles:`, interaction.member.roles.cache.map(r => `${r.name} (${r.id})`));
    console.log(`🔍 Admin role ID: ${client.config.roles.admin}`);
    console.log(`🔍 Moderator role ID: ${client.config.roles.moderator}`);
    console.log(`🔍 Environment variables:`, {
      ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID,
      MODERATOR_ROLE_ID: process.env.MODERATOR_ROLE_ID
    });
    
    // Check if user has admin or moderator permissions
    const hasAdminRole = interaction.member.roles.cache.has(client.config.roles.admin);
    const hasModeratorRole = interaction.member.roles.cache.has(client.config.roles.moderator);
    
    console.log(`🔍 Has admin role: ${hasAdminRole}`);
    console.log(`🔍 Has moderator role: ${hasModeratorRole}`);
    
    if (!hasAdminRole && !hasModeratorRole) {
      return interaction.reply({
        content: '❌ You need admin or moderator permissions to approve/reject verifications.',
        ephemeral: true
      });
    }

    console.log(`🔍 Looking up user in database: ${userId}`);
    const user = await User.findOne({ discord_id: userId });
    console.log(`🔍 User found: ${!!user}`);
    if (user) {
      console.log(`🔍 User role: ${user.role}`);
    }
    
    if (!user) {
      return interaction.reply({
        content: '❌ User not found in database.',
        ephemeral: true
      });
    }

    if (action === 'verify_account') {
      console.log(`🔍 Verifying account for user: ${userId}`);
      
      // Update user role to warming up
      user.role = 'Warming Up';
      user.verified = true;
      user.verification_approved_at = new Date();
      await user.save();
      console.log(`✅ User role updated to: ${user.role}`);

      // Update Discord roles
      console.log(`🔍 Fetching Discord member: ${userId}`);
      const member = await interaction.guild.members.fetch(userId);
      const warmingUpRole = interaction.guild.roles.cache.get(client.config.roles.warmingUp);
      const accountCreatedRole = interaction.guild.roles.cache.get(client.config.roles.accountCreated);
      
      console.log(`🔍 Warming up role ID: ${client.config.roles.warmingUp}, Found: ${!!warmingUpRole}`);
      console.log(`🔍 Account created role ID: ${client.config.roles.accountCreated}, Found: ${!!accountCreatedRole}`);
      
      if (accountCreatedRole && member.roles.cache.has(accountCreatedRole.id)) {
        console.log(`🔍 Removing account created role from user`);
        await member.roles.remove(accountCreatedRole);
      }
      
      if (warmingUpRole) {
        console.log(`🔍 Adding warming up role to user`);
        await member.roles.add(warmingUpRole);
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Account Creation Verified')
        .setDescription(`User <@${userId}> has been verified and promoted to **Warming Up** role.`)
        .setColor(0x00ff00)
        .addFields(
          { name: 'New Role', value: 'Warming Up', inline: true },
          { name: 'Verified By', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Log the action
      await client.logAction(
        'Account Creation Verified',
        `<@${interaction.user.id}> verified account creation for <@${userId}>`
      );

    } else if (action === 'reject_account') {
      const embed = new EmbedBuilder()
        .setTitle('❌ Account Creation Rejected')
        .setDescription(`Account creation verification for user <@${userId}> has been rejected.`)
        .setColor(0xff0000)
        .addFields(
          { name: 'Rejected By', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Log the action
      await client.logAction(
        'Account Creation Rejected',
        `<@${interaction.user.id}> rejected account creation for <@${userId}>`
      );
    }

  } catch (error) {
    console.error('❌ Error in handleAccountCreationVerification:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      method: error.method,
      url: error.url
    });
    
    try {
      await interaction.reply({
        content: `❌ An error occurred while processing the verification: ${error.message}`,
        ephemeral: true
      });
    } catch (replyError) {
      console.error('❌ Error replying to interaction:', replyError);
    }
  }
}

async function handleWarmupVerification(interaction, client, action, userId) {
  console.log(`🚀 ENTERING handleWarmupVerification function`);
  const { EmbedBuilder } = require('discord.js');
  const User = require('../models/User');
  console.log(`🔍 Imports loaded successfully`);
  try {
    console.log(`🔍 Starting permission check`);
    // Check if user has admin or moderator permissions
    console.log(`🔍 Client config:`, !!client.config);
    console.log(`🔍 Client config roles:`, !!client.config.roles);
    console.log(`🔍 Admin role ID: ${client.config.roles.admin}`);
    console.log(`🔍 Moderator role ID: ${client.config.roles.moderator}`);
    const hasAdminRole = interaction.member.roles.cache.has(client.config.roles.admin);
    console.log(`🔍 Has admin role: ${hasAdminRole}`);
    const hasModeratorRole = interaction.member.roles.cache.has(client.config.roles.moderator);
    console.log(`🔍 Has moderator role: ${hasModeratorRole}`);
    
    if (!hasAdminRole && !hasModeratorRole) {
      return interaction.reply({
        content: '❌ You need admin or moderator permissions to approve/reject verifications.',
        ephemeral: true
      });
    }

    console.log(`🔍 Looking up user in database: ${userId}`);
    const user = await User.findOne({ discord_id: userId });
    console.log(`🔍 User found: ${!!user}`);
    if (!user) {
      return interaction.reply({
        content: '❌ User not found in database.',
        ephemeral: true
      });
    }

    console.log(`🔍 Processing action: ${action}`);
    if (action === 'verify') {
      console.log(`🔍 Starting verify action processing`);
      // Update user role to clipper
      user.role = 'Clipper';
      user.warmup_done = true;
      user.warmup_approved_at = new Date();
      console.log(`🔍 Saving user to database`);
      await user.save();
      console.log(`🔍 User saved successfully`);

      // Update Discord roles
      const member = await interaction.guild.members.fetch(userId);
      const clipperRole = interaction.guild.roles.cache.get(client.config.roles.clipper);
      const warmingUpRole = interaction.guild.roles.cache.get(client.config.roles.warmingUp);
      
      if (warmingUpRole && member.roles.cache.has(warmingUpRole.id)) {
        await member.roles.remove(warmingUpRole);
      }
      
      if (clipperRole) {
        await member.roles.add(clipperRole);
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Warm-up Verified')
        .setDescription(`User <@${userId}> has completed warm-up and been promoted to **Clipper** role.`)
        .setColor(0x00ff00)
        .addFields(
          { name: 'New Role', value: 'Clipper', inline: true },
          { name: 'Verified By', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Log the action
      await client.logAction(
        'Warm-up Verified',
        `<@${interaction.user.id}> verified warm-up completion for <@${userId}>`
      );

    } else if (action === 'reject') {
      const embed = new EmbedBuilder()
        .setTitle('❌ Warm-up Rejected')
        .setDescription(`Warm-up verification for user <@${userId}> has been rejected.`)
        .setColor(0xff0000)
        .addFields(
          { name: 'Rejected By', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Log the action
      await client.logAction(
        'Warm-up Rejected',
        `<@${interaction.user.id}> rejected warm-up verification for <@${userId}>`
      );
    }

  } catch (error) {
    console.error('Error in handleWarmupVerification:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing the verification.',
      ephemeral: true
    });
  }
}

async function handleAccountVerification(interaction, client, action, userId, username) {
  const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
  
  try {
    // Check if user has admin or moderator permissions
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    const isModerator = client.config.roles.moderator && interaction.member.roles.cache.has(client.config.roles.moderator);
    
    if (!isAdmin && !isModerator) {
      return interaction.reply({
        content: '❌ You need administrator or moderator permissions to verify accounts.',
        ephemeral: true
      });
    }

    const TikTokAccount = require('../models/TikTokAccount');
    const User = require('../models/User');

    if (action === 'verify') {
      // Check if account already exists
      const existingAccount = await TikTokAccount.getAccountByUsername(username);
      if (existingAccount) {
        return interaction.reply({
          content: '❌ This TikTok account is already being tracked.',
          ephemeral: true
        });
      }

      // Create new TikTok account
      const newAccount = new TikTokAccount({
        user_id: userId,
        username: username,
        account_url: `https://www.tiktok.com/@${username}`,
        scraping_enabled: true,
        status: 'active'
      });

      await newAccount.save();

      // Update user's account count
      const user = await User.findOne({ discord_id: userId });
      if (user) {
        user.tiktok_posts_count = (user.tiktok_posts_count || 0) + 1;
        await user.save();
      }

      // Create success embed
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Account Verified Successfully')
        .setDescription(`TikTok account **@${username}** has been verified and added to the database.`)
        .setColor(0x00ff00)
        .addFields(
          { name: '👤 User', value: `<@${userId}>`, inline: true },
          { name: '📱 Account', value: `@${username}`, inline: true },
          { name: '🔄 Scraping', value: 'Enabled', inline: true }
        )
        .setFooter({ text: 'Account will be scraped every 6 hours' })
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed] });

      // Send notification to user
      try {
        const user = await client.users.fetch(userId);
        const userEmbed = new EmbedBuilder()
          .setTitle('🎉 TikTok Account Verified!')
          .setDescription(`Your TikTok account **@${username}** has been verified and is now being tracked!`)
          .setColor(0x00ff00)
          .addFields(
            { name: '📱 Account', value: `@${username}`, inline: true },
            { name: '🔄 Status', value: 'Active Tracking', inline: true }
          )
          .setFooter({ text: 'Your account will be scraped every 6 hours for new videos!' })
          .setTimestamp();

        await user.send({ embeds: [userEmbed] });
      } catch (dmError) {
        console.log(`Could not send DM to user ${userId}:`, dmError.message);
      }

      // Log the action
      await client.logAction(
        'TikTok Account Verified',
        `<@${interaction.user.id}> verified TikTok account @${username} for <@${userId}>`
      );

    } else if (action === 'reject') {
      // Create rejection embed
      const rejectEmbed = new EmbedBuilder()
        .setTitle('❌ Account Rejected')
        .setDescription(`TikTok account **@${username}** has been rejected.`)
        .setColor(0xff0000)
        .addFields(
          { name: '👤 User', value: `<@${userId}>`, inline: true },
          { name: '📱 Account', value: `@${username}`, inline: true },
          { name: '❌ Status', value: 'Rejected', inline: true }
        )
        .setFooter({ text: 'Account was not added to the database' })
        .setTimestamp();

      await interaction.reply({ embeds: [rejectEmbed] });

      // Send notification to user
      try {
        const user = await client.users.fetch(userId);
        const userEmbed = new EmbedBuilder()
          .setTitle('❌ TikTok Account Rejected')
          .setDescription(`Your TikTok account **@${username}** has been rejected.`)
          .setColor(0xff0000)
          .addFields(
            { name: '📱 Account', value: `@${username}`, inline: true },
            { name: '❌ Status', value: 'Rejected', inline: true }
          )
          .setFooter({ text: 'Please contact support if you believe this was an error' })
          .setTimestamp();

        await user.send({ embeds: [userEmbed] });
      } catch (dmError) {
        console.log(`Could not send DM to user ${userId}:`, dmError.message);
      }

      // Log the action
      await client.logAction(
        'TikTok Account Rejected',
        `<@${interaction.user.id}> rejected TikTok account @${username} for <@${userId}>`
      );
    }

  } catch (error) {
    console.error('Error in handleAccountVerification:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing the account verification.',
      ephemeral: true
    });
  }
}