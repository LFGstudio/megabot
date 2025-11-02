const mongoose = require('mongoose');

const tiktokPosterSchema = new mongoose.Schema({
  // Discord & User Identification
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  discord_username: {
    type: String,
    required: true
  },
  discord_tag: {
    type: String,
    default: null
  },

  // Language & Communication
  language: {
    type: String,
    enum: ['en', 'es'],
    default: 'en'
  },
  timezone: {
    type: String,
    default: null // IANA timezone format, e.g., "America/New_York"
  },

  // Location & Targeting
  country: {
    type: String,
    default: null
  },
  country_code: {
    type: String,
    default: null // ISO country code
  },
  tier1: {
    type: Boolean,
    default: null // true if in Tier-1 country
  },

  // Device & US Targeting Method
  device: {
    type: String,
    enum: ['android', 'ios', null],
    default: null
  },
  us_targeting_method: {
    type: String,
    enum: ['normal', 'tiktok_mod_android', 'vpn_ios', null],
    default: null
  },
  us_targeting_proof: {
    type: String,
    default: null // URL or boolean flag for proof
  },

  // TikTok Account Information
  tiktok_username: {
    type: String,
    default: null,
    index: true
  },
  tiktok_account_link: {
    type: String,
    default: null // Full TikTok profile URL
  },
  tiktok_display_name: {
    type: String,
    default: null
  },
  tiktok_profile_picture_url: {
    type: String,
    default: null
  },

  // Onboarding Progress
  current_day: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  started_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date,
    default: null
  },

  // Engagement Tracking
  engagement_sessions: {
    type: Map,
    of: [{
      type: String,
      enum: ['am_done', 'pm_done', 'reminder_sent']
    }],
    default: {}
  },

  // Profile Screenshots & Proof
  profile_screenshots: [{
    attachment_id: String,
    attachment_url: String,
    uploaded_at: { type: Date, default: Date.now },
    purpose: String // e.g., 'account_creation', 'profile_setup', 'us_targeting_proof'
  }],

  // TikTok Posts
  posts: [{
    day: { type: Number, required: true },
    url: { type: String, required: true },
    reviewed_by_human: { type: Boolean, default: false },
    reviewed_at: { type: Date, default: null },
    posted_at: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
    tier1_views: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
  }],

  // Human Intervention
  human_intervention_needed: {
    type: Boolean,
    default: false
  },
  paused_until: {
    type: Date,
    default: null
  },

  // Activity Timestamps
  last_bot_message: {
    type: Date,
    default: Date.now
  },
  last_user_message: {
    type: Date,
    default: null
  },

  // Admin & Notes
  notes: {
    type: String,
    default: null
  },
  admin_notes: {
    type: String,
    default: null
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
tiktokPosterSchema.index({ user_id: 1 });
tiktokPosterSchema.index({ current_day: 1 });
tiktokPosterSchema.index({ status: 1 });
tiktokPosterSchema.index({ country_code: 1 });
tiktokPosterSchema.index({ tier1: 1 });
tiktokPosterSchema.index({ tiktok_username: 1 });
tiktokPosterSchema.index({ started_at: -1 });

// Instance methods
tiktokPosterSchema.methods.addEngagementSession = async function(day, sessionType) {
  if (!this.engagement_sessions.get(`day${day}`)) {
    this.engagement_sessions.set(`day${day}`, []);
  }
  const sessions = this.engagement_sessions.get(`day${day}`);
  if (!sessions.includes(sessionType)) {
    sessions.push(sessionType);
  }
  await this.save();
};

tiktokPosterSchema.methods.addPost = async function(postData) {
  this.posts.push({
    day: postData.day,
    url: postData.url,
    reviewed_by_human: postData.reviewed_by_human || false,
    reviewed_at: postData.reviewed_at || null,
    posted_at: new Date(),
    views: postData.views || 0,
    tier1_views: postData.tier1_views || 0,
    comments: postData.comments || 0,
    likes: postData.likes || 0
  });
  await this.save();
};

tiktokPosterSchema.methods.addProfileScreenshot = async function(screenshotData) {
  this.profile_screenshots.push({
    attachment_id: screenshotData.attachment_id,
    attachment_url: screenshotData.attachment_url,
    uploaded_at: new Date(),
    purpose: screenshotData.purpose || 'general'
  });
  await this.save();
};

tiktokPosterSchema.methods.advanceToNextDay = async function(force = false) {
  if (this.current_day < 5) {
    if (force) {
      this.current_day += 1;
      await this.save();
      return true;
    }
  }
  return false;
};

tiktokPosterSchema.methods.isOnboardingComplete = function() {
  return this.current_day === 5 && this.status === 'completed';
};

tiktokPosterSchema.methods.pauseOnboarding = async function(hours = 24) {
  this.paused_until = new Date(Date.now() + hours * 60 * 60 * 1000);
  this.status = 'paused';
  this.human_intervention_needed = true;
  await this.save();
};

tiktokPosterSchema.methods.resumeOnboarding = async function() {
  this.paused_until = null;
  this.status = 'active';
  this.human_intervention_needed = false;
  await this.save();
};

tiktokPosterSchema.methods.completeOnboarding = async function() {
  this.current_day = 5;
  this.status = 'completed';
  this.completed_at = new Date();
  await this.save();
};

// Static methods
tiktokPosterSchema.statics.findByDay = function(day) {
  return this.find({ current_day: day, status: 'active' });
};

tiktokPosterSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

tiktokPosterSchema.statics.findByCountry = function(countryCode) {
  return this.find({ country_code: countryCode });
};

tiktokPosterSchema.statics.findTier1Users = function() {
  return this.find({ tier1: true });
};

tiktokPosterSchema.statics.getStatistics = async function() {
  const total = await this.countDocuments();
  const active = await this.countDocuments({ status: 'active' });
  const completed = await this.countDocuments({ status: 'completed' });
  const paused = await this.countDocuments({ status: 'paused' });
  
  const byDay = await this.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$current_day', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  
  const byCountry = await this.aggregate([
    { $match: { country_code: { $ne: null } } },
    { $group: { _id: '$country_code', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const totalPosts = await this.aggregate([
    { $unwind: '$posts' },
    { $group: { _id: null, total: { $sum: 1 } } }
  ]);

  return {
    total,
    active,
    completed,
    paused,
    byDay,
    byCountry,
    totalPosts: totalPosts[0]?.total || 0
  };
};

module.exports = mongoose.model('TikTokPoster', tiktokPosterSchema);

