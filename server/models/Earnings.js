const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  providerEarnings: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cash'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  settlementStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending'
  },
  settlementDate: {
    type: Date
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

// Indexes for better query performance
earningSchema.index({ providerId: 1, createdAt: -1 });
earningSchema.index({ bookingId: 1 });
earningSchema.index({ settlementStatus: 1 });
earningSchema.index({ paymentStatus: 1 });

// Static method to create earnings for a booking
earningSchema.statics.createEarnings = async function(bookingData) {
  const {
    bookingId,
    providerId,
    serviceId,
    customerId,
    totalAmount,
    paymentMethod,
    transactionId
  } = bookingData;

  // Calculate 80/20 split
  const platformFee = totalAmount * 0.2; // 20% platform fee
  const providerEarnings = totalAmount * 0.8; // 80% to provider

  const paymentStatus = paymentMethod === 'online' ? 'completed' : 'pending';

  return await this.create({
    providerId,
    bookingId,
    serviceId,
    customerId,
    totalAmount,
    providerEarnings,
    platformFee,
    paymentMethod,
    paymentStatus,
    transactionId
  });
};

// Static method to get provider earnings summary
earningSchema.statics.getProviderEarningsSummary = async function(providerId, filters = {}) {
  const {
    startDate,
    endDate,
    paymentStatus,
    settlementStatus
  } = filters;

  const matchStage = { providerId };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  if (paymentStatus) matchStage.paymentStatus = paymentStatus;
  if (settlementStatus) matchStage.settlementStatus = settlementStatus;

  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$providerEarnings' },
        totalBookings: { $sum: 1 },
        totalPlatformFee: { $sum: '$platformFee' },
        totalRevenue: { $sum: '$totalAmount' },
        pendingSettlements: {
          $sum: {
            $cond: [{ $eq: ['$settlementStatus', 'pending'] }, '$providerEarnings', 0]
          }
        },
        completedSettlements: {
          $sum: {
            $cond: [{ $eq: ['$settlementStatus', 'processed'] }, '$providerEarnings', 0]
          }
        }
      }
    }
  ]);

  return summary[0] || {
    totalEarnings: 0,
    totalBookings: 0,
    totalPlatformFee: 0,
    totalRevenue: 0,
    pendingSettlements: 0,
    completedSettlements: 0
  };
};

// Static method to get provider earnings with pagination
earningSchema.statics.getProviderEarnings = async function(providerId, options = {}) {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    paymentStatus,
    settlementStatus,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const filter = { providerId };
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (settlementStatus) filter.settlementStatus = settlementStatus;

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const [earnings, total] = await Promise.all([
    this.find(filter)
      .populate('bookingId', 'status createdAt')
      .populate('serviceId', 'title category')
      .populate('customerId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(filter)
  ]);

  return {
    earnings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to update payment status
earningSchema.statics.updatePaymentStatus = async function(bookingId, paymentStatus, transactionId) {
  return await this.findOneAndUpdate(
    { bookingId },
    { 
      paymentStatus,
      transactionId,
      updatedAt: new Date()
    },
    { new: true }
  );
};

// Static method to process settlement
earningSchema.statics.processSettlement = async function(bookingId) {
  return await this.findOneAndUpdate(
    { 
      bookingId,
      settlementStatus: 'pending',
      paymentStatus: 'completed'
    },
    { 
      settlementStatus: 'processed',
      settlementDate: new Date(),
      updatedAt: new Date()
    },
    { new: true }
  );
};

// Static method to get platform earnings summary
earningSchema.statics.getPlatformEarningsSummary = async function(filters = {}) {
  const {
    startDate,
    endDate
  } = filters;

  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPlatformFee: { $sum: '$platformFee' },
        totalRevenue: { $sum: '$totalAmount' },
        totalBookings: { $sum: 1 },
        onlinePayments: {
          $sum: {
            $cond: [{ $eq: ['$paymentMethod', 'online'] }, 1, 0]
          }
        },
        cashPayments: {
          $sum: {
            $cond: [{ $eq: ['$paymentMethod', 'cash'] }, 1, 0]
          }
        },
        pendingSettlements: {
          $sum: {
            $cond: [{ $eq: ['$settlementStatus', 'pending'] }, '$providerEarnings', 0]
          }
        }
      }
    }
  ]);

  return summary[0] || {
    totalPlatformFee: 0,
    totalRevenue: 0,
    totalBookings: 0,
    onlinePayments: 0,
    cashPayments: 0,
    pendingSettlements: 0
  };
};

// Pre-save middleware
earningSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Earning', earningSchema);
