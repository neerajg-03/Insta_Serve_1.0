// Razorpay Route Service for Split Payments
const Razorpay = require('razorpay');
const Earnings = require('../models/Earnings');
const ProviderWallet = require('../models/ProviderWallet');

class RazorpayRouteService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  // Create Linked Account for Provider
  async createProviderLinkedAccount(providerData) {
    try {
      // Validate required fields
      if (!providerData.email || !providerData.name) {
        return {
          success: false,
          error: 'Email and name are required'
        };
      }

      console.log('� Creating REAL Razorpay Route account');
      console.log(`   Provider: ${providerData.name} (${providerData.email})`);
      console.log(`   Business: ${providerData.businessName || providerData.name}`);

      // Create the Razorpay Route account with real API call
      const account = await this.razorpay.accounts.create({
        email: providerData.email,
        phone: providerData.phone,
        type: "route",
        reference_id: providerData._id.toString(),
        legal_business_name: providerData.businessName || providerData.name,
        business_type: "individual",
        contact_name: providerData.name,
        profile: {
          business_name: providerData.businessName || providerData.name,
          contact_name: providerData.name,
          contact_email: providerData.email,
          contact_phone: providerData.phone
        },
        legal_info: {
          pan: providerData.pan,
          business_name: providerData.businessName || providerData.name
        },
        banking: {
          primary_account: {
            account_number: providerData.bankAccount?.accountNumber,
            ifsc: providerData.bankAccount?.ifscCode,
            bank_name: providerData.bankAccount?.bankName,
            account_holder_name: providerData.bankAccount?.accountHolderName || providerData.name
          }
        },
        settlement: {
          settlement_frequency: 'daily',
          minimum_amount: 100
        }
      });

      console.log('✅ Razorpay Route account created:', account.id);

      return {
        success: true,
        accountId: account.id,
        status: account.status || 'created'
      };
    } catch (error) {
      console.error('Error creating linked account:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create Stakeholder for Provider
  async createProviderStakeholder(accountId, providerData) {
    try {
      console.log('👥 Creating REAL Razorpay stakeholder for account:', accountId);
      
      const stakeholder = await this.razorpay.accounts.createStakeholder(accountId, {
        name: providerData.name,
        email: providerData.email,
        phone: providerData.phone,
        type: 'owner',
        reference_id: `stakeholder_${providerData._id}`,
        addresses: {
          residential: {
            street: providerData.address?.street || '',
            city: providerData.address?.city || '',
            state: providerData.address?.state || '',
            postal_code: providerData.address?.pincode || '',
            country: 'IN'
          }
        }
      });

      console.log('✅ Stakeholder created:', stakeholder.id);

      return {
        success: true,
        stakeholderId: stakeholder.id
      };
    } catch (error) {
      console.error('Error creating stakeholder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Request Product Configuration for Route
  async requestRouteProductConfig(accountId, stakeholderId) {
    try {
      console.log('⚙️ Creating REAL Razorpay Route product configuration');
      
      const config = await this.razorpay.products.create({
        account_id: accountId,
        product: 'route',
        configuration: {
          settlement: {
            enabled: true,
            frequency: 'daily',
            minimum_amount: 100
          },
          routing: {
            enabled: true,
            auto_routing: true
          }
        },
        stakeholder_ids: [stakeholderId]
      });

      console.log('✅ Product configuration created:', config.id);

      return {
        success: true,
        configId: config.id,
        activationStatus: config.activation_status
      };
    } catch (error) {
      console.error('Error requesting product config:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create Order with Split Payment Configuration
  async createSplitOrder(bookingData, providerAccountId) {
    try {
      const totalAmount = bookingData.price.totalPrice * 100; // Convert to paise
      const platformFeePercent = 20;
      const providerPercent = 80;
      
      const platformFee = Math.round((totalAmount * platformFeePercent) / 100);
      const providerAmount = Math.round((totalAmount * providerPercent) / 100);

      const order = await this.razorpay.orders.create({
        amount: totalAmount,
        currency: 'INR',
        receipt: `booking_${bookingData._id}`,
        notes: {
          booking_id: bookingData._id,
          customer_name: bookingData.customer.name,
          provider_id: bookingData.provider._id,
          provider_account_id: providerAccountId,
          platform_fee: platformFee,
          provider_amount: providerAmount
        },
        transfers: [
          {
            account: providerAccountId,
            amount: providerAmount,
            currency: 'INR',
            notes: {
              type: 'provider_payment',
              booking_id: bookingData._id,
              provider_id: bookingData.provider._id
            },
            on_hold: false,
            on_hold_until: null
          }
        ]
      });

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        transfers: order.transfers
      };
    } catch (error) {
      console.error('Error creating split order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process Split Payment After Payment Success
  async processSplitPayment(paymentId, bookingData) {
    try {
      // Get payment details
      const payment = await this.razorpay.payments.fetch(paymentId);
      
      if (payment.status !== 'captured') {
        return {
          success: false,
          error: 'Payment not captured'
        };
      }

      // Get transfer details
      const transfers = await this.razorpay.transfers.all({
        payment_id: paymentId
      });

      // Create earnings record
      const earningsData = Earnings.calculateEarnings(bookingData);
      
      const earnings = new Earnings({
        provider: bookingData.provider._id,
        booking: bookingData._id,
        service: bookingData.service._id,
        customer: bookingData.customer._id,
        totalAmount: earningsData.totalAmount,
        platformFee: earningsData.platformFee,
        providerEarnings: earningsData.providerEarnings,
        paymentMethod: 'online',
        paymentStatus: 'completed',
        settlementStatus: 'processing',
        transactionId: paymentId,
        razorpayTransferId: transfers.items[0]?.id
      });

      await earnings.save();

      // Update provider wallet
      let wallet = await ProviderWallet.findOne({ provider: bookingData.provider._id });
      if (!wallet) {
        wallet = new ProviderWallet({
          provider: bookingData.provider._id,
          bankAccount: {
            accountHolderName: bookingData.provider.name,
            accountNumber: '',
            ifscCode: '',
            bankName: ''
          }
        });
      }

      // Update wallet with real-time earnings
      wallet.totalEarnings += earningsData.providerEarnings;
      wallet.availableBalance += earningsData.providerEarnings;
      wallet.currentBalance = wallet.availableBalance + wallet.pendingBalance;
      
      await wallet.save();

      console.log(`💰 Split payment processed for booking ${bookingData._id}:`);
      console.log(`   Payment ID: ${paymentId}`);
      console.log(`   Provider Amount: ₹${earningsData.providerEarnings}`);
      console.log(`   Platform Fee: ₹${earningsData.platformFee}`);
      console.log(`   Transfer ID: ${transfers.items[0]?.id}`);

      return {
        success: true,
        earnings: earnings,
        transferId: transfers.items[0]?.id
      };
    } catch (error) {
      console.error('Error processing split payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get Transfer Status
  async getTransferStatus(transferId) {
    try {
      const transfer = await this.razorpay.transfers.fetch(transferId);
      
      return {
        success: true,
        status: transfer.status,
        amount: transfer.amount,
        processed_at: transfer.processed_at,
        settlement_id: transfer.settlement_id
      };
    } catch (error) {
      console.error('Error fetching transfer status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle Refunds with Split Reversal
  async processSplitRefund(paymentId, refundAmount, bookingData) {
    try {
      // Create refund
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: refundAmount * 100, // Convert to paise
        notes: {
          booking_id: bookingData._id,
          refund_reason: 'service_cancellation'
        }
      });

      // If split was created, the refund will automatically reverse the transfer
      console.log(`💸 Refund processed for payment ${paymentId}:`);
      console.log(`   Refund ID: ${refund.id}`);
      console.log(`   Refund Amount: ₹${refundAmount}`);

      return {
        success: true,
        refundId: refund.id,
        status: refund.status
      };
    } catch (error) {
      console.error('Error processing split refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update Provider Linked Account
  async updateProviderLinkedAccount(accountId, updateData) {
    try {
      const updatedAccount = await this.razorpay.accounts.edit(accountId, updateData);
      
      return {
        success: true,
        account: updatedAccount
      };
    } catch (error) {
      console.error('Error updating linked account:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get Account Balance
  async getAccountBalance(accountId) {
    try {
      const balance = await this.razorpay.accounts.fetchBalance(accountId);
      
      return {
        success: true,
        balance: balance
      };
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new RazorpayRouteService();
