const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const OnboardingProgress = require('../../models/OnboardingProgress');
const OnboardingData = require('../../models/OnboardingData');

module.exports = {
  name: 'onboarding-analytics',
  data: new SlashCommandBuilder()
    .setName('onboarding-analytics')
    .setDescription('View detailed onboarding analytics and funnel conversion stats')
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Quick stats overview')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('funnel')
        .setDescription('Funnel conversion analysis')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('issues')
        .setDescription('Common issues by day')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('performance')
        .setDescription('Performance metrics and timing')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('all')
        .setDescription('Complete analytics dashboard')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'stats':
          await this.showStats(interaction);
          break;
        case 'funnel':
          await this.showFunnel(interaction);
          break;
        case 'issues':
          await this.showIssues(interaction);
          break;
        case 'performance':
          await this.showPerformance(interaction);
          break;
        case 'all':
          await this.showCompleteAnalytics(interaction);
          break;
        default:
          await interaction.editReply('Invalid subcommand.');
      }

    } catch (error) {
      console.error('Error showing analytics:', error);
      await interaction.editReply('An error occurred while fetching analytics.');
    }
  },

  async showStats(interaction) {
    const allProgress = await OnboardingProgress.find({});
    
    // Counts by day
    const byDay = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const byStatus = { active: 0, paused: 0, completed: 0, inactive: 0 };
    const needsAttention = 0;
    
    for (const progress of allProgress) {
      if (progress.current_day >= 1 && progress.current_day <= 5) {
        byDay[progress.current_day]++;
      }
      byStatus[progress.status] = (byStatus[progress.status] || 0) + 1;
      
      if (progress.bot_muted) {
        needsAttention++;
      }
    }
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Onboarding Stats Overview')
      .setColor(0x5865F2)
      .addFields(
        { name: 'Day 1', value: `${byDay[1]} users`, inline: true },
        { name: 'Day 2', value: `${byDay[2]} users`, inline: true },
        { name: 'Day 3', value: `${byDay[3]} users`, inline: true },
        { name: 'Day 4', value: `${byDay[4]} users`, inline: true },
        { name: 'Day 5', value: `${byDay[5]} users`, inline: true },
        { name: 'Total Active', value: `${byStatus.active}`, inline: true },
        { name: 'Completed', value: `${byStatus.completed || 0}`, inline: true },
        { name: 'Needs Attention', value: `${needsAttention}`, inline: true },
        { name: 'Paused', value: `${byStatus.paused || 0}`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },

  async showFunnel(interaction) {
    const allProgress = await OnboardingProgress.find({});
    
    // Calculate funnel metrics
    let startedCount = 0;
    let completedDay1 = 0;
    let completedDay2 = 0;
    let completedDay3 = 0;
    let completedDay4 = 0;
    let completedDay5 = 0;
    let fullyCompleted = 0;
    
    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    for (const progress of allProgress) {
      startedCount++;
      
      if (progress.tasks?.day1?.completed) completedDay1++;
      if (progress.tasks?.day2?.completed) completedDay2++;
      if (progress.tasks?.day3?.completed) completedDay3++;
      if (progress.tasks?.day4?.completed) completedDay4++;
      if (progress.tasks?.day5?.completed) completedDay5++;
      if (progress.status === 'completed') fullyCompleted++;
    }
    
    // Calculate conversion rates
    const day1Conversion = startedCount > 0 ? ((completedDay1 / startedCount) * 100).toFixed(1) : 0;
    const day2Conversion = completedDay1 > 0 ? ((completedDay2 / completedDay1) * 100).toFixed(1) : 0;
    const day3Conversion = completedDay2 > 0 ? ((completedDay3 / completedDay2) * 100).toFixed(1) : 0;
    const day4Conversion = completedDay3 > 0 ? ((completedDay4 / completedDay3) * 100).toFixed(1) : 0;
    const day5Conversion = completedDay4 > 0 ? ((completedDay5 / completedDay4) * 100).toFixed(1) : 0;
    const overallConversion = startedCount > 0 ? ((fullyCompleted / startedCount) * 100).toFixed(1) : 0;
    
    // Find drop-off points
    const dropoffs = {
      'Started → Day 1': startedCount - completedDay1,
      'Day 1 → Day 2': completedDay1 - completedDay2,
      'Day 2 → Day 3': completedDay2 - completedDay3,
      'Day 3 → Day 4': completedDay3 - completedDay4,
      'Day 4 → Day 5': completedDay4 - completedDay5
    };
    
    const biggestDropoff = Object.entries(dropoffs).reduce((a, b) => dropoffs[a[0]] > dropoffs[b[0]] ? a : b);
    
    const embed = new EmbedBuilder()
      .setTitle('📈 Funnel Conversion Analysis')
      .setColor(0x5865F2)
      .setDescription('Conversion rates through each stage of onboarding')
      .addFields(
        { name: 'Started', value: `${startedCount} users`, inline: true },
        { name: 'Day 1 Complete', value: `${completedDay1} (${day1Conversion}%)`, inline: true },
        { name: 'Day 2 Complete', value: `${completedDay2} (${day2Conversion}%)`, inline: true },
        { name: 'Day 3 Complete', value: `${completedDay3} (${day3Conversion}%)`, inline: true },
        { name: 'Day 4 Complete', value: `${completedDay4} (${day4Conversion}%)`, inline: true },
        { name: 'Day 5 Complete', value: `${completedDay5} (${day5Conversion}%)`, inline: true },
        { name: 'Fully Completed', value: `${fullyCompleted} (${overallConversion}%)`, inline: true },
        { name: '🔴 Biggest Drop-off', value: `${biggestDropoff[0]}: ${biggestDropoff[1]} users`, inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },

  async showIssues(interaction) {
    const allProgress = await OnboardingProgress.find({ status: { $ne: 'completed' } });
    
    // Analyze common issues by day
    const issuesByDay = {
      1: { botMuted: 0, stuck: 0, noRecentActivity: 0 },
      2: { botMuted: 0, stuck: 0, noRecentActivity: 0 },
      3: { botMuted: 0, stuck: 0, noRecentActivity: 0 },
      4: { botMuted: 0, stuck: 0, noRecentActivity: 0 },
      5: { botMuted: 0, stuck: 0, noRecentActivity: 0 }
    };
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    for (const progress of allProgress) {
      if (progress.current_day >= 1 && progress.current_day <= 5) {
        const day = progress.current_day;
        
        if (progress.bot_muted) {
          issuesByDay[day].botMuted++;
        }
        
        // Check for stuck users (started more than 3 days ago but not completed)
        if (progress.started_at && new Date(progress.started_at) < threeDaysAgo) {
          const dayTasks = progress.getCurrentDayTasks();
          const nextTask = dayTasks.tasks.find(t => !t.completed);
          if (nextTask) {
            issuesByDay[day].stuck++;
          }
        }
        
        // Check for no recent activity
        if (progress.last_user_message && new Date(progress.last_user_message) < oneDayAgo) {
          issuesByDay[day].noRecentActivity++;
        } else if (!progress.last_user_message && new Date(progress.started_at) < oneDayAgo) {
          issuesByDay[day].noRecentActivity++;
        }
      }
    }
    
    // Build issue summary
    let issueText = '';
    for (let day = 1; day <= 5; day++) {
      const issues = issuesByDay[day];
      const totalIssues = issues.botMuted + issues.stuck + issues.noRecentActivity;
      if (totalIssues > 0) {
        issueText += `**Day ${day}:** ${totalIssues} users\n`;
        issueText += `  • Muted: ${issues.botMuted} | Stuck: ${issues.stuck} | Inactive: ${issues.noRecentActivity}\n\n`;
      }
    }
    
    const embed = new EmbedBuilder()
      .setTitle('⚠️ Common Issues by Day')
      .setColor(0xff9900)
      .setDescription(issueText || 'No issues detected - everything looks good!')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },

  async showPerformance(interaction) {
    const allProgress = await OnboardingProgress.find({ status: 'completed' });
    
    if (allProgress.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('⚡ Performance Metrics')
        .setDescription('No completed users yet to analyze performance')
        .setColor(0x5865F2);
      
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    // Calculate average time per day
    const dayTimes = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    
    for (const progress of allProgress) {
      for (let day = 1; day <= 5; day++) {
        const dayData = progress.tasks[`day${day}`];
        if (dayData && dayData.completed_at && progress.started_at) {
          // Calculate how long it took to complete this day
          const dayStarted = day === 1 ? new Date(progress.started_at) : 
                           progress.tasks[`day${day - 1}`]?.completed_at || new Date(progress.started_at);
          const dayCompleted = new Date(dayData.completed_at);
          const hours = (dayCompleted - dayStarted) / (1000 * 60 * 60);
          if (hours >= 0 && hours < 24 * 7) { // Reasonable range
            dayTimes[day].push(hours);
          }
        }
      }
    }
    
    // Calculate averages
    const averages = {};
    for (let day = 1; day <= 5; day++) {
      if (dayTimes[day].length > 0) {
        const avg = dayTimes[day].reduce((a, b) => a + b, 0) / dayTimes[day].length;
        averages[day] = avg;
      }
    }
    
    // Calculate overall time
    const overallTimes = [];
    for (const progress of allProgress) {
      if (progress.completed_at && progress.started_at) {
        const hours = (new Date(progress.completed_at) - new Date(progress.started_at)) / (1000 * 60 * 60);
        if (hours > 0 && hours < 24 * 14) { // Reasonable range
          overallTimes.push(hours);
        }
      }
    }
    
    const avgOverall = overallTimes.length > 0 
      ? (overallTimes.reduce((a, b) => a + b, 0) / overallTimes.length).toFixed(1)
      : 0;
    
    let perfText = `**Average Completion:** ${avgOverall} hours\n\n`;
    for (let day = 1; day <= 5; day++) {
      if (averages[day]) {
        const days = (averages[day] / 24).toFixed(1);
        perfText += `**Day ${day}:** ${averages[day].toFixed(1)}h (${days}d)\n`;
      }
    }
    
    const embed = new EmbedBuilder()
      .setTitle('⚡ Performance Metrics')
      .setDescription(perfText)
      .setColor(0x00ff00)
      .addFields(
        { name: 'Completed Users', value: `${allProgress.length}`, inline: true },
        { name: 'Data Quality', value: overallTimes.length > 0 ? 'Good' : 'Limited', inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },

  async showCompleteAnalytics(interaction) {
    // Get all data
    const allProgress = await OnboardingProgress.find({});
    
    // Quick stats
    const byDay = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const completedDay1 = 0, completedDay2 = 0, completedDay3 = 0, completedDay4 = 0, completedDay5 = 0, fullyCompleted = 0;
    
    for (const progress of allProgress) {
      if (progress.current_day >= 1 && progress.current_day <= 5) {
        byDay[progress.current_day]++;
      }
      if (progress.tasks?.day1?.completed) completedDay1++;
      if (progress.tasks?.day2?.completed) completedDay2++;
      if (progress.tasks?.day3?.completed) completedDay3++;
      if (progress.tasks?.day4?.completed) completedDay4++;
      if (progress.tasks?.day5?.completed) completedDay5++;
      if (progress.status === 'completed') fullyCompleted++;
    }
    
    // Conversion rates
    const overallConversion = allProgress.length > 0 ? ((fullyCompleted / allProgress.length) * 100).toFixed(1) : 0;
    
    // Drop-offs
    const dropoffs = {
      'Started → Day 1': allProgress.length - completedDay1,
      'Day 1 → Day 2': completedDay1 - completedDay2,
      'Day 2 → Day 3': completedDay2 - completedDay3,
      'Day 3 → Day 4': completedDay3 - completedDay4,
      'Day 4 → Day 5': completedDay4 - completedDay5
    };
    const biggestDropoff = Object.entries(dropoffs).reduce((a, b) => dropoffs[a[0]] > dropoffs[b[0]] ? a : b);
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Complete Onboarding Analytics')
      .setColor(0x5865F2)
      .setDescription('Full overview of your onboarding funnel')
      .addFields(
        { name: '📈 Current Distribution', value: `D1: ${byDay[1]} | D2: ${byDay[2]} | D3: ${byDay[3]} | D4: ${byDay[4]} | D5: ${byDay[5]}`, inline: false },
        { name: '✅ Completion Rates', value: `Overall: ${overallConversion}% completed (${fullyCompleted}/${allProgress.length})`, inline: false },
        { name: '🔴 Biggest Drop-off', value: `${biggestDropoff[0]}: ${biggestDropoff[1]} users`, inline: false }
      )
      .setFooter({ text: 'Use /onboarding-analytics [stats|funnel|issues|performance] for detailed views' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};

