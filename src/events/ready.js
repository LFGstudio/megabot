const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ MegaBot is online!`);
    console.log(`👤 Logged in as: ${client.user.tag}`);
    console.log(`🆔 Bot ID: ${client.user.id}`);
    console.log(`🌐 Servers: ${client.guilds.cache.size}`);
    console.log(`👥 Users: ${client.users.cache.size}`);
    console.log(`⚡ Commands loaded: ${client.commandHandler.getSlashCommands().length}`);

    // Set bot status
    client.user.setPresence({
      activities: [{
        name: 'Your viral growth and payout assistant',
        type: ActivityType.Watching
      }],
      status: 'online'
    });

    // Register slash commands
    try {
      const { REST, Routes } = require('discord.js');
      const rest = new REST({ version: '10' }).setToken(client.config.token);

      const commands = client.commandHandler.getSlashCommands().map(command => command.data.toJSON());

      console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);
      console.log('📋 Commands to register:', commands.map(c => c.name + (c.options?.map(o => ' ' + o.name) || []).join(' ')).join(', '));

      // Register commands globally
      const data = await rest.put(
        Routes.applicationCommands(client.config.clientId),
        { body: commands }
      );

      console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
      console.log('📋 Registered commands:', data.map(c => c.name + (c.options?.map(o => ' ' + o.name) || []).join(' ')).join(', '));
    } catch (error) {
      console.error('❌ Error registering slash commands:', error);
    }

    // Initialize cron jobs
    const cronJobs = require('../utils/cronJobs');
    cronJobs.initialize(client);
    console.log('⏰ Cron jobs initialized');
    
    // Run migrations if needed
    try {
      const OnboardingProgress = require('../models/OnboardingProgress');
      const { initializeTasks } = require('../utils/onboardingTasks');
      
      // Check if we need to migrate old tasks to new format
      const allProgress = await OnboardingProgress.find({ status: { $ne: 'completed' } });
      let migratedCount = 0;
      
      for (const progress of allProgress) {
        // Check if tasks need updating by looking at Day 1 task IDs
        const day1Tasks = progress.tasks?.day1?.tasks || [];
        const hasOldTasks = day1Tasks.some(task => task.id === 'welcome_intro' || task.id === 'read_rules');
        
        if (hasOldTasks) {
          console.log(`[MIGRATION] Migrating tasks for user ${progress.user_id}...`);
          progress.tasks = initializeTasks();
          await progress.save();
          migratedCount++;
        }
      }
      
      if (migratedCount > 0) {
        console.log(`[MIGRATION] Migrated tasks for ${migratedCount} users to TikTok Poster format`);
      }
    } catch (migrationError) {
      console.error('Error running onboarding tasks migration:', migrationError);
    }

    // Send startup notification to admin channel
    const adminChannel = client.channels.cache.get(client.config.channels.admin);
    if (adminChannel) {
      const startupEmbed = {
        title: '🚀 MegaBot Started',
        color: 0x00ff00,
        description: 'MegaBot is now online and ready to serve!',
        fields: [
          { name: '⏰ Started', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: '🌐 Servers', value: client.guilds.cache.size.toString(), inline: true },
          { name: '⚡ Commands', value: client.commandHandler.getSlashCommands().length.toString(), inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'MegaBot Startup System' }
      };

      try {
        await adminChannel.send({ embeds: [startupEmbed] });
      } catch (error) {
        console.log('Could not send startup notification to admin channel:', error.message);
      }
    }
  }
};
