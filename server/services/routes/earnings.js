const express = require('express');
const router = express.Router();
const Earnings = require('../models/Earnings');
const ProviderWallet = require('../models/ProviderWallet');
const ProviderBonus = require('../models/ProviderBonus');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get provider earnings summary
router.get('/provider/me', protect, async (req, res) => {
  try {
    const { status, paymentMethod, dateFrom, dateTo } = req.query;
    
    // Build filter conditions
    const filter = { providerId: req.user.id };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    // Get earnings with populated data
    const earnings = await Earnings.find(filter)
      .populate('bookingId', 'serviceTitle customerName amount')
      .populate('providerId', 'name email')
      .sort({ createdAt: -1 });
    
    // Get wallet information
    const wallet = await ProviderWallet.findOne({ providerId: req.user.id });
    
    // Calculate statistics
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.providerAmount, 0);
    const availableBalance = wallet?.availableBalance || 0;
    const pendingBalance = wallet?.pendingBalance || 0;
    
    // Group earnings by month for chart data
    const monthlyData = {};
    earnings.forEach(earning => {
      const month = new Date(earning.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, earnings: 0, bookings: 0 };
      }
      monthlyData[month].earnings += earning.providerAmount;
      monthlyData[month].bookings += 1;
    });
    
    const chartData = Object.values(monthlyData).slice(-6); // Last 6 months
    
    res.json({
      success: true,
      summary: {
        totalEarnings,
        totalBookings: earnings.length,
        totalPlatformFees: earnings.reduce((sum, earning) => sum + earning.platformFee, 0),
        totalRevenue: totalEarnings,
        averageEarningPerBooking: earnings.length > 0 ? totalEarnings / earnings.length : 0,
        pendingSettlements: pendingBalance,
        settledEarnings: availableBalance
      },
      earnings: earnings.map(earning => ({
        _id: earning._id,
        totalAmount: earning.serviceAmount,
        platformFee: earning.platformFee,
        providerEarnings: earning.providerAmount,
        paymentMethod: earning.paymentMethod,
        paymentStatus: earning.status,
        settlementStatus: earning.status,
        earnedAt: earning.createdAt,
        bookingId: earning.bookingId,
        providerId: earning.providerId
      })),
      wallet: {
        currentBalance: availableBalance + pendingBalance,
        availableBalance,
        pendingBalance,
        totalWithdrawn: 0, // This would need to be calculated from withdrawal history
        lastWithdrawal: null,
        bankAccount: {
          accountHolderName: 'Account Holder',
          accountNumber: '****1234',
          bankName: 'Bank Name',
          ifscCode: 'IFSC001'
        },
        razorpayAccountId: null,
        razorpayAccountStatus: null
      },
      chartData
    });
  } catch (error) {
    console.error('Error fetching provider earnings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch earnings data',
      error: error.message 
    });
  }
});

// Process earnings for a completed booking
router.post('/process-booking-earnings', protect, async (req, res) => {
  try {
    const { bookingId, serviceAmount, paymentMethod, providerId } = req.body;
    
    // Calculate earnings split (80/20)
    const platformFee = serviceAmount * 0.2;
    const providerAmount = serviceAmount * 0.8;
    
    // Create earnings record
    const earning = new Earnings({
      bookingId,
      providerId,
      serviceAmount,
      providerAmount,
      platformFee,
      paymentMethod,
      status: paymentMethod === 'online' ? 'available' : 'pending'
    });
    
    await earning.save();
    
    // Update provider wallet
    let wallet = await ProviderWallet.findOne({ providerId });
    if (!wallet) {
      wallet = new ProviderWallet({ providerId });
    }
    
    wallet.totalEarnings += providerAmount;
    
    if (paymentMethod === 'online') {
      wallet.availableBalance += providerAmount;
    } else {
      wallet.pendingBalance += providerAmount;
    }
    
    await wallet.save();
    
    res.json({
      success: true,
      message: 'Earnings processed successfully',
      data: earning
    });
  } catch (error) {
    console.error('Error processing earnings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process earnings',
      error: error.message 
    });
  }
});

// Get platform earnings summary (admin only)
router.get('/platform-summary', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const totalPlatformFees = await Earnings.aggregate([
      { $group: { _id: null, total: { $sum: '$platformFee' } } }
    ]);
    
    const totalEarnings = await Earnings.aggregate([
      { $group: { _id: null, total: { $sum: '$serviceAmount' } } }
    ]);
    
    const earningsByStatus = await Earnings.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$platformFee' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalPlatformFees: totalPlatformFees[0]?.total || 0,
        totalEarnings: totalEarnings[0]?.total || 0,
        earningsByStatus
      }
    });
  } catch (error) {
    console.error('Error fetching platform earnings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch platform earnings',
      error: error.message 
    });
  }
});

// Update payment status (for settlements)
router.post('/update-payment-status', protect, async (req, res) => {
  try {
    const { earningId, status } = req.body;
    
    const earning = await Earnings.findById(earningId);
    if (!earning) {
      return res.status(404).json({
        success: false,
        message: 'Earning record not found'
      });
    }
    
    earning.status = status;
    await earning.save();
    
    // Update wallet if status changed to available
    if (status === 'available' && earning.paymentMethod === 'cash') {
      const wallet = await ProviderWallet.findOne({ providerId: earning.providerId });
      if (wallet) {
        wallet.pendingBalance -= earning.providerAmount;
        wallet.availableBalance += earning.providerAmount;
        await wallet.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: earning
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update payment status',
      error: error.message 
    });
  }
});

// Get transaction history for provider
router.get('/transactions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentMethod, dateFrom, dateTo } = req.query;
    
    // Build filter conditions
    const filter = { providerId: req.user.id };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    const skip = (page - 1) * limit;
    
    const transactions = await Earnings.find(filter)
      .populate('bookingId', 'serviceTitle customerName amount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Earnings.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch transactions',
      error: error.message 
    });
  }
});

// Check provider bonus status
router.get('/provider/bonus-status', protect, async (req, res) => {
  try {
    const bonus = await ProviderBonus.findOne({ providerId: req.user.id });
    
    if (bonus) {
      res.json({
        success: true,
        data: {
          hasReceivedBonus: true,
          bonusAmount: bonus.bonusAmount,
          status: bonus.status,
          creditedAt: bonus.creditedAt,
          transactionId: bonus.transactionId
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          hasReceivedBonus: false,
          bonusAmount: 200,
          status: 'pending'
        }
      });
    }
  } catch (error) {
    console.error('Error checking bonus status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check bonus status',
      error: error.message 
    });
  }
});

module.exports = router;
