const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const OnboardingProgress = require('../models/OnboardingProgress');
const { getTasksForDay } = require('../utils/onboardingTasks');

module.exports = {
  name: 'onboarding-progress',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('onboarding-progress')
    .setDescription('Check your onboarding progress or manage onboarding (admin)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your current onboarding progress')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('advance-day')
        .setDescription('Advance a user to the next day (Admin only)')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to advance')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('complete-task')
        .setDescription('Mark a task as complete (Admin only)')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('day')
            .setDescription('The day (1-5)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5)
        )
        .addStringOption(option =>
          option
            .setName('task-id')
            .setDescription('The task ID to mark as complete')
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'view') {
        await handleViewProgress(interaction, client);
      } else if (subcommand === 'advance-day') {
        await handleAdvanceDay(interaction, client);
      } else if (subcommand === 'complete-task') {
        await handleCompleteTask(interaction, client);
      }
    } catch (error) {
      console.error('Error in onboarding-progress command:', error);
      await interaction.reply({
        content: '❌ An error occurred while processing your request.',
        ephemeral: true
      });
    }
  }
};

async function handleViewProgress(interaction, client) {
  const onboardingProgress = await OnboardingProgress.findOne({ 
    user_id: interaction.user.id 
  });

  if (!onboardingProgress) {
    return await interaction.reply({
      content: '❌ You don\'t have an active onboarding session. Use `/onboarding` to get started!',
      ephemeral: true
    });
  }

  const currentDay = onboardingProgress.current_day;
  const dayData = getTasksForDay(currentDay);
  const dayTasks = onboardingProgress.getCurrentDayTasks();

  // Calculate overall progress
  let totalTasks = 0;
  let completedTasks = 0;
  
  for (let day = 1; day <= 5; day++) {
    const tasks = onboardingProgress.tasks[`day${day}`];
    totalTasks += tasks.tasks.length;
    completedTasks += tasks.tasks.filter(t => t.completed).length;
  }

  const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

  // Build task status
  let taskStatus = '';
  dayTasks.tasks.forEach((task, index) => {
    const status = task.completed ? '✅' : '⏳';
    taskStatus += `${status} **Task ${index + 1}**: ${task.title}\n`;
    if (task.completed && task.completed_at) {
      taskStatus += `   ✓ Completed <t:${Math.floor(new Date(task.completed_at).getTime() / 1000)}:R>\n\n`;
    } else {
      taskStatus += `   ${task.description}\n\n`;
    }
  });

  const progressEmbed = new EmbedBuilder()
    .setTitle('📊 Your Onboarding Progress')
    .setDescription(`You're currently on **Day ${currentDay} of 5**: ${dayData.day_title}`)
    .addFields(
      { name: '📈 Overall Progress', value: `${progressPercentage}% (${completedTasks}/${totalTasks} tasks completed)`, inline: true },
      { name: '📅 Current Day', value: `Day ${currentDay}`, inline: true },
      { name: '🗓️ Started', value: `<t:${Math.floor(new Date(onboardingProgress.started_at).getTime() / 1000)}:R>`, inline: true },
      { name: `📋 Day ${currentDay} Tasks`, value: taskStatus || 'No tasks available', inline: false }
    )
    .setColor(0x5865F2)
    .setFooter({ text: 'Keep going! You\'re doing great!' })
    .setTimestamp();

  // Add completed days info
  let completedDaysInfo = '';
  for (let day = 1; day <= 5; day++) {
    const dayTasksData = onboardingProgress.tasks[`day${day}`];
    const dayEmoji = dayTasksData.completed ? '✅' : day < currentDay ? '⏸️' : day === currentDay ? '▶️' : '⏳';
    completedDaysInfo += `${dayEmoji} Day ${day}: ${dayTasksData.completed ? 'Complete' : day < currentDay ? 'In Progress' : day === currentDay ? 'Current' : 'Upcoming'}\n`;
  }

  progressEmbed.addFields({ name: '🗓️ All Days', value: completedDaysInfo, inline: false });

  await interaction.reply({
    embeds: [progressEmbed],
    ephemeral: true
  });
}

async function handleAdvanceDay(interaction, client) {
  // Check admin permissions
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
      content: '❌ You need administrator permissions to use this command.',
      ephemeral: true
    });
  }

  const targetUser = interaction.options.getUser('user');
  const onboardingProgress = await OnboardingProgress.findOne({ 
    user_id: targetUser.id 
  });

  if (!onboardingProgress) {
    return await interaction.reply({
      content: `❌ ${targetUser.tag} doesn't have an active onboarding session.`,
      ephemeral: true
    });
  }

  if (onboardingProgress.current_day >= 5) {
    return await interaction.reply({
      content: `❌ ${targetUser.tag} has already completed all 5 days of onboarding.`,
      ephemeral: true
    });
  }

  // Advance to next day
  await onboardingProgress.advanceToNextDay();
  
  // Send welcome message to their channel
  const onboardingHandlers = require('../utils/onboardingHandlers');
  await onboardingHandlers.advanceToNextDay(onboardingProgress.channel_id, client);

  const successEmbed = new EmbedBuilder()
    .setTitle('✅ Day Advanced')
    .setDescription(`Successfully advanced ${targetUser.tag} to Day ${onboardingProgress.current_day}.`)
    .setColor(0x00ff00)
    .setTimestamp();

  await interaction.reply({
    embeds: [successEmbed],
    ephemeral: true
  });
}

async function handleCompleteTask(interaction, client) {
  // Check admin permissions
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
      content: '❌ You need administrator permissions to use this command.',
      ephemeral: true
    });
  }

  const targetUser = interaction.options.getUser('user');
  const day = interaction.options.getInteger('day');
  const taskId = interaction.options.getString('task-id');

  const onboardingProgress = await OnboardingProgress.findOne({ 
    user_id: targetUser.id 
  });

  if (!onboardingProgress) {
    return await interaction.reply({
      content: `❌ ${targetUser.tag} doesn't have an active onboarding session.`,
      ephemeral: true
    });
  }

  const success = await onboardingProgress.completeTask(day, taskId);
  
  if (!success) {
    return await interaction.reply({
      content: `❌ Task not found or already completed.`,
      ephemeral: true
    });
  }

  // Check if day is now complete
  await onboardingProgress.checkDayCompletion(day);

  const successEmbed = new EmbedBuilder()
    .setTitle('✅ Task Completed')
    .setDescription(`Successfully marked task "${taskId}" as complete for ${targetUser.tag} on Day ${day}.`)
    .setColor(0x00ff00)
    .setTimestamp();

  await interaction.reply({
    embeds: [successEmbed],
    ephemeral: true
  });
}

