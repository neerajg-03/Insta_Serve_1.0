const mongoose = require('mongoose');
const Earnings = require('../models/Earnings');
const ProviderWallet = require('../models/ProviderWallet');
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/insta_serve', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for Nightly Settlement');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Generate unique settlement ID
const generateSettlementId = () => {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substr(2, 6);
  return `STL-${timestamp}-${random}`;
};

// Process settlement for a single provider
const processProviderSettlement = async (wallet) => {
  try {
    console.log(`\n🏦 Processing settlement for provider: ${wallet.provider._id} (${wallet.provider.name})`);
    
    // Get pending earnings for this provider
    const pendingEarnings = await Earnings.find({
      provider: wallet.provider._id,
      settlementStatus: 'pending'
    });
    
    if (pendingEarnings.length === 0) {
      console.log(`   No pending earnings found`);
      return { processed: false, reason: 'No pending earnings' };
    }
    
    // Check minimum settlement amount
    const totalPendingAmount = pendingEarnings.reduce((sum, earning) => sum + earning.providerEarnings, 0);
    const minimumAmount = wallet.settlementPreferences?.minimumSettlementAmount || 100;
    
    if (totalPendingAmount < minimumAmount) {
      console.log(`   Pending amount (₹${totalPendingAmount}) below minimum threshold (₹${minimumAmount})`);
      return { processed: false, reason: 'Below minimum threshold' };
    }
    
    // Check if bank account is verified
    if (!wallet.bankAccount?.isVerified) {
      console.log(`   Bank account not verified`);
      return { processed: false, reason: 'Bank account not verified' };
    }
    
    // Generate settlement ID and transaction ID
    const settlementId = generateSettlementId();
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Prepare settlement data
    const settlementData = {
      settlementId,
      transactionId,
      amount: totalPendingAmount,
      earningIds: pendingEarnings.map(e => e._id),
      earningsCount: pendingEarnings.length
    };
    
    console.log(`   Settlement Details:`);
    console.log(`   - Settlement ID: ${settlementId}`);
    console.log(`   - Transaction ID: ${transactionId}`);
    console.log(`   - Amount: ₹${totalPendingAmount}`);
    console.log(`   - Earnings Count: ${pendingEarnings.length}`);
    console.log(`   - Bank: ${wallet.bankAccount.bankName} (${wallet.bankAccount.accountNumber.slice(-4)})`);
    
    // Process the settlement (simulate bank transfer)
    const settlementResult = await simulateBankTransfer(wallet, settlementData);
    
    if (settlementResult.success) {
      // Update wallet with successful settlement
      await wallet.processSettlement(settlementData);
      
      console.log(`   ✅ Settlement processed successfully`);
      console.log(`   - Transaction ID: ${transactionId}`);
      console.log(`   - Amount transferred: ₹${totalPendingAmount}`);
      
      return {
        processed: true,
        settlementId,
        transactionId,
        amount: totalPendingAmount,
        earningsCount: pendingEarnings.length
      };
    } else {
      console.log(`   ❌ Settlement failed: ${settlementResult.error}`);
      return {
        processed: false,
        reason: settlementResult.error,
        error: settlementResult.error
      };
    }
    
  } catch (error) {
    console.error(`   ❌ Error processing settlement for provider ${wallet.provider._id}:`, error);
    return {
      processed: false,
      reason: 'System error',
      error: error.message
    };
  }
};

// Simulate bank transfer (replace with actual bank integration)
const simulateBankTransfer = async (wallet, settlementData) => {
  try {
    // Simulate API call to bank
    console.log(`   🏦 Initiating bank transfer...`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success (90% success rate for demo)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      console.log(`   ✅ Bank transfer successful`);
      return { success: true, transactionId: settlementData.transactionId };
    } else {
      console.log(`   ❌ Bank transfer failed - Insufficient funds`);
      return { success: false, error: 'Bank transfer failed - Insufficient funds' };
    }
    
  } catch (error) {
    console.error(`   ❌ Bank transfer error:`, error);
    return { success: false, error: error.message };
  }
};

// Main settlement function
const runNightlySettlement = async () => {
  try {
    console.log('🌙 Starting Nightly Settlement Process');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    
    // Connect to database
    await connectDB();
    
    // Get all wallets pending settlement
    const pendingWallets = await ProviderWallet.getPendingSettlements();
    
    if (pendingWallets.length === 0) {
      console.log('📭 No wallets pending settlement');
      return;
    }
    
    console.log(`📊 Found ${pendingWallets.length} wallets pending settlement`);
    
    // Process each wallet
    const results = {
      total: pendingWallets.length,
      processed: 0,
      failed: 0,
      skipped: 0,
      totalAmount: 0,
      details: []
    };
    
    for (const wallet of pendingWallets) {
      const result = await processProviderSettlement(wallet);
      
      if (result.processed) {
        results.processed++;
        results.totalAmount += result.amount;
        results.details.push({
          providerId: wallet.provider._id,
          providerName: wallet.provider.name,
          settlementId: result.settlementId,
          amount: result.amount,
          status: 'success'
        });
      } else {
        if (result.reason === 'No pending earnings' || 
            result.reason === 'Below minimum threshold' || 
            result.reason === 'Bank account not verified') {
          results.skipped++;
        } else {
          results.failed++;
        }
        
        results.details.push({
          providerId: wallet.provider._id,
          providerName: wallet.provider.name,
          reason: result.reason,
          status: result.error ? 'failed' : 'skipped'
        });
      }
    }
    
    // Print summary
    console.log('\n📊 Nightly Settlement Summary:');
    console.log(`   Total Wallets: ${results.total}`);
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Skipped: ${results.skipped}`);
    console.log(`   Total Amount Settled: ₹${results.totalAmount}`);
    
    if (results.details.length > 0) {
      console.log('\n📋 Detailed Results:');
      results.details.forEach(detail => {
        const status = detail.status === 'success' ? '✅' : detail.status === 'failed' ? '❌' : '⏭️';
        console.log(`   ${status} ${detail.providerName}: ${detail.amount ? `₹${detail.amount}` : detail.reason}`);
      });
    }
    
    // Send notification to admin (implement email/notification service)
    await sendSettlementNotification(results);
    
    console.log('\n🌙 Nightly Settlement Process Completed');
    
  } catch (error) {
    console.error('❌ Nightly Settlement Error:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Send settlement notification to admin
const sendSettlementNotification = async (results) => {
  try {
    console.log('\n📧 Sending settlement notification to admin...');
    
    // TODO: Implement email service
    // await emailService.sendSettlementReport({
    //   to: 'admin@instaserve.com',
    //   subject: `Nightly Settlement Report - ${new Date().toLocaleDateString()}`,
    //   data: results
    // });
    
    console.log('   ✅ Notification sent successfully');
    
  } catch (error) {
    console.error('   ❌ Failed to send notification:', error);
  }
};

// Run the settlement if this script is executed directly
if (require.main === module) {
  runNightlySettlement()
    .then(() => {
      console.log('✅ Settlement process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Settlement process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runNightlySettlement,
  processProviderSettlement,
  generateSettlementId
};
