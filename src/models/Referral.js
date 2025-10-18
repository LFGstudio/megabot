const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  referred_user_id: {
    type: String,
    required: true,
    ref: 'User',
    unique: true,
    index: true
  },
  invite_code: {
    type: String,
    required: true
  },
  joined_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'inactive'],
    default: 'active'
  },
  affiliate_total_earnings: {
    type: Number,
    default: 0
  },
  commission_earned: {
    type: Number,
    default: 0
  },
  last_commission_paid: {
    type: Date,
    default: null
  },
  total_commission_paid: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
referralSchema.index({ referrer_id: 1, status: 1 });
referralSchema.index({ referred_user_id: 1 });
referralSchema.index({ invite_code: 1 });
referralSchema.index({ joined_at: -1 });

// Instance methods
referralSchema.methods.calculateCommission = function(earnings) {
  return Math.floor(earnings * 0.10); // 10% commission
};

referralSchema.methods.updateAffiliateEarnings = function(totalEarnings) {
  this.affiliate_total_earnings = totalEarnings;
  const newCommission = this.calculateCommission(totalEarnings);
  this.commission_earned = newCommission;
  return this.save();
};

referralSchema.methods.markCommissionPaid = function(amount) {
  this.total_commission_paid += amount;
  this.last_commission_paid = new Date();
  return this.save();
};

referralSchema.methods.getUnpaidCommission = function() {
  return this.commission_earned - this.total_commission_paid;
};

module.exports = mongoose.model('Referral', referralSchema);
