const { SlashCommandBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
  name: 'check-roles',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('check-roles')
    .setDescription('Check your Discord roles vs bot database role'),

  async execute(interaction, client) {
    try {
      const member = interaction.member;
      const user = await User.findOne({ discord_id: interaction.user.id });
      
      let response = '**Role Check Results:**\n\n';
      
      // Check Discord roles
      response += `**Discord Roles:**\n`;
      const discordRoles = member.roles.cache.map(role => role.name).join(', ');
      response += `${discordRoles}\n\n`;
      
      // Check bot database role
      if (user) {
        response += `**Bot Database Role:** ${user.role}\n\n`;
      } else {
        response += `**Bot Database Role:** Not found in database\n\n`;
      }
      
      // Check specific role IDs
      response += `**Role ID Check:**\n`;
      const clipperRoleId = client.config.roles.clipper;
      const clipperRole = member.guild.roles.cache.get(clipperRoleId);
      
      response += `• Clipper Role ID: ${clipperRoleId}\n`;
      response += `• Clipper Role Found: ${clipperRole ? '✅' : '❌'}\n`;
      response += `• You have Clipper Role: ${member.roles.cache.has(clipperRoleId) ? '✅' : '❌'}\n\n`;
      
      // Check if user should be updated
      if (user && user.role !== 'Clipper' && member.roles.cache.has(clipperRoleId)) {
        response += `**⚠️ Mismatch Detected!**\n`;
        response += `Your Discord role is Clipper, but bot database shows: ${user.role}\n`;
        response += `This needs to be fixed.\n`;
      }
      
      await interaction.reply({
        content: response,
        ephemeral: true
      });
      
    } catch (error) {
      console.error('Error in check-roles command:', error);
      await interaction.reply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
