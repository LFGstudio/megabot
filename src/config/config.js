require('dotenv').config();

const config = {
  // Bot Configuration
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  prefix: process.env.BOT_PREFIX || '!',
  
  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/megaviral_bot'
  },
  
  // TikTok API Configuration
  tiktok: {
    apiKey: process.env.TIKTOK_API_KEY,
    rapidApiKey: process.env.RAPIDAPI_KEY
  },
  
  // Channel IDs
  channels: {
    verification: process.env.VERIFICATION_CHANNEL_ID,
    warmup: process.env.WARMUP_CHANNEL_ID,
    admin: process.env.ADMIN_CHANNEL_ID,
    leaderboard: process.env.LEADERBOARD_CHANNEL_ID,
    logs: process.env.LOGS_CHANNEL_ID
  },
  
  // Role IDs
  roles: {
    newMember: process.env.NEW_MEMBER_ROLE_ID,
    warmingUp: process.env.WARMING_UP_ROLE_ID,
    clipper: process.env.CLIPPER_ROLE_ID,
    admin: process.env.ADMIN_ROLE_ID
  },
  
  // Bot Settings
  settings: {
    statsUpdateInterval: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
    leaderboardUpdateInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    payoutRate: 15, // $15 per 100,000 tier 1 views
    tier1Countries: ['US', 'UK', 'CA', 'AU', 'NZ']
  },
  
  // Environment
  env: process.env.NODE_ENV || 'development',
  
  // Validation
  validate() {
    const required = ['token', 'clientId', 'guildId'];
    const missing = required.filter(key => !this[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    return true;
  }
};

module.exports = config;
