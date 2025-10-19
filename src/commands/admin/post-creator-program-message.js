const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
  name: 'post-creator-program-message',
  description: 'Post the creator program welcome message to the creator-program channel',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('post-creator-program-message')
    .setDescription('Post the creator program welcome message to a channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to post the message to (defaults to creator-program)')
        .setRequired(false))
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Optional image to include with the message')
        .setRequired(false)),

  async execute(interaction, client) {
    try {
      // Get the image attachment and channel if provided
      const imageAttachment = interaction.options.getAttachment('image');
      const targetChannel = interaction.options.getChannel('channel');

      // Determine which channel to use
      let creatorProgramChannel = targetChannel;
      
      if (!creatorProgramChannel) {
        // Try to find the creator-program channel
        creatorProgramChannel = client.channels.cache.find(
          channel => channel.name === 'creator-program' && channel.type === 0
        );
      }

      if (!creatorProgramChannel) {
        return await interaction.reply({
          content: '❌ No target channel found. Please specify a channel or create a "creator-program" channel.',
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

      // Add image to embed if provided
      if (imageAttachment) {
        welcomeEmbed.setImage(imageAttachment.url);
      }

      // Prepare the message content
      const messageContent = {
        embeds: [welcomeEmbed]
      };

      // Add image as attachment if provided
      if (imageAttachment) {
        const attachment = new AttachmentBuilder(imageAttachment.url, { name: imageAttachment.name });
        messageContent.files = [attachment];
      }

      // Post the message to the creator-program channel
      await creatorProgramChannel.send(messageContent);

      // Confirm to the admin
      const confirmMessage = imageAttachment 
        ? `✅ Creator program welcome message with image posted to #${creatorProgramChannel.name}!`
        : `✅ Creator program welcome message posted to #${creatorProgramChannel.name}!`;
      
      await interaction.reply({
        content: confirmMessage,
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
