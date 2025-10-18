const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const config = require('../config/config');

class TestFlow {
  constructor() {
    this.testUsers = [];
  }

  async initialize() {
    try {
      // Connect to MongoDB
      await mongoose.connect(config.mongodb.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB for testing');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async runCompleteFlow() {
    console.log('🧪 Starting MegaBot Test Flow...\n');

    try {
      // Step 1: Create test users
      await this.createTestUsers();
      
      // Step 2: Simulate verification submission
      await this.simulateVerificationSubmission();
      
      // Step 3: Simulate admin approval
      await this.simulateVerificationApproval();
      
      // Step 4: Simulate warm-up submission
      await this.simulateWarmupSubmission();
      
      // Step 5: Simulate warm-up approval
      await this.simulateWarmupApproval();
      
      // Step 6: Simulate TikTok connection
      await this.simulateTikTokConnection();
      
      // Step 7: Simulate stats updates
      await this.simulateStatsUpdates();
      
      // Step 8: Test payout calculations
      await this.testPayoutCalculations();
      
      // Step 9: Test leaderboard
      await this.testLeaderboard();
      
      // Step 10: Display final results
      await this.displayFinalResults();

      console.log('\n🎉 Test flow completed successfully!');
      
    } catch (error) {
      console.error('❌ Test flow failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  async createTestUsers() {
    console.log('👥 Creating test users...');
    
    const testUserData = [
      {
        discord_id: '123456789012345678',
        tiktok_username: 'testuser1',
        country: 'United States',
        role: 'New Member'
      },
      {
        discord_id: '234567890123456789',
        tiktok_username: 'testuser2',
        country: 'United Kingdom',
        role: 'New Member'
      },
      {
        discord_id: '345678901234567890',
        tiktok_username: 'testuser3',
        country: 'Canada',
        role: 'New Member'
      }
    ];

    for (const userData of testUserData) {
      // Remove existing test user if it exists
      await User.findOneAndDelete({ discord_id: userData.discord_id });
      
      // Create new test user
      const user = new User(userData);
      await user.save();
      this.testUsers.push(user);
      console.log(`✅ Created test user: ${user.tiktok_username} (${user.discord_id})`);
    }
  }

  async simulateVerificationSubmission() {
    console.log('\n📝 Simulating verification submissions...');
    
    for (const user of this.testUsers) {
      user.verification_submitted_at = new Date();
      await user.save();
      console.log(`✅ ${user.tiktok_username} submitted verification`);
    }
  }

  async simulateVerificationApproval() {
    console.log('\n✅ Simulating verification approvals...');
    
    for (const user of this.testUsers) {
      user.verified = true;
      user.verification_approved_at = new Date();
      user.role = 'Warming Up';
      await user.save();
      console.log(`✅ ${user.tiktok_username} verification approved, role: ${user.role}`);
    }
  }

  async simulateWarmupSubmission() {
    console.log('\n🔥 Simulating warm-up submissions...');
    
    for (const user of this.testUsers) {
      user.warmup_submitted_at = new Date();
      await user.save();
      console.log(`✅ ${user.tiktok_username} submitted warm-up completion`);
    }
  }

  async simulateWarmupApproval() {
    console.log('\n✅ Simulating warm-up approvals...');
    
    for (const user of this.testUsers) {
      user.warmup_done = true;
      user.warmup_approved_at = new Date();
      user.role = 'Clipper';
      await user.save();
      console.log(`✅ ${user.tiktok_username} warm-up approved, role: ${user.role}`);
    }
  }

  async simulateTikTokConnection() {
    console.log('\n🔗 Simulating TikTok connections...');
    
    for (const user of this.testUsers) {
      user.tiktok_connected_at = new Date();
      await user.save();
      console.log(`✅ ${user.tiktok_username} TikTok connected`);
    }
  }

  async simulateStatsUpdates() {
    console.log('\n📊 Simulating stats updates...');
    
    for (const user of this.testUsers) {
      // Generate realistic mock stats
      const totalViews = Math.floor(Math.random() * 5000000) + 100000;
      const tier1Percentage = Math.random() * 0.4 + 0.1; // 10-50%
      const tier1Views = Math.floor(totalViews * tier1Percentage);
      
      await user.updateStats(totalViews, tier1Views);
      
      const estimatedPayout = user.calculateEstimatedPayout();
      console.log(`✅ ${user.tiktok_username}: ${tier1Views.toLocaleString()} Tier 1 views ($${estimatedPayout})`);
    }
  }

  async testPayoutCalculations() {
    console.log('\n💰 Testing payout calculations...');
    
    const clippers = await User.find({ role: 'Clipper' });
    let totalPayout = 0;
    
    for (const user of clippers) {
      const payout = user.calculateEstimatedPayout();
      totalPayout += payout;
      
      console.log(`${user.tiktok_username}: $${payout} (${user.tier1_views.toLocaleString()} views)`);
    }
    
    console.log(`💰 Total payout amount: $${totalPayout.toLocaleString()}`);
  }

  async testLeaderboard() {
    console.log('\n🏆 Testing leaderboard...');
    
    const topUsers = await User.find({
      role: 'Clipper',
      tiktok_username: { $exists: true, $ne: null },
      tier1_views: { $gt: 0 }
    })
    .sort({ tier1_views: -1 })
    .limit(5);

    console.log('Top 5 Clippers by Tier 1 Views:');
    topUsers.forEach((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      const payout = user.calculateEstimatedPayout();
      console.log(`${medal} ${user.tiktok_username}: ${user.tier1_views.toLocaleString()} views ($${payout})`);
    });
  }

  async displayFinalResults() {
    console.log('\n📋 Final Test Results:');
    
    const allUsers = await User.find({ discord_id: { $in: this.testUsers.map(u => u.discord_id) } });
    
    console.log('\nUser Status Summary:');
    for (const user of allUsers) {
      console.log(`\n👤 ${user.tiktok_username}:`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Verified: ${user.verified ? '✅' : '❌'}`);
      console.log(`   Warm-up Done: ${user.warmup_done ? '✅' : '❌'}`);
      console.log(`   TikTok Connected: ${user.tiktok_connected_at ? '✅' : '❌'}`);
      console.log(`   Total Views: ${user.total_views.toLocaleString()}`);
      console.log(`   Tier 1 Views: ${user.tier1_views.toLocaleString()}`);
      console.log(`   Estimated Payout: $${user.calculateEstimatedPayout()}`);
    }

    // Database statistics
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ verified: true });
    const clippers = await User.countDocuments({ role: 'Clipper' });
    const totalTier1Views = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$tier1_views' } } }
    ]);

    console.log('\n📊 Database Statistics:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Verified Users: ${verifiedUsers}`);
    console.log(`   Clippers: ${clippers}`);
    console.log(`   Total Tier 1 Views: ${totalTier1Views[0]?.total?.toLocaleString() || '0'}`);
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    // Remove test users
    for (const user of this.testUsers) {
      await User.findOneAndDelete({ discord_id: user.discord_id });
      console.log(`🗑️ Removed test user: ${user.tiktok_username}`);
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run the test flow if this file is executed directly
if (require.main === module) {
  const testFlow = new TestFlow();
  testFlow.initialize()
    .then(() => testFlow.runCompleteFlow())
    .catch(error => {
      console.error('❌ Test flow initialization failed:', error);
      process.exit(1);
    });
}

module.exports = TestFlow;
