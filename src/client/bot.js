const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const config = require('../config/config');
const CommandHandler = require('../handlers/commandHandler');
const EventHandler = require('../handlers/eventHandler');

class MegaBot extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });

    this.config = config;
    this.commands = new Collection();
    this.slashCommands = new Collection();
    this.cooldowns = new Collection();
    
    // Initialize handlers
    this.commandHandler = new CommandHandler(this);
    this.eventHandler = new EventHandler(this);
    
    // Initialize cron jobs
    this.cronJobs = require('../utils/cronJobs');
  }

  async start() {
    try {
      // Validate configuration
      this.config.validate();
      
      // Connect to MongoDB
      await this.connectDatabase();
      
      // Login to Discord
      await this.login(this.config.token);
      
      console.log('🚀 MegaBot is starting up...');
    } catch (error) {
      console.error('❌ Failed to start MegaBot:', error);
      process.exit(1);
    }
  }

  async connectDatabase() {
    try {
      await mongoose.connect(this.config.mongodb.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  // Utility methods
  async createVerificationEmbed(userData) {
    const embed = new EmbedBuilder()
      .setTitle('🔍 New Verification Request')
      .setColor(0x00ff00)
      .addFields(
        { name: '👤 User', value: `<@${userData.discord_id}>`, inline: true },
        { name: '📱 TikTok Username', value: userData.tiktok_username || 'Not provided', inline: true },
        { name: '🌍 Country', value: userData.country || 'Not provided', inline: true },
        { name: '📅 Submitted', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
      )
      .setFooter({ text: 'MegaBot Verification System' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`verify_approve_${userData.discord_id}`)
          .setLabel('✅ Approve')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`verify_reject_${userData.discord_id}`)
          .setLabel('❌ Reject')
          .setStyle(ButtonStyle.Danger)
      );

    return { embeds: [embed], components: [row] };
  }

  async createWarmupEmbed(userData) {
    const embed = new EmbedBuilder()
      .setTitle('🔥 New Warm-up Request')
      .setColor(0xff8800)
      .addFields(
        { name: '👤 User', value: `<@${userData.discord_id}>`, inline: true },
        { name: '📱 TikTok Username', value: userData.tiktok_username || 'Not provided', inline: true },
        { name: '📅 Submitted', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
      )
      .setFooter({ text: 'MegaBot Warm-up System' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`warmup_approve_${userData.discord_id}`)
          .setLabel('✅ Approve')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`warmup_reject_${userData.discord_id}`)
          .setLabel('❌ Reject')
          .setStyle(ButtonStyle.Danger)
      );

    return { embeds: [embed], components: [row] };
  }

  async createStatsEmbed(userData) {
    const estimatedPayout = userData.calculateEstimatedPayout();
    const nextPayout = userData.getNextPayoutDate();

    const embed = new EmbedBuilder()
      .setTitle('📊 Your TikTok Stats')
      .setColor(0x0099ff)
      .addFields(
        { name: '👤 TikTok Username', value: userData.tiktok_username || 'Not connected', inline: true },
        { name: '🌍 Country', value: userData.country || 'Not provided', inline: true },
        { name: '📈 Total Views', value: userData.total_views.toLocaleString(), inline: true },
        { name: '🎯 Tier 1 Views', value: userData.tier1_views.toLocaleString(), inline: true },
        { name: '💰 Estimated Payout', value: `$${estimatedPayout}`, inline: true },
        { name: '📅 Next Payout', value: `<t:${Math.floor(nextPayout / 1000)}:R>`, inline: true },
        { name: '🏆 Current Balance', value: `$${userData.payout_balance}`, inline: true },
        { name: '📊 Status', value: userData.role, inline: true }
      )
      .setFooter({ text: 'MegaBot Stats System' })
      .setTimestamp();

    return { embeds: [embed] };
  }

  async createLeaderboardEmbed(users) {
    const embed = new EmbedBuilder()
      .setTitle('🏆 Top 10 Clippers - Tier 1 Views')
      .setColor(0xffd700)
      .setDescription(
        users.map((user, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          const payout = Math.floor((user.tier1_views / 100000) * 15);
          return `${medal} <@${user.discord_id}> - ${user.tier1_views.toLocaleString()} views ($${payout})`;
        }).join('\n')
      )
      .setFooter({ text: 'MegaBot Leaderboard' })
      .setTimestamp();

    return { embeds: [embed] };
  }

  async logAction(action, details) {
    const logChannel = this.channels.cache.get(this.config.channels.logs);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle(`📝 ${action}`)
      .setColor(0x666666)
      .setDescription(details)
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  }

  async getUserFromDatabase(discordId) {
    const User = require('../models/User');
    let user = await User.findOne({ discord_id: discordId });
    
    if (!user) {
      user = new User({ discord_id: discordId });
      await user.save();
    }
    
    return user;
  }
}

module.exports = MegaBot;
