const mongoose = require('mongoose');

const providerWalletSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Simple wallet balance
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Minimum balance requirement to receive service requests
  minimumBalance: {
    type: Number,
    default: 200,
    min: 0
  },
  
  // Transaction history
  transactions: [{
    type: {
      type: String,
      enum: ['recharge', 'deduction', 'refund'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    balanceAfter: {
      type: Number,
      required: true
    }
  }],
  
  // Auto-recharge settings
  autoRecharge: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      default: 500
    },
    triggerBalance: {
      type: Number,
      default: 100
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
providerWalletSchema.index({ provider: 1 });
providerWalletSchema.index({ 'transactions.timestamp': -1 });

// Instance method to check if provider can receive requests
providerWalletSchema.methods.canReceiveRequests = function() {
  return this.balance >= this.minimumBalance;
};

// Instance method to recharge wallet
providerWalletSchema.methods.recharge = async function(amount, description = 'Wallet recharge') {
  if (amount <= 0) {
    throw new Error('Recharge amount must be positive');
  }
  
  this.balance += amount;
  
  // Add transaction record
  this.transactions.push({
    type: 'recharge',
    amount: amount,
    description: description,
    balanceAfter: this.balance
  });
  
  return this.save();
};

// Instance method to deduct commission
providerWalletSchema.methods.deductCommission = async function(bookingId, amount, description = 'Commission deduction') {
  if (amount <= 0) {
    throw new Error('Deduction amount must be positive');
  }
  
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  this.balance -= amount;
  
  // Add transaction record
  this.transactions.push({
    type: 'deduction',
    amount: amount,
    description: description,
    booking: bookingId,
    balanceAfter: this.balance
  });
  
  return this.save();
};

// Instance method to refund amount
providerWalletSchema.methods.refund = async function(bookingId, amount, description = 'Refund') {
  if (amount <= 0) {
    throw new Error('Refund amount must be positive');
  }
  
  this.balance += amount;
  
  // Add transaction record
  this.transactions.push({
    type: 'refund',
    amount: amount,
    description: description,
    booking: bookingId,
    balanceAfter: this.balance
  });
  
  return this.save();
};

// Static method to get or create wallet for provider
providerWalletSchema.statics.getOrCreateWallet = async function(providerId) {
  let wallet = await this.findOne({ provider: providerId });
  
  if (!wallet) {
    wallet = new this({ provider: providerId });
    await wallet.save();
  }
  
  return wallet;
};

// Static method to get transaction history
providerWalletSchema.statics.getTransactionHistory = async function(providerId, options = {}) {
  const { page = 1, limit = 20, type } = options;
  const skip = (page - 1) * limit;
  
  const matchStage = { provider: new mongoose.Types.ObjectId(providerId) };
  if (type) {
    matchStage['transactions.type'] = type;
  }
  
  const wallet = await this.findOne(matchStage)
    .select('transactions')
    .populate('transactions.booking', 'serviceTitle totalPrice status');
  
  if (!wallet) {
    return { transactions: [], total: 0, page, limit };
  }
  
  let transactions = wallet.transactions;
  
  // Filter by type if specified
  if (type) {
    transactions = transactions.filter(t => t.type === type);
  }
  
  // Sort by timestamp (newest first)
  transactions.sort((a, b) => b.timestamp - a.timestamp);
  
  // Pagination
  const total = transactions.length;
  const paginatedTransactions = transactions.slice(skip, skip + limit);
  
  return {
    transactions: paginatedTransactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

module.exports = mongoose.model('ProviderWallet', providerWalletSchema);
