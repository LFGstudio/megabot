const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'setup-welcome-images',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('setup-welcome-images')
    .setDescription('Setup automatic welcome images for new members (Admin only)')
    .addAttachmentOption(option =>
      option.setName('welcome-image')
        .setDescription('Image to show in welcome channel when members join')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('dm-image')
        .setDescription('Image to send in welcome DM to new members')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('welcome-title')
        .setDescription('Title for welcome channel message')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('dm-title')
        .setDescription('Title for welcome DM message')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const welcomeImage = interaction.options.getAttachment('welcome-image');
      const dmImage = interaction.options.getAttachment('dm-image');
      const welcomeTitle = interaction.options.getString('welcome-title') || '👋 Welcome to MegaViral!';
      const dmTitle = interaction.options.getString('dm-title') || '🎉 Welcome to MegaViral!';

      // Validate images
      if (!welcomeImage.contentType?.startsWith('image/')) {
        return await interaction.reply({
          content: '❌ Please provide a valid welcome image file.',
          ephemeral: true
        });
      }

      if (dmImage && !dmImage.contentType?.startsWith('image/')) {
        return await interaction.reply({
          content: '❌ Please provide a valid DM image file.',
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      // Store image URLs in bot config (you can extend this to use a database)
      const client = interaction.client;
      if (!client.welcomeImages) {
        client.welcomeImages = {};
      }

      client.welcomeImages.welcomeChannel = {
        imageUrl: welcomeImage.url,
        title: welcomeTitle
      };

      if (dmImage) {
        client.welcomeImages.dm = {
          imageUrl: dmImage.url,
          title: dmTitle
        };
      }

      // Test the setup by posting in welcome channel
      const welcomeChannel = interaction.guild.channels.cache.find(
        channel => channel.name.toLowerCase().includes('welcome') && channel.isTextBased()
      );

      if (welcomeChannel) {
        const testEmbed = new EmbedBuilder()
          .setTitle(welcomeTitle)
          .setDescription('This is how new members will see the welcome message!')
          .setColor(0x00ff00)
          .setImage(welcomeImage.url)
          .addFields(
            { name: '🚀 Getting Started', value: 'Complete the onboarding process to begin earning!', inline: false },
            { name: '📋 Next Steps', value: '1. Verify your TikTok account\n2. Complete warm-up process\n3. Start tracking earnings', inline: false }
          )
          .setFooter({ text: 'MegaViral Welcome System' })
          .setTimestamp();

        await welcomeChannel.send({ embeds: [testEmbed] });
      }

      await interaction.editReply({
        content: `✅ **Welcome images setup complete!**\n\n📸 **Welcome Image:** ${welcomeImage.name}\n${dmImage ? `📧 **DM Image:** ${dmImage.name}\n` : ''}📍 **Welcome Channel:** ${welcomeChannel || 'Not found'}\n\n**New members will now see these images automatically!**`
      });

      console.log(`✅ Setup welcome images: ${welcomeImage.name}${dmImage ? `, ${dmImage.name}` : ''}`);

    } catch (error) {
      console.error('Error in setup-welcome-images command:', error);
      await interaction.editReply({
        content: `❌ **Error setting up welcome images:**\n\`\`\`${error.message}\`\`\``,
        ephemeral: true
      });
    }
  }
};
