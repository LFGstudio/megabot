const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const User = require('../models/User');

class OnboardingHandlers {
  constructor() {}

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
          // Continue without failing the entire process
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

      // Assign "Account Created" role
      const accountCreatedRole = interaction.guild.roles.cache.get(client.config.roles.accountCreated);
      if (accountCreatedRole) {
        try {
          await member.roles.add(accountCreatedRole);
        } catch (roleError) {
          console.log(`Could not add account created role: ${roleError.message}`);
        }
      }

      // Send confirmation message
      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Account Verification Started!')
        .setDescription('Perfect! You\'re ready to submit your TikTok account for verification.')
        .addFields(
          { name: '📋 Next Step', value: 'Head to #create-your-account for detailed setup instructions', inline: false },
          { name: '🎯 What You\'ll Need', value: 'A new TikTok account with the recommended username format', inline: false }
        )
        .setColor(0x0099ff)
        .setFooter({ text: 'Follow the guide carefully for best results!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true
      });

      // Log the action
      await client.logAction(
        'Account Verification Started',
        `<@${interaction.user.id}> started account verification process`
      );

    } catch (error) {
      console.error('Error in handleSubmitAccountVerification:', error);
      await interaction.reply({
        content: '❌ An error occurred while starting account verification.',
        ephemeral: true
      });
    }
  }

  async handleSubmitTikTokVerification(interaction, client) {
    try {
      // Check if user has account created role
      const member = interaction.member;
      const accountCreatedRole = interaction.guild.roles.cache.get(client.config.roles.accountCreated);
      
      if (!accountCreatedRole || !member.roles.cache.has(accountCreatedRole.id)) {
        return interaction.reply({
          content: '❌ Please complete the previous steps first. Start with the about message.',
          ephemeral: true
        });
      }

      // Create modal for TikTok verification
      const modal = new ModalBuilder()
        .setCustomId('tiktok_verification_modal')
        .setTitle('TikTok Account Verification');

      const tiktokUsernameInput = new TextInputBuilder()
        .setCustomId('tiktok_username')
        .setLabel('TikTok Username (without @)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('amanda.goviral')
        .setRequired(true)
        .setMaxLength(24);

      const profileLinkInput = new TextInputBuilder()
        .setCustomId('profile_link')
        .setLabel('TikTok Profile Link')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://www.tiktok.com/@amanda.goviral')
        .setRequired(true)
        .setMaxLength(100);

      const countryInput = new TextInputBuilder()
        .setCustomId('country')
        .setLabel('Country You\'ll Be Posting From')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('United States')
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
      console.error('Error in handleSubmitTikTokVerification:', error);
      await interaction.reply({
        content: '❌ An error occurred while opening the verification form.',
        ephemeral: true
      });
    }
  }

  async handleSubmitWarmupVerification(interaction, client) {
    try {
      // Check if user has warming up role
      const member = interaction.member;
      const warmingUpRole = interaction.guild.roles.cache.get(client.config.roles.warmingUp);
      
      if (!warmingUpRole || !member.roles.cache.has(warmingUpRole.id)) {
        return interaction.reply({
          content: '❌ You must complete the account verification first.',
          ephemeral: true
        });
      }

      // Create modal for warm-up verification
      const modal = new ModalBuilder()
        .setCustomId('warmup_verification_modal')
        .setTitle('Warm-Up Verification');

      const completedWarmupInput = new TextInputBuilder()
        .setCustomId('completed_warmup')
        .setLabel('Confirm 3-Day Warm-Up Completion')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('I have completed the 3-day warm-up process as instructed...')
        .setRequired(true)
        .setMaxLength(500);

      const profileLinkInput = new TextInputBuilder()
        .setCustomId('profile_link')
        .setLabel('TikTok Profile Link')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://www.tiktok.com/@username')
        .setRequired(true)
        .setMaxLength(100);

      const fypScreenshotInput = new TextInputBuilder()
        .setCustomId('fyp_screenshot')
        .setLabel('FYP Screenshot Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe your FYP content - should show Go Viral niche content')
        .setRequired(true)
        .setMaxLength(300);

      const firstActionRow = new ActionRowBuilder().addComponents(completedWarmupInput);
      const secondActionRow = new ActionRowBuilder().addComponents(profileLinkInput);
      const thirdActionRow = new ActionRowBuilder().addComponents(fypScreenshotInput);

      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error in handleSubmitWarmupVerification:', error);
      await interaction.reply({
        content: '❌ An error occurred while opening the warm-up verification form.',
        ephemeral: true
      });
    }
  }
}

module.exports = new OnboardingHandlers();
