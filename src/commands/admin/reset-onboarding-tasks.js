const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const OnboardingProgress = require('../../models/OnboardingProgress');
const { initializeTasks } = require('../../utils/onboardingTasks');

module.exports = {
  name: 'reset-onboarding-tasks',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('reset-onboarding-tasks')
    .setDescription('Reset onboarding tasks for all users (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('all')
        .setDescription('Reset tasks for ALL users')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('Reset tasks for a specific user')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to reset tasks for')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'all') {
        await this.handleResetAll(interaction, client);
      } else if (subcommand === 'user') {
        await this.handleResetUser(interaction, client);
      }

    } catch (error) {
      console.error('Error in reset-onboarding-tasks command:', error);
      await interaction.reply({
        content: 'An error occurred while resetting onboarding tasks.',
        ephemeral: true
      });
    }
  },

  async handleResetAll(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const allProgress = await OnboardingProgress.find({ status: { $ne: 'completed' } });
      const newTasks = initializeTasks();

      let updatedCount = 0;
      for (const progress of allProgress) {
        progress.tasks = newTasks;
        await progress.save();
        updatedCount++;
      }

      const embed = new EmbedBuilder()
        .setTitle('Onboarding Tasks Reset')
        .setDescription(`Successfully reset tasks for ${updatedCount} users.`)
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error resetting all tasks:', error);
      await interaction.editReply({
        content: 'An error occurred while resetting tasks for all users.'
      });
    }
  },

  async handleResetUser(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const targetUser = interaction.options.getUser('user');
      const progress = await OnboardingProgress.findOne({ user_id: targetUser.id });

      if (!progress) {
        await interaction.editReply({
          content: `User ${targetUser.username} does not have an active onboarding progress.`
        });
        return;
      }

      progress.tasks = initializeTasks();
      await progress.save();

      const embed = new EmbedBuilder()
        .setTitle('Onboarding Tasks Reset')
        .setDescription(`Successfully reset tasks for ${targetUser.username}.`)
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error resetting user tasks:', error);
      await interaction.editReply({
        content: 'An error occurred while resetting tasks for the user.'
      });
    }
  }
};

