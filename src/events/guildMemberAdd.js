const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      console.log(`👤 New member joined: ${member.user.tag} (${member.id})`);

      // Create user in database
      const User = require('../models/User');
      let user = await User.findOne({ discord_id: member.id });
      
      if (!user) {
        user = new User({ 
          discord_id: member.id,
          role: 'New Member'
        });
        await user.save();
        console.log(`✅ Created database entry for new member: ${member.user.tag}`);
      }

      // Assign new member role
      const newMemberRole = member.guild.roles.cache.get(client.config.roles.newMember);
      if (newMemberRole) {
        await member.roles.add(newMemberRole);
        console.log(`🏷️ Assigned New Member role to: ${member.user.tag}`);
      }

      // Send welcome DM
      try {
        const welcomeEmbed = new EmbedBuilder()
          .setTitle('🎉 Welcome to MegaViral!')
          .setColor(0x00ff00)
          .setDescription('Welcome to the MegaViral clipping community! We\'re excited to have you on board.')
          .addFields(
            { name: '🚀 Getting Started', value: 'To begin your journey, you\'ll need to complete our verification process.', inline: false },
            { name: '📋 Next Steps', value: '1. Use `/verify submit` to submit your TikTok account\n2. Wait for staff approval\n3. Complete the warm-up phase\n4. Connect your TikTok for stats tracking', inline: false },
            { name: '💡 Tips', value: '• Make sure your TikTok account is active and public\n• Have your analytics ready for the warm-up phase\n• Follow all community guidelines', inline: false },
            { name: '❓ Need Help?', value: 'Feel free to ask questions in our support channels or DM a staff member.', inline: false }
          )
          .setFooter({ text: 'MegaBot Welcome System' })
          .setTimestamp();

        await member.send({ embeds: [welcomeEmbed] });
        console.log(`📧 Sent welcome DM to: ${member.user.tag}`);
      } catch (dmError) {
        console.log(`Could not send welcome DM to ${member.user.tag}:`, dmError.message);
      }

      // Log the action
      await client.logAction(
        'Member Joined',
        `<@${member.id}> joined the server`
      );

      // Send notification to admin channel
      const adminChannel = client.channels.cache.get(client.config.channels.admin);
      if (adminChannel) {
        const joinEmbed = new EmbedBuilder()
          .setTitle('👋 New Member Joined')
          .setColor(0x00ff00)
          .setThumbnail(member.user.displayAvatarURL())
          .addFields(
            { name: '👤 User', value: `${member.user.tag}`, inline: true },
            { name: '🆔 ID', value: member.id, inline: true },
            { name: '📅 Joined', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
            { name: '🏷️ Assigned Role', value: 'New Member', inline: true }
          )
          .setFooter({ text: 'MegaBot Member System' })
          .setTimestamp();

        try {
          await adminChannel.send({ embeds: [joinEmbed] });
        } catch (error) {
          console.log('Could not send join notification to admin channel:', error.message);
        }
      }

    } catch (error) {
      console.error('Error in guildMemberAdd event:', error);
    }
  }
};
