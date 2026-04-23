import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  BanknotesIcon,
  ClockIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ArrowDownTrayIcon,
  WalletIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  StarIcon,
  UserIcon,
  SparklesIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import WithdrawalModal from '../../components/WithdrawalModal';
import razorpayRouteService from '../../services/razorpayRouteService';

interface EarningsSummary {
  totalEarnings: number;
  totalBookings: number;
  totalPlatformFees: number;
  totalRevenue: number;
  averageEarningPerBooking: number;
  pendingSettlements: number;
  settledEarnings: number;
}

interface Earning {
  _id: string;
  totalAmount: number;
  platformFee: number;
  providerEarnings: number;
  paymentMethod: 'online' | 'cash' | 'wallet';
  paymentStatus: string;
  settlementStatus: string;
  earnedAt: string;
  razorpayTransferId?: string;
  booking: {
    scheduledDate: string;
    price: { totalPrice: number };
  };
  service: {
    title: string;
  };
  customer: {
    name: string;
  };
}

interface Wallet {
  currentBalance: number;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  bankAccountVerified: boolean;
  razorpayAccountId?: string;
  razorpayAccountStatus?: string;
}

interface WithdrawalRequest {
  _id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  bankAccount: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
  };
}

const EarningsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  const [razorpaySetupLoading, setRazorpaySetupLoading] = useState(false);
  const [refreshingTransfers, setRefreshingTransfers] = useState(false);

  const fetchEarningsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/earnings/provider/me', {
        params: filters
      });
      
      setSummary(response.data.summary);
      setEarnings(response.data.earnings);
      setWallet(response.data.wallet);
    } catch (error: any) {
      console.error('Error fetching earnings data:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string, isRazorpayRoute: boolean = false) => {
    if (isRazorpayRoute) {
      switch (status) {
        case 'created':
          return 'text-blue-600 bg-blue-100';
        case 'processing':
          return 'text-yellow-600 bg-yellow-100';
        case 'settled':
          return 'text-green-600 bg-green-100';
        case 'failed':
          return 'text-red-600 bg-red-100';
        default:
          return 'text-gray-600 bg-gray-100';
      }
    }
    
    switch (status) {
      case 'completed':
      case 'settled':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'online':
        return <CreditCardIcon className="h-4 w-4" />;
      case 'wallet':
        return <WalletIcon className="h-4 w-4" />;
      case 'cash':
      default:
        return <BanknotesIcon className="h-4 w-4" />;
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleRazorpaySetup = async () => {
    try {
      setRazorpaySetupLoading(true);
      
      // Get current user data
      const userResponse = await api.get('/auth/me');
      const userData = userResponse.data;
      
      const providerData = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        businessName: userData.businessName || userData.name,
        pan: userData.pan,
        address: userData.address,
        bankAccount: userData.bankAccount
      };
      
      const result = await razorpayRouteService.createProviderAccount(providerData);
      
      if (result.success) {
        toast.success('Razorpay Route account created successfully!');
        fetchEarningsData(); // Refresh to get updated wallet info
      } else {
        toast.error(result.error || 'Failed to create Razorpay Route account');
      }
    } catch (error: any) {
      console.error('Razorpay setup error:', error);
      toast.error('Failed to setup Razorpay Route account');
    } finally {
      setRazorpaySetupLoading(false);
    }
  };

  const refreshTransferStatuses = async () => {
    try {
      setRefreshingTransfers(true);
      
      // Refresh earnings data to get latest transfer statuses
      await fetchEarningsData();
      
      toast.success('Transfer statuses refreshed');
    } catch (error: any) {
      console.error('Refresh transfer status error:', error);
      toast.error('Failed to refresh transfer statuses');
    } finally {
      setRefreshingTransfers(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading earnings data...</p>
        </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Earnings Dashboard</h1>
              <p className="mt-2 text-gray-600 text-lg">Track your income and financial performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowWithdrawalModal(true)}
                disabled={!wallet || wallet.availableBalance < 100}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                <span className="font-semibold">Withdraw Earnings</span>
              </button>
              <button
                onClick={fetchEarningsData}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowRightIcon className="h-4 w-4 mr-2 text-gray-600" />
                <span className="text-gray-700">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Razorpay Route Setup */}
        {wallet && !wallet.razorpayAccountId && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl mr-4">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900">Enable Instant Payouts</h3>
                  <p className="text-emerald-700 mt-1">Setup Razorpay Route for automatic split payments and instant settlements</p>
                  <div className="flex items-center mt-2 text-sm text-emerald-600">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    <span>80/20 split automatically</span>
                    <CheckCircleIcon className="h-4 w-4 ml-3 mr-1" />
                    <span>Instant provider payouts</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRazorpaySetup}
                disabled={razorpaySetupLoading}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {razorpaySetupLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="font-semibold">Setting up...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Setup Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Modern Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                    <WalletIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-700">Lifetime Earnings</p>
                    <p className="text-3xl font-bold text-green-900">{formatCurrency(summary.totalEarnings)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                    <BanknotesIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-700">Available Balance</p>
                    <p className="text-3xl font-bold text-blue-900">{formatCurrency(summary.settledEarnings)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                    <ClockIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-yellow-700">Pending Settlement</p>
                    <p className="text-3xl font-bold text-yellow-900">{formatCurrency(summary.pendingSettlements)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <ChartBarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-700">Total Bookings</p>
                    <p className="text-3xl font-bold text-purple-900">{summary.totalBookings}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StarIcon className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          availableBalance={wallet?.availableBalance || 0}
          onSuccess={() => {
            setShowWithdrawalModal(false);
            fetchEarningsData();
          }}
        />  

        {/* Recent Earnings Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-blue-500" />
              Recent Earnings Activity
            </h2>
            <div className="flex items-center space-x-2">
              {wallet?.razorpayAccountId && (
                <button
                  onClick={refreshTransferStatuses}
                  disabled={refreshingTransfers}
                  className="flex items-center px-3 py-2 text-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {refreshingTransfers ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600 mr-2"></div>
                      <span>Refreshing</span>
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      <span>Refresh Transfers</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={fetchEarningsData}
                className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowRightIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {earnings.slice(0, 5).map((earning) => (
              <div key={earning._id} className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <CurrencyDollarIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">Earned from {earning.service.title}</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(earning.providerEarnings)}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(earning.earnedAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {earning.razorpayTransferId && (
                        <div className="flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <SparklesIcon className="h-3 w-3 mr-1" />
                          Route
                        </div>
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(earning.settlementStatus, !!earning.razorpayTransferId)}`}>
                        {earning.settlementStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {earnings.length === 0 && (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent earnings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Complete bookings to see your earnings activity here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;
