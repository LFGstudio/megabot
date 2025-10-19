const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'post-creator-program-message',
  description: 'Post the creator program welcome message to the creator-program channel',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('post-creator-program-message')
    .setDescription('Post the creator program welcome message to the creator-program channel'),

  async execute(interaction, client) {
    try {
      // Find the creator-program channel
      const creatorProgramChannel = client.channels.cache.find(
        channel => channel.name === 'creator-program' && channel.type === 0
      );

      if (!creatorProgramChannel) {
        return await interaction.reply({
          content: '❌ Creator-program channel not found. Please make sure the channel exists.',
          ephemeral: true
        });
      }

      // Create the welcome message embed
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('👋 Welcome to our Creator Program!')
        .setColor(0xff6b6b)
        .setDescription(`
**MegaViral is an AI TikTok growth testing tool.**

🚀 We help content creators predict their views & improve their content to go MegaViral.

You will create faceless slideshow content for MegaViral.

We have a tested slideshow format that prints views. 
You will have access to content guidelines & our team that will help you generate millions of views.

💰 **Pay is for Tier 1 audience, US, Canada, UK & Australia.**

**$1 per 1k views**
**$1000 per 1m views**

You will be trained on how to create the faceless content and generate millions of views and comments in the videos you post.

**Join us! Be part of our creator program** ❤️
        `)
        .setFooter({ text: 'Ready to start your journey to viral success?' })
        .setTimestamp();

      // Post the message to the creator-program channel
      await creatorProgramChannel.send({ embeds: [welcomeEmbed] });

      // Confirm to the admin
      await interaction.reply({
        content: `✅ Creator program welcome message posted to #${creatorProgramChannel.name}!`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error posting creator program message:', error);
      await interaction.reply({
        content: '❌ An error occurred while posting the message.',
        ephemeral: true
      });
    }
  }
};
