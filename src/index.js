const MegaBot = require('./client/bot');

// Create bot instance
const client = new MegaBot();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
  
  if (client.cronJobs) {
    client.cronJobs.stopAll();
  }
  
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Gracefully shutting down...');
  
  if (client.cronJobs) {
    client.cronJobs.stopAll();
  }
  
  client.destroy();
  process.exit(0);
});

// Start the bot
client.start().catch(error => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
