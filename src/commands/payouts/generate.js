const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'generate',
  type: 'slash',
  data: new SlashCommandBuilder()
    .setName('payouts')
    .setDescription('Generate payout calculations (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('generate')
        .setDescription('Generate payout calculations for all clippers')
        .addStringOption(option =>
          option
            .setName('month')
            .setDescription('Month for payout calculation (YYYY-MM format)')
            .setRequired(false)
        )
        .addBooleanOption(option =>
          option
            .setName('dry_run')
            .setDescription('Preview calculations without updating balances')
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      // Check admin permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ You need administrator permissions to use this command.',
          ephemeral: true
        });
      }

      const User = require('../../models/User');
      const month = interaction.options.getString('month');
      const dryRun = interaction.options.getBoolean('dry_run') || false;

      // Validate month format if provided
      let targetMonth = new Date();
      if (month) {
        const monthRegex = /^\d{4}-\d{2}$/;
        if (!monthRegex.test(month)) {
          return interaction.reply({
            content: '❌ Invalid month format. Please use YYYY-MM format (e.g., 2024-01).',
            ephemeral: true
          });
        }
        targetMonth = new Date(month + '-01');
      }

      // Get all clippers with TikTok connected
      const clippers = await User.find({
        role: 'Clipper',
        tiktok_username: { $exists: true, $ne: null },
        tier1_views: { $gt: 0 }
      }).sort({ tier1_views: -1 });

      if (clippers.length === 0) {
        return interaction.reply({
          content: '❌ No clippers found with connected TikTok accounts and views.',
          ephemeral: true
        });
      }

      // Calculate payouts
      const payoutData = clippers.map(user => {
        const payout = Math.floor((user.tier1_views / 100000) * client.config.settings.payoutRate);
        return {
          user,
          payout,
          tier1_views: user.tier1_views,
          total_views: user.total_views
        };
      });

      // Filter out users with 0 payout
      const eligiblePayouts = payoutData.filter(data => data.payout > 0);
      const totalPayoutAmount = eligiblePayouts.reduce((sum, data) => sum + data.payout, 0);

      // Create payout summary embed
      const summaryEmbed = new EmbedBuilder()
        .setTitle(`${dryRun ? '📊' : '💰'} Payout ${dryRun ? 'Preview' : 'Generated'}`)
        .setColor(dryRun ? 0x0099ff : 0x00ff00)
        .setDescription(
          `${dryRun ? 'Preview' : 'Generated'} payout calculations for ${targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
        )
        .addFields(
          { name: '📊 Total Clippers', value: clippers.length.toString(), inline: true },
          { name: '💰 Eligible for Payout', value: eligiblePayouts.length.toString(), inline: true },
          { name: '💵 Total Payout Amount', value: `$${totalPayoutAmount.toLocaleString()}`, inline: true },
          { name: '📅 Month', value: targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), inline: true },
          { name: '⚙️ Rate', value: `$${client.config.settings.payoutRate} per 100k Tier 1 views`, inline: true },
          { name: '🔍 Mode', value: dryRun ? 'Preview Only' : 'Live Update', inline: true }
        )
        .setTimestamp();

      // Add top 10 payouts
      const topPayouts = eligiblePayouts.slice(0, 10);
      if (topPayouts.length > 0) {
        summaryEmbed.addFields({
          name: '🏆 Top 10 Payouts',
          value: topPayouts.map((data, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            return `${medal} <@${data.user.discord_id}> - $${data.payout} (${data.tier1_views.toLocaleString()} views)`;
          }).join('\n'),
          inline: false
        });
      }

      await interaction.reply({ embeds: [summaryEmbed] });

      // Process payouts if not a dry run
      if (!dryRun) {
        const processingEmbed = new EmbedBuilder()
          .setTitle('⏳ Processing Payouts')
          .setColor(0xff8800)
          .setDescription('Updating user balances and sending notifications...')
          .setTimestamp();

        const processingMessage = await interaction.followUp({ 
          embeds: [processingEmbed],
          ephemeral: true 
        });

        let successCount = 0;
        let errorCount = 0;

        for (const data of eligiblePayouts) {
          try {
            // Update user balance
            await data.user.addPayout(data.payout);

            // Send DM to user
            try {
              const user = await client.users.fetch(data.user.discord_id);
              const dmEmbed = new EmbedBuilder()
                .setTitle('💰 Payout Processed!')
                .setColor(0x00ff00)
                .setDescription(`Your monthly payout has been processed!`)
                .addFields(
                  { name: '📊 Tier 1 Views', value: data.tier1_views.toLocaleString(), inline: true },
                  { name: '💰 Payout Amount', value: `$${data.payout}`, inline: true },
                  { name: '💳 New Balance', value: `$${data.user.payout_balance}`, inline: true },
                  { name: '📅 Month', value: targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), inline: false }
                )
                .setFooter({ text: 'MegaBot Payout System' })
                .setTimestamp();

              await user.send({ embeds: [dmEmbed] });
              successCount++;
            } catch (dmError) {
              console.log(`Could not send DM to user ${data.user.discord_id}:`, dmError.message);
              successCount++; // Still count as successful payout processing
            }
          } catch (error) {
            console.error(`Error processing payout for user ${data.user.discord_id}:`, error);
            errorCount++;
          }
        }

        // Update processing message with results
        const resultsEmbed = new EmbedBuilder()
          .setTitle('✅ Payout Processing Complete')
          .setColor(0x00ff00)
          .setDescription('All payouts have been processed!')
          .addFields(
            { name: '✅ Successful', value: successCount.toString(), inline: true },
            { name: '❌ Errors', value: errorCount.toString(), inline: true },
            { name: '💰 Total Amount', value: `$${totalPayoutAmount.toLocaleString()}`, inline: true }
          )
          .setTimestamp();

        await processingMessage.edit({ embeds: [resultsEmbed] });

        // Log the action
        await client.logAction(
          'Payouts Generated',
          `<@${interaction.user.id}> generated payouts for ${eligiblePayouts.length} users totaling $${totalPayoutAmount.toLocaleString()}`
        );
      }

    } catch (error) {
      console.error('Error in payouts generate command:', error);
      await interaction.reply({
        content: '❌ An error occurred while generating payouts.',
        ephemeral: true
      });
    }
  }
};
