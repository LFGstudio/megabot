const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

console.log('🔍 Debug Information:');
console.log('Token length:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 'UNDEFINED');
console.log('Token starts with:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.substring(0, 10) + '...' : 'UNDEFINED');
console.log('Client ID:', process.env.DISCORD_CLIENT_ID);
console.log('Guild ID:', process.env.DISCORD_GUILD_ID);
console.log('Node version:', process.version);
console.log('Discord.js version:', require('discord.js').version);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log('✅ Bot connected successfully!');
  console.log(`👤 Bot name: ${client.user.tag}`);
  console.log(`🆔 Bot ID: ${client.user.id}`);
  console.log(`🌐 Connected to ${client.guilds.cache.size} server(s)`);
  
  // List all servers
  client.guilds.cache.forEach(guild => {
    console.log(`📋 Server: ${guild.name} (ID: ${guild.id})`);
  });
  
  process.exit(0);
});

client.on('error', error => {
  console.error('❌ Client error:', error);
});

client.on('warn', warning => {
  console.warn('⚠️ Client warning:', warning);
});

// Test connection
console.log('🚀 Attempting to connect...');
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Login failed:', error.message);
  console.error('❌ Error code:', error.code);
  console.error('❌ Full error:', error);
  process.exit(1);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.log('⏰ Connection timeout after 15 seconds');
  process.exit(1);
}, 15000);
