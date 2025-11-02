const mongoose = require('mongoose');

const onboardingDataSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    ref: 'User'
  },
  discord_username: {
    type: String,
    required: true
  },
  discord_tag: {
    type: String,
    required: true
  },
  
  // Personal Information
  personal_info: {
    full_name: {
      type: String,
      default: null
    },
    country: {
      type: String,
      default: null,
      index: true
    },
    timezone: {
      type: String,
      default: null
    },
    age: {
      type: Number,
      default: null
    },
    languages: [{
      type: String
    }],
    introduction: {
      type: String,
      default: null
    },
    background: {
      type: String,
      default: null
    },
    motivation: {
      type: String,
      default: null
    }
  },

  // TikTok Account Information
  tiktok_info: {
    username: {
      type: String,
      default: null,
      index: true
    },
    profile_link: {
      type: String,
      default: null
    },
    display_name: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      default: null
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
    account_created_date: {
      type: Date,
      default: null
    },
    account_age_days: {
      type: Number,
      default: null
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    is_private: {
      type: Boolean,
      default: false
    },
    niche: {
      type: String,
      default: null
    },
    previous_experience: {
      type: String,
      default: null
    }
  },

  // Payment Information
  payment_info: {
    payment_method: {
      type: String,
      enum: ['PayPal', 'Wise', 'Bank Transfer', 'Other', null],
      default: null
    },
    payment_email: {
      type: String,
      default: null
    },
    payment_account_name: {
      type: String,
      default: null
    },
    currency_preference: {
      type: String,
      default: null
    }
  },

  // Onboarding Specific Data
  onboarding_questions: {
    how_did_you_find_us: {
      type: String,
      default: null
    },
    expectations: {
      type: String,
      default: null
    },
    goals: {
      type: String,
      default: null
    },
    content_experience: {
      type: String,
      default: null
    },
    available_hours_per_week: {
      type: Number,
      default: null
    },
    preferred_content_types: [{
      type: String
    }]
  },

  // Verification & Status
  verification: {
    account_verified: {
      type: Boolean,
      default: false
    },
    account_verified_at: {
      type: Date,
      default: null
    },
    warmup_verified: {
      type: Boolean,
      default: false
    },
    warmup_verified_at: {
      type: Date,
      default: null
    },
    verification_notes: {
      type: String,
      default: null
    }
  },

  // Additional Notes & Data
  notes: {
    admin_notes: {
      type: String,
      default: null
    },
    user_notes: {
      type: String,
      default: null
    },
    issues_encountered: [{
      issue: String,
      resolution: String,
      date: { type: Date, default: Date.now }
    }]
  },

  // Images & Attachments References
  submitted_images: [{
    url: String,
    filename: String,
    description: String,
    purpose: String, // e.g., 'profile_verification', 'warmup_proof', 'account_screenshot'
    uploaded_at: { type: Date, default: Date.now }
  }],

  // Data Collection Status
  data_completeness: {
    personal_info: { type: Number, default: 0 }, // Percentage
    tiktok_info: { type: Number, default: 0 },
    payment_info: { type: Number, default: 0 },
    onboarding_questions: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },

  // Metadata
  collected_at: {
    type: Date,
    default: Date.now
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  collected_via: {
    type: String,
    enum: ['modal', 'llm_conversation', 'command', 'manual'],
    default: 'llm_conversation'
  },
  data_source: {
    type: String,
    default: 'onboarding_process'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
onboardingDataSchema.index({ user_id: 1 });
onboardingDataSchema.index({ 'personal_info.country': 1 });
onboardingDataSchema.index({ 'tiktok_info.username': 1 });
onboardingDataSchema.index({ 'verification.account_verified': 1 });
onboardingDataSchema.index({ collected_at: -1 });

// Instance methods
onboardingDataSchema.methods.calculateCompleteness = async function() {
  // Calculate completeness for each section
  let personalCount = 0;
  let personalTotal = 8; // full_name, country, timezone, age, languages, introduction, background, motivation
  if (this.personal_info.full_name) personalCount++;
  if (this.personal_info.country) personalCount++;
  if (this.personal_info.timezone) personalCount++;
  if (this.personal_info.age) personalCount++;
  if (this.personal_info.languages && this.personal_info.languages.length > 0) personalCount++;
  if (this.personal_info.introduction) personalCount++;
  if (this.personal_info.background) personalCount++;
  if (this.personal_info.motivation) personalCount++;
  
  let tiktokCount = 0;
  let tiktokTotal = 12; // username, profile_link, display_name, bio, follower_count, etc.
  if (this.tiktok_info.username) tiktokCount++;
  if (this.tiktok_info.profile_link) tiktokCount++;
  if (this.tiktok_info.display_name) tiktokCount++;
  if (this.tiktok_info.bio !== null) tiktokCount++;
  if (this.tiktok_info.follower_count > 0) tiktokCount++;
  if (this.tiktok_info.following_count > 0) tiktokCount++;
  if (this.tiktok_info.video_count > 0) tiktokCount++;
  if (this.tiktok_info.account_created_date) tiktokCount++;
  if (this.tiktok_info.account_age_days) tiktokCount++;
  if (this.tiktok_info.is_verified !== null) tiktokCount++;
  if (this.tiktok_info.is_private !== null) tiktokCount++;
  if (this.tiktok_info.niche) tiktokCount++;
  
  let paymentCount = 0;
  let paymentTotal = 4;
  if (this.payment_info.payment_method) paymentCount++;
  if (this.payment_info.payment_email) paymentCount++;
  if (this.payment_info.payment_account_name) paymentCount++;
  if (this.payment_info.currency_preference) paymentCount++;
  
  let questionsCount = 0;
  let questionsTotal = 6;
  if (this.onboarding_questions.how_did_you_find_us) questionsCount++;
  if (this.onboarding_questions.expectations) questionsCount++;
  if (this.onboarding_questions.goals) questionsCount++;
  if (this.onboarding_questions.content_experience) questionsCount++;
  if (this.onboarding_questions.available_hours_per_week) questionsCount++;
  if (this.onboarding_questions.preferred_content_types && this.onboarding_questions.preferred_content_types.length > 0) questionsCount++;
  
  this.data_completeness.personal_info = Math.round((personalCount / personalTotal) * 100);
  this.data_completeness.tiktok_info = Math.round((tiktokCount / tiktokTotal) * 100);
  this.data_completeness.payment_info = Math.round((paymentCount / paymentTotal) * 100);
  this.data_completeness.onboarding_questions = Math.round((questionsCount / questionsTotal) * 100);
  
  // Overall completeness (average)
  const overall = (
    this.data_completeness.personal_info +
    this.data_completeness.tiktok_info +
    this.data_completeness.payment_info +
    this.data_completeness.onboarding_questions
  ) / 4;
  
  this.data_completeness.overall = Math.round(overall);
  this.last_updated = new Date();
  
  await this.save();
  return this.data_completeness;
};

onboardingDataSchema.methods.addSubmittedImage = async function(imageData) {
  this.submitted_images.push({
    url: imageData.url,
    filename: imageData.filename,
    description: imageData.description || null,
    purpose: imageData.purpose || 'general',
    uploaded_at: new Date()
  });
  await this.save();
};

onboardingDataSchema.methods.updateTikTokInfo = async function(tiktokData) {
  Object.assign(this.tiktok_info, tiktokData);
  this.last_updated = new Date();
  await this.save();
  await this.calculateCompleteness();
};

onboardingDataSchema.methods.updatePersonalInfo = async function(personalData) {
  Object.assign(this.personal_info, personalData);
  this.last_updated = Date.now();
  await this.save();
  await this.calculateCompleteness();
};

onboardingDataSchema.methods.addNote = async function(note, type = 'user_notes') {
  if (type === 'admin_notes') {
    this.notes.admin_notes = (this.notes.admin_notes || '') + `\n[${new Date().toISOString()}] ${note}`;
  } else {
    this.notes.user_notes = (this.notes.user_notes || '') + `\n[${new Date().toISOString()}] ${note}`;
  }
  await this.save();
};

// Static methods
onboardingDataSchema.statics.findByCountry = function(country) {
  return this.find({ 'personal_info.country': new RegExp(country, 'i') });
};

onboardingDataSchema.statics.findByTikTokUsername = function(username) {
  return this.find({ 'tiktok_info.username': new RegExp(username, 'i') });
};

onboardingDataSchema.statics.getStatistics = async function() {
  const total = await this.countDocuments();
  const byCountry = await this.aggregate([
    { $match: { 'personal_info.country': { $ne: null } } },
    { $group: { _id: '$personal_info.country', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const verified = await this.countDocuments({ 'verification.account_verified': true });
  const withPaymentInfo = await this.countDocuments({ 'payment_info.payment_method': { $ne: null } });
  
  return {
    total,
    verified,
    withPaymentInfo,
    byCountry,
    averageCompleteness: await this.aggregate([
      { $group: { _id: null, avg: { $avg: '$data_completeness.overall' } } }
    ])
  };
};

module.exports = mongoose.model('OnboardingData', onboardingDataSchema);

