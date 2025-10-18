const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

console.log('🔍 Testing bot connection...');
console.log('Token exists:', !!process.env.DISCORD_TOKEN);
console.log('Client ID exists:', !!process.env.DISCORD_CLIENT_ID);
console.log('Guild ID exists:', !!process.env.DISCORD_GUILD_ID);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log('✅ Bot is online!');
  console.log(`👤 Logged in as: ${client.user.tag}`);
  console.log(`🆔 Bot ID: ${client.user.id}`);
  console.log(`🌐 Connected to ${client.guilds.cache.size} server(s)`);
  process.exit(0);
});

client.on('error', error => {
  console.error('❌ Bot error:', error);
  process.exit(1);
});

// Test connection
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Failed to login:', error.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Connection timeout');
  process.exit(1);
}, 10000);
