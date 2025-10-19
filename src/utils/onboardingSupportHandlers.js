const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  name: 'onboarding-support-handler',
  
  async handleCreateTicket(interaction, client) {
    try {
      // Create the modal
      const modal = new ModalBuilder()
        .setCustomId('onboarding_ticket_modal')
        .setTitle('Create Onboarding Support Ticket');

      // Add input fields
      const issueType = new TextInputBuilder()
        .setCustomId('issue_type')
        .setLabel('What type of issue are you experiencing?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., Account verification, TikTok setup, Warm-up process')
        .setRequired(true);

      const description = new TextInputBuilder()
        .setCustomId('issue_description')
        .setLabel('Describe your issue in detail')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Please provide as much detail as possible...')
        .setRequired(true);

      const tiktokUsername = new TextInputBuilder()
        .setCustomId('tiktok_username')
        .setLabel('Your TikTok username (if applicable)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('@yourusername or leave blank if not applicable')
        .setRequired(false);

      // Add inputs to modal
      modal.addComponents(
        new ActionRowBuilder().addComponents(issueType),
        new ActionRowBuilder().addComponents(description),
        new ActionRowBuilder().addComponents(tiktokUsername)
      );

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Error creating onboarding ticket modal:', error);
      await interaction.reply({
        content: '❌ An error occurred while creating the support ticket.',
        ephemeral: true
      });
    }
  },

  async handleTicketSubmit(interaction, client) {
    try {
      const issueType = interaction.fields.getTextInputValue('issue_type');
      const description = interaction.fields.getTextInputValue('issue_description');
      const tiktokUsername = interaction.fields.getTextInputValue('tiktok_username') || 'Not provided';

      // Find onboarding support channel
      const supportChannel = interaction.guild.channels.cache.find(
        channel => channel.name.toLowerCase().includes('onboarding') && 
                   channel.name.toLowerCase().includes('support') && 
                   channel.isTextBased()
      );

      if (!supportChannel) {
        return await interaction.reply({
          content: '❌ Onboarding support channel not found. Please contact an administrator.',
          ephemeral: true
        });
      }

      // Create ticket embed
      const ticketEmbed = new EmbedBuilder()
        .setTitle('🎫 New Onboarding Support Ticket')
        .setColor(0xff6b6b)
        .setDescription(`**User:** ${interaction.user.tag} (<@${interaction.user.id}>)\n**Issue Type:** ${issueType}`)
        .addFields(
          { name: '📝 Issue Description', value: description, inline: false },
          { name: '📱 TikTok Username', value: tiktokUsername, inline: true },
          { name: '🆔 User ID', value: interaction.user.id, inline: true },
          { name: '📅 Created', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: 'Onboarding Support System' })
        .setTimestamp();

      // Create action row with ticket management buttons
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`close_ticket_${interaction.user.id}`)
            .setLabel('Close Ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`escalate_ticket_${interaction.user.id}`)
            .setLabel('Escalate')
            .setEmoji('⬆️')
            .setStyle(ButtonStyle.Secondary)
        );

      // Send ticket to support channel
      await supportChannel.send({ 
        content: `@here New onboarding support ticket from <@${interaction.user.id}>`,
        embeds: [ticketEmbed], 
        components: [row] 
      });

      // Confirm ticket creation to user
      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Support Ticket Created')
        .setColor(0x00ff00)
        .setDescription('Your support ticket has been created and our team has been notified.')
        .addFields(
          { name: '📋 Issue Type', value: issueType, inline: true },
          { name: '⏰ Expected Response', value: 'Within 24 hours', inline: true },
          { name: '📍 Support Channel', value: supportChannel.toString(), inline: false }
        )
        .setFooter({ text: 'We\'ll get back to you as soon as possible!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true
      });

      console.log(`🎫 Created onboarding support ticket for ${interaction.user.tag}`);

    } catch (error) {
      console.error('Error submitting onboarding ticket:', error);
      await interaction.reply({
        content: '❌ An error occurred while submitting your support ticket.',
        ephemeral: true
      });
    }
  },

  async handleCloseTicket(interaction, client) {
    try {
      const userId = interaction.customId.split('_')[2];
      const user = await client.users.fetch(userId);

      // Update the ticket embed
      const updatedEmbed = interaction.message.embeds[0]
        .setColor(0x808080)
        .setTitle('🔒 Closed Onboarding Support Ticket')
        .setDescription(`**User:** ${user.tag} (<@${user.id}>)\n**Status:** CLOSED by ${interaction.user.tag}`)
        .setFooter({ text: `Closed by ${interaction.user.tag}` });

      // Remove buttons
      await interaction.update({
        embeds: [updatedEmbed],
        components: []
      });

      // Notify user
      try {
        await user.send({
          content: 'Your onboarding support ticket has been closed. If you need further assistance, please create a new ticket.'
        });
      } catch (dmError) {
        console.log(`Could not send DM to ${user.tag}:`, dmError.message);
      }

    } catch (error) {
      console.error('Error closing ticket:', error);
      await interaction.reply({
        content: '❌ An error occurred while closing the ticket.',
        ephemeral: true
      });
    }
  },

  async handleEscalateTicket(interaction, client) {
    try {
      const userId = interaction.customId.split('_')[2];
      const user = await client.users.fetch(userId);

      // Update the ticket embed
      const updatedEmbed = interaction.message.embeds[0]
        .setColor(0xff8800)
        .setTitle('⬆️ Escalated Onboarding Support Ticket')
        .setDescription(`**User:** ${user.tag} (<@${user.id}>)\n**Status:** ESCALATED by ${interaction.user.tag}`)
        .setFooter({ text: `Escalated by ${interaction.user.tag}` });

      await interaction.update({
        embeds: [updatedEmbed],
        components: []
      });

      // Notify admins
      const adminChannel = client.channels.cache.get(client.config.channels.admin);
      if (adminChannel) {
        await adminChannel.send({
          content: `@here **ESCALATED TICKET** from <@${user.id}> in onboarding support`,
          embeds: [updatedEmbed]
        });
      }

    } catch (error) {
      console.error('Error escalating ticket:', error);
      await interaction.reply({
        content: '❌ An error occurred while escalating the ticket.',
        ephemeral: true
      });
    }
  }
};
