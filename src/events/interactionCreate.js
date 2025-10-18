const { InteractionType } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.type === InteractionType.ApplicationCommand) {
        // Handle slash commands
        await client.commandHandler.handleSlashCommand(interaction);
      } else if (interaction.type === InteractionType.MessageComponent) {
        // Handle button interactions
        await handleButtonInteraction(interaction, client);
      }
    } catch (error) {
      console.error('Error in interactionCreate event:', error);
      
      const errorMessage = {
        content: '❌ There was an error processing your interaction!',
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

async function handleButtonInteraction(interaction, client) {
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const User = require('../models/User');

  try {
    const customId = interaction.customId;
    
    // Handle verification approval/rejection
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

      const member = interaction.guild.members.cache.get(userId);
      if (!member) {
        return interaction.reply({
          content: '❌ User not found in this server.',
          ephemeral: true
        });
      }

      if (action === 'approve') {
        // Approve verification
        user.verified = true;
        user.verification_approved_at = new Date();
        user.role = 'Warming Up';
        await user.save();

        // Assign warming up role
        const warmingUpRole = interaction.guild.roles.cache.get(client.config.roles.warmingUp);
        if (warmingUpRole) {
          await member.roles.add(warmingUpRole);
        }

        // Remove new member role
        const newMemberRole = interaction.guild.roles.cache.get(client.config.roles.newMember);
        if (newMemberRole && member.roles.cache.has(newMemberRole.id)) {
          await member.roles.remove(newMemberRole);
        }

        // Send DM to user
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle('🎉 Verification Approved!')
            .setColor(0x00ff00)
            .setDescription('Congratulations! Your verification has been approved.')
            .addFields(
              { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
              { name: '🌍 Country', value: user.country || 'Not provided', inline: true },
              { name: '🏷️ New Role', value: 'Warming Up', inline: true }
            )
            .setFooter({ text: 'You can now proceed to the warm-up phase!' })
            .setTimestamp();

          await member.user.send({ embeds: [dmEmbed] });
        } catch (dmError) {
          console.log(`Could not send DM to ${member.user.tag}:`, dmError.message);
        }

        // Update the original message
        const approvedEmbed = new EmbedBuilder()
          .setTitle('✅ Verification Approved')
          .setColor(0x00ff00)
          .addFields(
            { name: '👤 User', value: `<@${userId}>`, inline: true },
            { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
            { name: '🌍 Country', value: user.country || 'Not provided', inline: true },
            { name: '✅ Approved by', value: interaction.user.tag, inline: true }
          )
          .setFooter({ text: 'MegaBot Verification System' })
          .setTimestamp();

        await interaction.update({
          embeds: [approvedEmbed],
          components: []
        });

        // Log the action
        await client.logAction(
          'Verification Approved (Button)',
          `<@${interaction.user.id}> approved verification for <@${userId}>`
        );

      } else if (action === 'reject') {
        // Send DM to user with rejection
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle('❌ Verification Rejected')
            .setColor(0xff0000)
            .setDescription('Your verification request has been rejected.')
            .addFields(
              { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
              { name: '🌍 Country', value: user.country || 'Not provided', inline: true },
              { name: '❌ Rejected by', value: interaction.user.tag, inline: true }
            )
            .setFooter({ text: 'Please review your submission and try again.' })
            .setTimestamp();

          await member.user.send({ embeds: [dmEmbed] });
        } catch (dmError) {
          console.log(`Could not send DM to ${member.user.tag}:`, dmError.message);
        }

        // Update the original message
        const rejectedEmbed = new EmbedBuilder()
          .setTitle('❌ Verification Rejected')
          .setColor(0xff0000)
          .addFields(
            { name: '👤 User', value: `<@${userId}>`, inline: true },
            { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
            { name: '🌍 Country', value: user.country || 'Not provided', inline: true },
            { name: '❌ Rejected by', value: interaction.user.tag, inline: true }
          )
          .setFooter({ text: 'MegaBot Verification System' })
          .setTimestamp();

        await interaction.update({
          embeds: [rejectedEmbed],
          components: []
        });

        // Log the action
        await client.logAction(
          'Verification Rejected (Button)',
          `<@${interaction.user.id}> rejected verification for <@${userId}>`
        );
      }
    }
    
    // Handle warm-up approval/rejection
    else if (customId.startsWith('warmup_approve_') || customId.startsWith('warmup_reject_')) {
      const userId = customId.split('_')[2];
      const action = customId.split('_')[1];
      
      // Check if user has admin permissions
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({
          content: '❌ You need administrator permissions to approve/reject warm-up requests.',
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

      const member = interaction.guild.members.cache.get(userId);
      if (!member) {
        return interaction.reply({
          content: '❌ User not found in this server.',
          ephemeral: true
        });
      }

      if (action === 'approve') {
        // Approve warm-up
        user.warmup_done = true;
        user.warmup_approved_at = new Date();
        user.role = 'Clipper';
        await user.save();

        // Assign clipper role
        const clipperRole = interaction.guild.roles.cache.get(client.config.roles.clipper);
        if (clipperRole) {
          await member.roles.add(clipperRole);
        }

        // Remove warming up role
        const warmingUpRole = interaction.guild.roles.cache.get(client.config.roles.warmingUp);
        if (warmingUpRole && member.roles.cache.has(warmingUpRole.id)) {
          await member.roles.remove(warmingUpRole);
        }

        // Send DM to user
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle('🔥 Warm-up Approved!')
            .setColor(0xff8800)
            .setDescription('Congratulations! Your warm-up phase has been completed.')
            .addFields(
              { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
              { name: '🏷️ New Role', value: 'Clipper', inline: true },
              { name: '✅ Approved by', value: interaction.user.tag, inline: true }
            )
            .setFooter({ text: 'You can now connect your TikTok and start tracking stats!' })
            .setTimestamp();

          await member.user.send({ embeds: [dmEmbed] });
        } catch (dmError) {
          console.log(`Could not send DM to ${member.user.tag}:`, dmError.message);
        }

        // Update the original message
        const approvedEmbed = new EmbedBuilder()
          .setTitle('✅ Warm-up Approved')
          .setColor(0xff8800)
          .addFields(
            { name: '👤 User', value: `<@${userId}>`, inline: true },
            { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
            { name: '✅ Approved by', value: interaction.user.tag, inline: true }
          )
          .setFooter({ text: 'MegaBot Warm-up System' })
          .setTimestamp();

        await interaction.update({
          embeds: [approvedEmbed],
          components: []
        });

        // Log the action
        await client.logAction(
          'Warm-up Approved (Button)',
          `<@${interaction.user.id}> approved warm-up completion for <@${userId}>`
        );

      } else if (action === 'reject') {
        // Send DM to user with rejection
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle('❌ Warm-up Rejected')
            .setColor(0xff0000)
            .setDescription('Your warm-up completion request has been rejected.')
            .addFields(
              { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
              { name: '❌ Rejected by', value: interaction.user.tag, inline: true }
            )
            .setFooter({ text: 'Please review your analytics screenshot and try again.' })
            .setTimestamp();

          await member.user.send({ embeds: [dmEmbed] });
        } catch (dmError) {
          console.log(`Could not send DM to ${member.user.tag}:`, dmError.message);
        }

        // Update the original message
        const rejectedEmbed = new EmbedBuilder()
          .setTitle('❌ Warm-up Rejected')
          .setColor(0xff0000)
          .addFields(
            { name: '👤 User', value: `<@${userId}>`, inline: true },
            { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
            { name: '❌ Rejected by', value: interaction.user.tag, inline: true }
          )
          .setFooter({ text: 'MegaBot Warm-up System' })
          .setTimestamp();

        await interaction.update({
          embeds: [rejectedEmbed],
          components: []
        });

        // Log the action
        await client.logAction(
          'Warm-up Rejected (Button)',
          `<@${interaction.user.id}> rejected warm-up completion for <@${userId}>`
        );
      }
    }

  } catch (error) {
    console.error('Error handling button interaction:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your request.',
      ephemeral: true
    });
  }
}
