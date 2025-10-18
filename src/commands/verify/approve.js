const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'approve',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Approve user verification (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('approve')
        .setDescription('Approve a user\'s verification request')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to approve')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Type of approval')
            .setRequired(true)
            .addChoices(
              { name: 'Verification', value: 'verification' },
              { name: 'Warm-up', value: 'warmup' }
            )
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      const targetUser = interaction.options.getUser('user');
      const approvalType = interaction.options.getString('type');

      // Check if user has admin permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ You need administrator permissions to use this command.',
          ephemeral: true
        });
      }

      const User = require('../../models/User');
      const user = await User.findOne({ discord_id: targetUser.id });

      if (!user) {
        return interaction.reply({
          content: '❌ User not found in database.',
          ephemeral: true
        });
      }

      const member = interaction.guild.members.cache.get(targetUser.id);
      if (!member) {
        return interaction.reply({
          content: '❌ User not found in this server.',
          ephemeral: true
        });
      }

      if (approvalType === 'verification') {
        // Approve verification
        if (user.verified) {
          return interaction.reply({
            content: '❌ User is already verified.',
            ephemeral: true
          });
        }

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

        // Log the action
        await client.logAction(
          'Verification Approved',
          `<@${interaction.user.id}> approved verification for <@${targetUser.id}>`
        );

        // Send DM to user
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle('🎉 Verification Approved!')
            .setColor(0x00ff00)
            .setDescription('Congratulations! Your verification has been approved.')
            .addFields(
              { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
              { name: '🌍 Country', value: user.country || 'Not provided', inline: true },
              { name: '⏰ Approved', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'You can now proceed to the warm-up phase!' })
            .setTimestamp();

          await targetUser.send({ embeds: [dmEmbed] });
        } catch (dmError) {
          console.log(`Could not send DM to ${targetUser.tag}:`, dmError.message);
        }

        const confirmEmbed = new EmbedBuilder()
          .setTitle('✅ Verification Approved')
          .setColor(0x00ff00)
          .setDescription(`Successfully approved verification for ${targetUser.tag}`)
          .addFields(
            { name: '👤 User', value: targetUser.tag, inline: true },
            { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
            { name: '🏷️ New Role', value: 'Warming Up', inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [confirmEmbed] });

      } else if (approvalType === 'warmup') {
        // Approve warm-up
        if (user.warmup_done) {
          return interaction.reply({
            content: '❌ User has already completed warm-up.',
            ephemeral: true
          });
        }

        if (!user.verified) {
          return interaction.reply({
            content: '❌ User must be verified first.',
            ephemeral: true
          });
        }

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

        // Log the action
        await client.logAction(
          'Warm-up Approved',
          `<@${interaction.user.id}> approved warm-up completion for <@${targetUser.id}>`
        );

        // Send DM to user
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle('🔥 Warm-up Approved!')
            .setColor(0xff8800)
            .setDescription('Congratulations! Your warm-up phase has been completed.')
            .addFields(
              { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
              { name: '🏷️ New Role', value: 'Clipper', inline: true },
              { name: '⏰ Approved', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'You can now connect your TikTok and start tracking stats!' })
            .setTimestamp();

          await targetUser.send({ embeds: [dmEmbed] });
        } catch (dmError) {
          console.log(`Could not send DM to ${targetUser.tag}:`, dmError.message);
        }

        const confirmEmbed = new EmbedBuilder()
          .setTitle('✅ Warm-up Approved')
          .setColor(0xff8800)
          .setDescription(`Successfully approved warm-up completion for ${targetUser.tag}`)
          .addFields(
            { name: '👤 User', value: targetUser.tag, inline: true },
            { name: '📱 TikTok Username', value: user.tiktok_username || 'Not provided', inline: true },
            { name: '🏷️ New Role', value: 'Clipper', inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [confirmEmbed] });
      }

    } catch (error) {
      console.error('Error in approve command:', error);
      await interaction.reply({
        content: '❌ An error occurred while processing the approval.',
        ephemeral: true
      });
    }
  }
};
