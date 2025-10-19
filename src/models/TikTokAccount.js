const mongoose = require('mongoose');

const tiktokAccountSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  account_url: {
    type: String,
    required: true
  },
  display_name: {
    type: String,
    default: ''
  },
  profile_picture: {
    type: String,
    default: ''
  },
  follower_count: {
    type: Number,
    default: 0
  },
  following_count: {
    type: Number,
    default: 0
  },
  video_count: {
    type: Number,
    default: 0
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  is_private: {
    type: Boolean,
    default: false
  },
  scraping_enabled: {
    type: Boolean,
    default: true
  },
  last_scraped_at: {
    type: Date,
    default: null
  },
  scraping_interval_hours: {
    type: Number,
    default: 6
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'inactive'],
    default: 'active'
  },
  added_at: {
    type: Date,
    default: Date.now
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
tiktokAccountSchema.index({ user_id: 1, added_at: -1 });
tiktokAccountSchema.index({ username: 1 });
tiktokAccountSchema.index({ scraping_enabled: 1 });
tiktokAccountSchema.index({ status: 1 });

// Instance methods
tiktokAccountSchema.methods.updateStats = function(stats) {
  this.display_name = stats.display_name || this.display_name;
  this.profile_picture = stats.profile_picture || this.profile_picture;
  this.follower_count = stats.follower_count || this.follower_count;
  this.following_count = stats.following_count || this.following_count;
  this.video_count = stats.video_count || this.video_count;
  this.is_verified = stats.is_verified || this.is_verified;
  this.is_private = stats.is_private || this.is_private;
  this.last_updated = new Date();
  return this.save();
};

tiktokAccountSchema.methods.enableScraping = function() {
  this.scraping_enabled = true;
  return this.save();
};

tiktokAccountSchema.methods.disableScraping = function() {
  this.scraping_enabled = false;
  return this.save();
};

tiktokAccountSchema.methods.markAsScraped = function() {
  this.last_scraped_at = new Date();
  return this.save();
};

// Static methods
tiktokAccountSchema.statics.getUserAccounts = function(userId) {
  return this.find({ user_id: userId, status: 'active' })
    .sort({ added_at: -1 });
};

tiktokAccountSchema.statics.getActiveScrapingAccounts = function() {
  return this.find({ 
    scraping_enabled: true, 
    status: 'active' 
  });
};

tiktokAccountSchema.statics.getAccountByUsername = function(username) {
  return this.findOne({ username: username });
};

module.exports = mongoose.model('TikTokAccount', tiktokAccountSchema);
