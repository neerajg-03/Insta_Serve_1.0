const express = require('express');
const router = express.Router();
const razorpayRouteService = require('../services/razorpayRouteService');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/razorpay-route/create-provider-account
// @desc    Create Razorpay Linked Account for provider
// @access  Private (Provider)
router.post('/create-provider-account', protect, authorize('provider'), async (req, res) => {
  try {
    console.log('🔧 Creating Razorpay Route account for user:', req.user._id);
    
    const provider = await User.findById(req.user._id);
    if (!provider) {
      console.log('❌ Provider not found:', req.user._id);
      return res.status(404).json({ message: 'Provider not found' });
    }

    console.log('✅ Provider found:', provider.name);
    console.log('📋 Existing Razorpay Account ID:', provider.razorpayAccountId);

    // Check if account already exists
    if (provider.razorpayAccountId) {
      console.log('❌ Razorpay account already exists:', provider.razorpayAccountId);
      return res.status(400).json({ 
        message: 'Razorpay account already exists',
        accountId: provider.razorpayAccountId 
      });
    }

    const providerData = {
      _id: provider._id,
      name: provider.name,
      email: provider.email,
      phone: provider.phone || '',
      businessName: provider.businessName || provider.name,
      pan: provider.pan || '',
      address: provider.address,
      bankAccount: provider.bankAccount
    };

    console.log('📊 Provider Data for Razorpay:', {
      name: providerData.name,
      email: providerData.email,
      phone: providerData.phone,
      businessName: providerData.businessName,
      pan: providerData.pan ? '***' + providerData.pan.slice(-4) : 'Not provided',
      hasAddress: !!providerData.address,
      hasBankAccount: !!providerData.bankAccount
    });

    // Create linked account
    console.log('🔗 Creating linked account...');
    const accountResult = await razorpayRouteService.createProviderLinkedAccount(providerData);
    
    if (!accountResult.success) {
      console.log('❌ Failed to create linked account:', accountResult.error);
      return res.status(400).json({ 
        message: 'Failed to create linked account',
        error: accountResult.error 
      });
    }

    // Create stakeholder
    console.log('👥 Creating stakeholder...');
    const stakeholderResult = await razorpayRouteService.createProviderStakeholder(
      accountResult.accountId, 
      providerData
    );

    if (!stakeholderResult.success) {
      console.log('❌ Failed to create stakeholder:', stakeholderResult.error);
      return res.status(400).json({ 
        message: 'Failed to create stakeholder',
        error: stakeholderResult.error 
      });
    }

    // Request product configuration
    console.log('⚙️ Requesting product configuration...');
    const configResult = await razorpayRouteService.requestRouteProductConfig(
      accountResult.accountId, 
      stakeholderResult.stakeholderId
    );

    // Update provider with Razorpay account details
    console.log('💾 Updating provider with Razorpay details...');
    provider.razorpayAccountId = accountResult.accountId;
    provider.razorpayStakeholderId = stakeholderResult.stakeholderId;
    provider.razorpayConfigId = configResult.configId;
    provider.razorpayAccountStatus = accountResult.status;
    await provider.save();

    console.log('✅ Razorpay Route account created successfully!');
    res.json({
      message: 'Razorpay Route account created successfully',
      accountId: accountResult.accountId,
      stakeholderId: stakeholderResult.stakeholderId,
      configId: configResult.configId,
      status: accountResult.status,
      activationStatus: configResult.activationStatus
    });

  } catch (error) {
    console.error('Create provider account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/razorpay-route/create-split-order
// @desc    Create order with split payment configuration
// @access  Private
router.post('/create-split-order', async (req, res) => {
  try {
    const { bookingData } = req.body;
    
    if (!bookingData || !bookingData._id) {
      return res.status(400).json({ message: 'Booking data is required' });
    }

    // Get provider's Razorpay account
    const provider = await User.findById(bookingData.provider._id);
    if (!provider || !provider.razorpayAccountId) {
      return res.status(400).json({ 
        message: 'Provider does not have Razorpay Route account' 
      });
    }

    // Create split order
    const orderResult = await razorpayRouteService.createSplitOrder(
      bookingData, 
      provider.razorpayAccountId
    );

    if (!orderResult.success) {
      return res.status(400).json({ 
        message: 'Failed to create split order',
        error: orderResult.error 
      });
    }

    res.json({
      message: 'Split order created successfully',
      orderId: orderResult.orderId,
      amount: orderResult.amount,
      transfers: orderResult.transfers
    });

  } catch (error) {
    console.error('Create split order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/razorpay-route/process-payment
// @desc    Process split payment after successful payment
// @access  Private
router.post('/process-payment', async (req, res) => {
  try {
    const { paymentId, bookingData } = req.body;
    
    if (!paymentId || !bookingData) {
      return res.status(400).json({ 
        message: 'Payment ID and booking data are required' 
      });
    }

    // Process split payment
    const result = await razorpayRouteService.processSplitPayment(
      paymentId, 
      bookingData
    );

    if (!result.success) {
      return res.status(400).json({ 
        message: 'Failed to process split payment',
        error: result.error 
      });
    }

    res.json({
      message: 'Split payment processed successfully',
      earnings: result.earnings,
      transferId: result.transferId
    });

  } catch (error) {
    console.error('Process split payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/razorpay-route/transfer-status/:transferId
// @desc    Get transfer status
// @access  Private (Provider)
router.get('/transfer-status/:transferId', protect, authorize('provider'), async (req, res) => {
  try {
    const { transferId } = req.params;
    
    const result = await razorpayRouteService.getTransferStatus(transferId);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Failed to get transfer status',
        error: result.error 
      });
    }

    res.json({
      status: result.status,
      amount: result.amount,
      processed_at: result.processed_at,
      settlement_id: result.settlement_id
    });

  } catch (error) {
    console.error('Get transfer status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/razorpay-route/process-refund
// @desc    Process refund with split reversal
// @access  Private (Admin)
router.post('/process-refund', protect, authorize('admin'), async (req, res) => {
  try {
    const { paymentId, refundAmount, bookingData } = req.body;
    
    if (!paymentId || !refundAmount || !bookingData) {
      return res.status(400).json({ 
        message: 'Payment ID, refund amount, and booking data are required' 
      });
    }

    const result = await razorpayRouteService.processSplitRefund(
      paymentId, 
      refundAmount, 
      bookingData
    );

    if (!result.success) {
      return res.status(400).json({ 
        message: 'Failed to process refund',
        error: result.error 
      });
    }

    res.json({
      message: 'Refund processed successfully',
      refundId: result.refundId,
      status: result.status
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/razorpay-route/account-balance/:accountId
// @desc    Get account balance
// @access  Private (Provider)
router.get('/account-balance/:accountId', protect, authorize('provider'), async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Verify account belongs to provider
    const provider = await User.findById(req.user._id);
    if (provider.razorpayAccountId !== accountId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const result = await razorpayRouteService.getAccountBalance(accountId);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Failed to get account balance',
        error: result.error 
      });
    }

    res.json({
      balance: result.balance
    });

  } catch (error) {
    console.error('Get account balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/razorpay-route/update-account
// @desc    Update provider linked account
// @access  Private (Provider)
router.put('/update-account', protect, authorize('provider'), async (req, res) => {
  try {
    const provider = await User.findById(req.user._id);
    if (!provider || !provider.razorpayAccountId) {
      return res.status(404).json({ 
        message: 'Provider Razorpay account not found' 
      });
    }

    const updateData = req.body;
    
    const result = await razorpayRouteService.updateProviderLinkedAccount(
      provider.razorpayAccountId, 
      updateData
    );

    if (!result.success) {
      return res.status(400).json({ 
        message: 'Failed to update account',
        error: result.error 
      });
    }

    res.json({
      message: 'Account updated successfully',
      account: result.account
    });

  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
