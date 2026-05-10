const express = require('express');
const router = express.Router();
const ProviderWallet = require('../models/ProviderWallet');
const { protect } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get provider wallet info
router.get('/provider/me', protect, async (req, res) => {
  try {
    const wallet = await ProviderWallet.getOrCreateWallet(req.user.id);
    
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        minimumBalance: wallet.minimumBalance,
        canReceiveRequests: wallet.canReceiveRequests(),
        autoRecharge: wallet.autoRecharge
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet information'
    });
  }
});

// Get transaction history
router.get('/provider/transactions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    const result = await ProviderWallet.getTransactionHistory(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      type
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history'
    });
  }
});

// Recharge wallet
router.post('/provider/recharge', protect, async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recharge amount'
      });
    }
    
    const wallet = await ProviderWallet.getOrCreateWallet(req.user.id);
    await wallet.recharge(amount, description || 'Manual recharge');
    
    res.json({
      success: true,
      message: 'Wallet recharged successfully',
      data: {
        balance: wallet.balance,
        rechargeAmount: amount
      }
    });
  } catch (error) {
    console.error('Recharge wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recharge wallet'
    });
  }
});

// Update auto-recharge settings
router.put('/provider/auto-recharge', protect, async (req, res) => {
  try {
    const { enabled, amount, triggerBalance } = req.body;
    
    const wallet = await ProviderWallet.getOrCreateWallet(req.user.id);
    
    if (enabled !== undefined) wallet.autoRecharge.enabled = enabled;
    if (amount !== undefined && amount > 0) wallet.autoRecharge.amount = amount;
    if (triggerBalance !== undefined && triggerBalance >= 0) wallet.autoRecharge.triggerBalance = triggerBalance;
    
    await wallet.save();
    
    res.json({
      success: true,
      message: 'Auto-recharge settings updated',
      data: {
        autoRecharge: wallet.autoRecharge
      }
    });
  } catch (error) {
    console.error('Update auto-recharge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auto-recharge settings'
    });
  }
});

// Admin route: Process commission deduction (called from booking completion)
router.post('/deduct-commission', protect, async (req, res) => {
  try {
    const { providerId, bookingId, amount, description } = req.body;
    
    if (!providerId || !bookingId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid commission deduction data'
      });
    }
    
    const wallet = await ProviderWallet.getOrCreateWallet(providerId);
    await wallet.deductCommission(bookingId, amount, description || 'Service commission');
    
    res.json({
      success: true,
      message: 'Commission deducted successfully',
      data: {
        providerId,
        deductedAmount: amount,
        remainingBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('Deduct commission error:', error);
    
    if (error.message === 'Insufficient balance') {
      return res.status(400).json({
        success: false,
        message: 'Provider has insufficient balance'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to deduct commission'
    });
  }
});

// Admin route: Process refund (called from booking cancellation)
router.post('/refund', protect, async (req, res) => {
  try {
    const { providerId, bookingId, amount, description } = req.body;
    
    if (!providerId || !bookingId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid refund data'
      });
    }
    
    const wallet = await ProviderWallet.getOrCreateWallet(providerId);
    await wallet.refund(bookingId, amount, description || 'Service cancellation refund');
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        providerId,
        refundAmount: amount,
        newBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

// Admin route: Check if provider can receive requests
router.get('/provider/:providerId/can-receive-requests', protect, async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const wallet = await ProviderWallet.getOrCreateWallet(providerId);
    
    res.json({
      success: true,
      data: {
        canReceiveRequests: wallet.canReceiveRequests(),
        balance: wallet.balance,
        minimumBalance: wallet.minimumBalance
      }
    });
  } catch (error) {
    console.error('Check receive requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check provider status'
    });
  }
});

// Create Razorpay order for wallet recharge
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum recharge amount is Rs. 10'
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `WR${Date.now().toString(36)}`,
      notes: {
        userId: req.user.id,
        purpose: 'wallet_recharge'
      }
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// Verify Razorpay payment and update wallet
router.post('/verify-payment', protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    // Update wallet balance
    const wallet = await ProviderWallet.getOrCreateWallet(req.user.id);
    await wallet.recharge(amount, 'Wallet recharge via Razorpay');

    res.json({
      success: true,
      message: 'Payment verified and wallet recharged successfully',
      data: {
        newBalance: wallet.balance,
        rechargeAmount: amount,
        paymentId: razorpay_payment_id
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

module.exports = router;
