const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const OnboardingProgress = require('../../models/OnboardingProgress');
const { getTasksForDay } = require('../../utils/onboardingTasks');

module.exports = {
  name: 'onboarding-queue',
  data: new SlashCommandBuilder()
    .setName('onboarding-queue')
    .setDescription('View all active onboarding users with their current status')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('Show all active onboarding users')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      // Get all active onboarding progress
      const allProgress = await OnboardingProgress.find({ 
        status: { $ne: 'completed' } 
      }).sort({ current_day: 1, started_at: -1 });

      // Organize by status
      const needsAttention = [];
      const byDay = { 1: [], 2: [], 3: [], 4: [], 5: [] };
      
      for (const progress of allProgress) {
        // Check if needs attention
        const dayTasks = progress.getCurrentDayTasks();
        const nextTask = dayTasks.tasks.find(t => !t.completed);
        const needsHelp = progress.bot_muted || (nextTask && nextTask.type === 'human_ping');
        
        if (needsHelp) {
          needsAttention.push(progress);
        }
        
        // Also organize by day
        if (progress.current_day >= 1 && progress.current_day <= 5) {
          byDay[progress.current_day].push(progress);
        }
      }

      // Build embed
      const embed = new EmbedBuilder()
        .setTitle('Onboarding Queue')
        .setColor(0x5865F2)
        .setTimestamp();

      // Add urgent section
      if (needsAttention.length > 0) {
        let urgentList = '';
        for (const progress of needsAttention.slice(0, 10)) {
          const status = progress.bot_muted ? '⚠️ Muted' : '🔴 Needs Post Help';
          urgentList += `${status} - <#${progress.channel_id}>\n`;
        }
        if (needsAttention.length > 10) {
          urgentList += `\n...and ${needsAttention.length - 10} more`;
        }
        embed.addFields({ name: `🔴 Needs Your Attention (${needsAttention.length})`, value: urgentList || 'None', inline: false });
      } else {
        embed.addFields({ name: '🔴 Needs Your Attention', value: 'None - all good!', inline: false });
      }

      // Add day sections
      for (let day = 1; day <= 5; day++) {
        if (byDay[day].length > 0) {
          let dayList = '';
          for (const progress of byDay[day].slice(0, 10)) {
            const taskCount = progress.getCurrentDayTasks().tasks.length;
            const completed = progress.getCurrentDayTasks().tasks.filter(t => t.completed).length;
            dayList += `<#${progress.channel_id}> (${completed}/${taskCount} tasks)\n`;
          }
          if (byDay[day].length > 10) {
            dayList += `\n...and ${byDay[day].length - 10} more`;
          }
          embed.addFields({ name: `Day ${day} (${byDay[day].length})`, value: dayList, inline: true });
        } else {
          embed.addFields({ name: `Day ${day}`, value: 'None', inline: true });
        }
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error showing onboarding queue:', error);
      await interaction.editReply('An error occurred while fetching the onboarding queue.');
    }
  }
};

