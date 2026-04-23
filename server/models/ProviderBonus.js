const mongoose = require('mongoose');

const providerBonusSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bonusAmount: {
    type: Number,
    required: true,
    default: 200
  },
  status: {
    type: String,
    enum: ['pending', 'credited', 'failed'],
    default: 'pending'
  },
  creditedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  transactionId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
providerBonusSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ProviderBonus', providerBonusSchema);
