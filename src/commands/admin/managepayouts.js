const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const TikTokPost = require('../../models/TikTokPost');
const User = require('../../models/User');

module.exports = {
  name: 'managepayouts',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('managepayouts')
    .setDescription('Manage TikTok post payouts (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('markpaid')
        .setDescription('Mark a TikTok post as paid')
        .addStringOption(option =>
          option
            .setName('post_id')
            .setDescription('TikTok post ID')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option
            .setName('amount')
            .setDescription('Actual payout amount')
            .setRequired(true)
            .setMinValue(0)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('listpending')
        .setDescription('List posts pending payment')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('generatepayouts')
        .setDescription('Generate payout report for all completed posts')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'markpaid') {
        await this.handleMarkPaid(interaction, client);
      } else if (subcommand === 'listpending') {
        await this.handleListPending(interaction, client);
      } else if (subcommand === 'generatepayouts') {
        await this.handleGeneratePayouts(interaction, client);
      }

    } catch (error) {
      console.error('Error in managepayouts command:', error);
      await interaction.reply({
        content: '❌ An error occurred while managing payouts.',
        ephemeral: true
      });
    }
  },

  async handleMarkPaid(interaction, client) {
    try {
      const postId = interaction.options.getString('post_id');
      const amount = interaction.options.getNumber('amount');

      const post = await TikTokPost.findOne({ tiktok_id: postId });
      if (!post) {
        return interaction.reply({
          content: '❌ TikTok post not found.',
          ephemeral: true
        });
      }

      if (post.status === 'paid') {
        return interaction.reply({
          content: '❌ This post has already been marked as paid.',
          ephemeral: true
        });
      }

      // Mark post as paid
      await post.markAsPaid(amount);

      // Update user's payout balance
      const user = await User.findOne({ discord_id: post.user_id });
      if (user) {
        await user.addPayout(amount);
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Post Marked as Paid')
        .setColor(0x00ff00)
        .addFields(
          { name: '📱 TikTok ID', value: postId, inline: true },
          { name: '💰 Payout Amount', value: `$${amount.toFixed(2)}`, inline: true },
          { name: '👤 User', value: `<@${post.user_id}>`, inline: true }
        )
        .setFooter({ text: 'Payout processed successfully!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      // Send notification to user
      try {
        const user = await client.users.fetch(post.user_id);
        const userEmbed = new EmbedBuilder()
          .setTitle('💰 Payout Processed!')
          .setColor(0x00ff00)
          .setDescription('Your TikTok post payout has been processed!')
          .addFields(
            { name: '💰 Payout Amount', value: `$${amount.toFixed(2)}`, inline: true },
            { name: '📱 TikTok Post', value: post.tiktok_url, inline: false }
          )
          .setFooter({ text: 'Thank you for your content!' })
          .setTimestamp();

        await user.send({ embeds: [userEmbed] });
      } catch (dmError) {
        console.log(`Could not send DM to user ${post.user_id}:`, dmError.message);
      }

      // Log the action
      await client.logAction(
        'TikTok Payout Processed',
        `<@${interaction.user.id}> processed payout of $${amount.toFixed(2)} for TikTok post ${postId}`
      );

    } catch (error) {
      console.error('Error in handleMarkPaid:', error);
      await interaction.reply({
        content: '❌ An error occurred while marking the post as paid.',
        ephemeral: true
      });
    }
  },

  async handleListPending(interaction, client) {
    try {
      const pendingPosts = await TikTokPost.find({ 
        status: 'completed',
        verified: true
      }).sort({ estimated_payout: -1 });

      if (pendingPosts.length === 0) {
        return interaction.reply({
          content: '✅ No posts are currently pending payment.',
          ephemeral: true
        });
      }

      const totalPending = pendingPosts.reduce((sum, post) => sum + post.estimated_payout, 0);

      const embed = new EmbedBuilder()
        .setTitle('📋 Posts Pending Payment')
        .setColor(0xffa500)
        .setDescription(`Total pending payout: $${totalPending.toFixed(2)}`)
        .setTimestamp();

      const postList = pendingPosts.slice(0, 10).map((post, index) => {
        const username = post.user_id ? `<@${post.user_id}>` : 'Unknown User';
        return `${index + 1}. **${username}**: $${post.estimated_payout.toFixed(2)} (${post.tier1_views.toLocaleString()} views)`;
      }).join('\n');

      embed.addFields({
        name: '💰 Pending Payouts',
        value: postList + (pendingPosts.length > 10 ? `\n... and ${pendingPosts.length - 10} more` : ''),
        inline: false
      });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handleListPending:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching pending payouts.',
        ephemeral: true
      });
    }
  },

  async handleGeneratePayouts(interaction, client) {
    try {
      const completedPosts = await TikTokPost.find({ status: 'completed' });
      const totalPayout = completedPosts.reduce((sum, post) => sum + post.estimated_payout, 0);
      const totalPosts = completedPosts.length;

      const embed = new EmbedBuilder()
        .setTitle('📊 TikTok Payout Report')
        .setColor(0x0099ff)
        .addFields(
          { name: '📱 Total Completed Posts', value: totalPosts.toString(), inline: true },
          { name: '💰 Total Estimated Payout', value: `$${totalPayout.toFixed(2)}`, inline: true },
          { name: '📊 Average per Post', value: `$${(totalPayout / totalPosts).toFixed(2)}`, inline: true }
        )
        .setFooter({ text: 'Use /managepayouts listpending to see individual posts' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in handleGeneratePayouts:', error);
      await interaction.reply({
        content: '❌ An error occurred while generating the payout report.',
        ephemeral: true
      });
    }
  }
};
