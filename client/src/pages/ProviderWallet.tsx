import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface WalletData {
  balance: number;
  minimumBalance: number;
  canReceiveRequests: boolean;
  autoRecharge: {
    enabled: boolean;
    amount: number;
    triggerBalance: number;
  };
}

interface Transaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
  metadata?: any;
}

const ProviderWallet: React.FC = () => {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    minimumBalance: 200,
    canReceiveRequests: true,
    autoRecharge: {
      enabled: false,
      amount: 500,
      triggerBalance: 100
    }
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const predefinedAmounts = [200, 500, 1000, 2000, 5000];

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wallet/provider/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      toast.error('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/wallet/provider/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleRecharge = async (amount: number) => {
    if (amount < 10) {
      toast.error('Minimum recharge amount is ₹10');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Create Razorpay order
      const orderResponse = await fetch('/api/wallet/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }
      
      // Initialize Razorpay payment
      const options = {
        key: 'rzp_live_ShE5bMl84arxkI', // Razorpay test key
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'Insta Serve',
        description: 'Wallet Recharge',
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch('/api/wallet/verify-payment', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              toast.success('Wallet recharged successfully!');
              setShowRechargeModal(false);
              setRechargeAmount('');
              fetchWalletData();
              fetchTransactions();
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          email: localStorage.getItem('userEmail') || '',
        },
        theme: {
          color: '#10B981'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Recharge error:', error);
      toast.error('Failed to process recharge. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'failed':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/provider')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
          <p className="text-gray-600 mt-2">Manage your wallet balance and view transaction history</p>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-2">Current Balance</p>
              <p className="text-4xl font-bold">₹{walletData.balance.toLocaleString()}</p>
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center">
                  {walletData.canReceiveRequests ? (
                    <>
                      <ShieldCheckIcon className="w-5 h-5 text-emerald-200 mr-2" />
                      <span className="text-emerald-100">Can receive requests</span>
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-300 mr-2" />
                      <span className="text-yellow-300">Insufficient balance (Min: ₹{walletData.minimumBalance})</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <BanknotesIcon className="w-12 h-12 text-emerald-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setShowRechargeModal(true)}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-100 rounded-lg p-3">
                <ArrowDownTrayIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <ArrowTrendingUpIcon className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Recharge Wallet</h3>
            <p className="text-sm text-gray-600">Add funds to your wallet</p>
          </button>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <CreditCardIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Auto Recharge</h3>
            <p className="text-sm text-gray-600">
              {walletData.autoRecharge.enabled 
                ? `Enabled at ₹${walletData.autoRecharge.amount}` 
                : 'Disabled'
              }
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <BanknotesIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Min Balance</h3>
            <p className="text-sm text-gray-600">₹{walletData.minimumBalance} required</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
          </div>
          
          <div className="p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <BanknotesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-gray-600">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {transaction.type === 'credit' ? (
                          <ArrowDownTrayIcon className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowTrendingUpIcon className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.createdAt).toLocaleDateString()} • {new Date(transaction.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{Math.abs(transaction.amount)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">{transaction.status}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recharge Wallet</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Amount (₹)
              </label>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter amount"
                min="10"
              />
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Amounts</p>
              <div className="grid grid-cols-3 gap-3">
                {predefinedAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setRechargeAmount(amount.toString())}
                    className="py-2 px-4 border border-gray-300 rounded-lg hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowRechargeModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRecharge(Number(rechargeAmount))}
                disabled={!rechargeAmount || Number(rechargeAmount) < 10 || processingPayment}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processingPayment ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Recharge ₹${rechargeAmount || '0'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderWallet;
