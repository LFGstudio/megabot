const onboardingHandlers = require('../utils/onboardingHandlers');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    try {
      // Ignore DMs
      if (!message.guild) return;
      
      // Ignore bot messages
      if (message.author.bot) return;

      // Handle onboarding channel messages with LLM
      await onboardingHandlers.handleOnboardingMessage(message, client);
      
    } catch (error) {
      console.error('Error in messageCreate event:', error);
    }
  }
};

