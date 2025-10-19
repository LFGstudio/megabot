const mongoose = require('mongoose');

const tiktokPostSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  tiktok_url: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tiktok_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  caption: {
    type: String,
    default: ''
  },
  total_views: {
    type: Number,
    default: 0
  },
  tier1_views: {
    type: Number,
    default: 0
  },
  tier1_percentage: {
    type: Number,
    default: 0
  },
  estimated_payout: {
    type: Number,
    default: 0
  },
  actual_payout: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['tracking', 'completed', 'paid'],
    default: 'tracking'
  },
  posted_at: {
    type: Date,
    default: Date.now
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  analytics_screenshot: {
    type: String,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
tiktokPostSchema.index({ user_id: 1, posted_at: -1 });
tiktokPostSchema.index({ tiktok_id: 1 });
tiktokPostSchema.index({ status: 1 });
tiktokPostSchema.index({ last_updated: -1 });

// Instance methods
tiktokPostSchema.methods.calculatePayout = function(payoutRate = 15) {
  // Payout formula: (tier1_views / 100000) * payoutRate
  this.estimated_payout = Math.floor((this.tier1_views / 100000) * payoutRate);
  return this.estimated_payout;
};

tiktokPostSchema.methods.updateViews = function(totalViews, tier1Views) {
  this.total_views = totalViews;
  this.tier1_views = tier1Views;
  this.tier1_percentage = totalViews > 0 ? (tier1Views / totalViews) * 100 : 0;
  this.last_updated = new Date();
  this.calculatePayout();
  return this.save();
};

tiktokPostSchema.methods.markAsPaid = function(actualPayout) {
  this.actual_payout = actualPayout;
  this.status = 'paid';
  return this.save();
};

tiktokPostSchema.methods.markAsVerified = function() {
  this.verified = true;
  return this.save();
};

// Static methods
tiktokPostSchema.statics.getUserPosts = function(userId, limit = 10) {
  return this.find({ user_id: userId })
    .sort({ posted_at: -1 })
    .limit(limit);
};

tiktokPostSchema.statics.getTopPosts = function(limit = 10) {
  return this.find({ status: 'completed' })
    .sort({ tier1_views: -1 })
    .limit(limit);
};

tiktokPostSchema.statics.getPendingVerification = function() {
  return this.find({ status: 'tracking', verified: false });
};

module.exports = mongoose.model('TikTokPost', tiktokPostSchema);
