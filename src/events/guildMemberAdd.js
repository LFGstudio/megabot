const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      console.log(`👤 New member joined: ${member.user.tag} (${member.id})`);

      // Create user in database
      const User = require('../models/User');
      const Referral = require('../models/Referral');
      let user = await User.findOne({ discord_id: member.id });
      
      if (!user) {
        user = new User({ 
          discord_id: member.id,
          role: 'New Member'
        });
        await user.save();
        console.log(`✅ Created database entry for new member: ${member.user.tag}`);
      }

      // Check for referral tracking
      let referrer = null;
      try {
        // Get all invites to check which one was used
        const invites = await member.guild.invites.fetch();
        
        // Find the invite that was used (this is a simplified approach)
        // In a real implementation, you'd track invite usage counts
        for (const [code, invite] of invites) {
          const referrerUser = await User.findOne({ referral_invite_code: code });
          if (referrerUser) {
            referrer = referrerUser;
            break;
          }
        }

        // If we found a referrer, create the referral relationship
        if (referrer && referrer.discord_id !== member.id) {
          // Check if this user was already referred
          const existingReferral = await Referral.findOne({ referred_user_id: member.id });
          if (!existingReferral) {
            const referral = new Referral({
              referrer_id: referrer.discord_id,
              referred_user_id: member.id,
              invite_code: referrer.referral_invite_code,
              joined_at: new Date(),
              status: 'active'
            });
            await referral.save();

            // Update referrer's affiliate count
            await referrer.incrementAffiliateCount();

            console.log(`🎯 Referral tracked: ${member.user.tag} was referred by ${referrer.tiktok_username || referrer.discord_id}`);

            // Send notification to referrer
            try {
              const referrerMember = await member.guild.members.fetch(referrer.discord_id);
              if (referrerMember) {
                const referralEmbed = new EmbedBuilder()
                  .setTitle('🎉 New Referral!')
                  .setColor(0x00ff00)
                  .setDescription(`Someone just joined using your referral link!`)
                  .addFields(
                    { name: '👤 New Member', value: `${member.user.tag}`, inline: true },
                    { name: '📅 Joined', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                    { name: '💰 Potential Earnings', value: 'You\'ll earn 10% of their earnings!', inline: false }
                  )
                  .setFooter({ text: 'Keep sharing your referral link to earn more!' })
                  .setTimestamp();

                await referrerMember.send({ embeds: [referralEmbed] });
                console.log(`📧 Sent referral notification to: ${referrerMember.user.tag}`);
              }
            } catch (notificationError) {
              console.log(`Could not send referral notification:`, notificationError.message);
            }

            // Update user's referred_by field
            user.referred_by = referrer.discord_id;
            await user.save();
          }
        }
      } catch (referralError) {
        console.error('Error tracking referral:', referralError);
        // Don't fail the entire join process if referral tracking fails
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
