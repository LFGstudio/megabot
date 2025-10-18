const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  discord_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tiktok_username: {
    type: String,
    required: false,
    default: null
  },
  country: {
    type: String,
    required: false,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  warmup_done: {
    type: Boolean,
    default: false
  },
  total_views: {
    type: Number,
    default: 0
  },
  tier1_views: {
    type: Number,
    default: 0
  },
  payout_balance: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['New Member', 'Warming Up', 'Clipper', 'Admin'],
    default: 'New Member'
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  verification_submitted_at: {
    type: Date,
    default: null
  },
  verification_approved_at: {
    type: Date,
    default: null
  },
  warmup_submitted_at: {
    type: Date,
    default: null
  },
  warmup_approved_at: {
    type: Date,
    default: null
  },
  tiktok_connected_at: {
    type: Date,
    default: null
  },
  last_payout: {
    type: Date,
    default: null
  },
  // Referral System Fields
  referral_invite_code: {
    type: String,
    unique: true,
    sparse: true
  },
  referred_by: {
    type: String,
    default: null,
    ref: 'User'
  },
  referral_earnings: {
    type: Number,
    default: 0
  },
  affiliate_count: {
    type: Number,
    default: 0
  },
  referral_invite_created_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ tier1_views: -1 });
userSchema.index({ payout_balance: -1 });
userSchema.index({ last_updated: -1 });

// Instance methods
userSchema.methods.calculateEstimatedPayout = function() {
  // Payout formula: (tier1_views / 100000) * 15
  return Math.floor((this.tier1_views / 100000) * 15);
};

userSchema.methods.getNextPayoutDate = function() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
};

userSchema.methods.updateStats = function(totalViews, tier1Views) {
  this.total_views = totalViews;
  this.tier1_views = tier1Views;
  this.last_updated = new Date();
  return this.save();
};

userSchema.methods.addPayout = function(amount) {
  this.payout_balance += amount;
  this.last_payout = new Date();
  return this.save();
};

userSchema.methods.promoteRole = function(newRole) {
  this.role = newRole;
  return this.save();
};

// Referral System Methods
userSchema.methods.generateReferralCode = function() {
  const username = this.tiktok_username || this.discord_id;
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}${year}${random}`;
};

userSchema.methods.addReferralEarnings = function(amount) {
  this.referral_earnings += amount;
  return this.save();
};

userSchema.methods.incrementAffiliateCount = function() {
  this.affiliate_count += 1;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
