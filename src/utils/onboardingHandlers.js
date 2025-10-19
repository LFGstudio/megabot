const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
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