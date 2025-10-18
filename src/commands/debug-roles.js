const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'debug-roles',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('debug-roles')
    .setDescription('Debug role IDs and cache status (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      let response = '**Role Debug Results:**\n\n';
      
      // Check all role IDs from config
      const roleIds = {
        'New Member': client.config.roles.newMember,
        'Onboarding Started': client.config.roles.onboardingStarted,
        'Account Created': client.config.roles.accountCreated,
        'Warming Up': client.config.roles.warmingUp,
        'Clipper': client.config.roles.clipper,
        'Moderator': client.config.roles.moderator,
        'Admin': client.config.roles.admin
      };
      
      for (const [roleName, roleId] of Object.entries(roleIds)) {
        if (!roleId) {
          response += `❌ **${roleName}**: Not set in environment variables\n`;
          continue;
        }
        
        const role = interaction.guild.roles.cache.get(roleId);
        if (role) {
          response += `✅ **${roleName}**: Found (${role.name})\n`;
        } else {
          response += `❌ **${roleName}**: ID ${roleId} not found in guild\n`;
        }
      }
      
      response += `\n**Category Debug:**\n`;
      const categoryId = client.config.categories.verification;
      if (!categoryId) {
        response += `❌ **Verification Category**: Not set in environment variables\n`;
      } else {
        const category = interaction.guild.channels.cache.get(categoryId);
        if (category) {
          response += `✅ **Verification Category**: Found (${category.name})\n`;
        } else {
          response += `❌ **Verification Category**: ID ${categoryId} not found in guild\n`;
        }
      }
      
      await interaction.reply({
        content: response,
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Error in debug-roles command:', error);
      await interaction.reply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
