const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'test-roles',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('test-roles')
    .setDescription('Test role management functionality (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      const member = interaction.member;
      
      // Test 1: Check if roles exist
      const newMemberRole = interaction.guild.roles.cache.get(client.config.roles.newMember);
      const onboardingRole = interaction.guild.roles.cache.get(client.config.roles.onboardingStarted);
      
      let response = '**Role Management Test Results:**\n\n';
      
      // Test 2: Check role existence
      response += `**New Member Role:** ${newMemberRole ? '✅ Exists' : '❌ Not Found'} (ID: ${client.config.roles.newMember})\n`;
      response += `**Onboarding Role:** ${onboardingRole ? '✅ Exists' : '❌ Not Found'} (ID: ${client.config.roles.onboardingStarted})\n\n`;
      
      // Test 3: Check bot permissions
      const botMember = interaction.guild.members.cache.get(client.user.id);
      const canManageRoles = botMember.permissions.has('ManageRoles');
      const canManageChannels = botMember.permissions.has('ManageChannels');
      
      response += `**Bot Permissions:**\n`;
      response += `• Manage Roles: ${canManageRoles ? '✅' : '❌'}\n`;
      response += `**Bot Role Position:** ${botMember.roles.highest.position}\n\n`;
      
      // Test 4: Check role hierarchy
      if (newMemberRole && onboardingRole) {
        response += `**Role Hierarchy:**\n`;
        response += `• New Member Role Position: ${newMemberRole.position}\n`;
        response += `• Onboarding Role Position: ${onboardingRole.position}\n`;
        response += `• Bot Role Position: ${botMember.roles.highest.position}\n\n`;
        
        const canManageNewMember = botMember.roles.highest.position > newMemberRole.position;
        const canManageOnboarding = botMember.roles.highest.position > onboardingRole.position;
        
        response += `**Can Manage Roles:**\n`;
        response += `• New Member: ${canManageNewMember ? '✅' : '❌'}\n`;
        response += `• Onboarding: ${canManageOnboarding ? '✅' : '❌'}\n`;
      }
      
      // Test 5: Try to add onboarding role
      if (onboardingRole && canManageOnboarding) {
        try {
          await member.roles.add(onboardingRole);
          response += `\n✅ **Successfully added onboarding role!**`;
        } catch (roleError) {
          response += `\n❌ **Failed to add role:** ${roleError.message}`;
        }
      }
      
      await interaction.reply({
        content: response,
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Error in test-roles command:', error);
      await interaction.reply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
