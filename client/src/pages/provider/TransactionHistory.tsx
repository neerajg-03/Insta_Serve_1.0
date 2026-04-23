import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowLeftIcon,
  CalendarIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface Transaction {
  _id: string;
  settlementId?: string;
  amount: number;
  transactionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  initiatedAt: string;
  completedAt?: string;
  failureReason?: string;
  earningsCount: number;
  type: 'settlement' | 'earning' | 'deduction';
  description: string;
  referenceId?: string;
}

interface EarningTransaction {
  _id: string;
  totalAmount: number;
  platformFee: number;
  providerEarnings: number;
  paymentMethod: 'online' | 'cash';
  paymentStatus: string;
  settlementStatus: string;
  earnedAt: string;
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

const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [earnings, setEarnings] = useState<EarningTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settlements' | 'earnings'>('settlements');
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    type: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactionData();
  }, [activeTab, filters, currentPage]);

  const fetchTransactionData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'settlements') {
        // Fetch settlement transactions from wallet
        const response = await api.get('/wallet/provider/me');
        const wallet = response.data;
        
        // Transform settlement history to transaction format
        const settlementTransactions = wallet.settlementHistory?.map((settlement: any) => ({
          _id: settlement._id,
          settlementId: settlement.settlementId,
          amount: settlement.amount,
          transactionId: settlement.transactionId,
          status: settlement.status,
          initiatedAt: settlement.initiatedAt,
          completedAt: settlement.completedAt,
          failureReason: settlement.failureReason,
          earningsCount: settlement.earningsCount,
          type: 'settlement' as const,
          description: `Settlement for ${settlement.earningsCount} earnings`
        })) || [];
        
        setTransactions(settlementTransactions);
      } else {
        // Fetch earnings transactions
        const response = await api.get('/earnings/provider/me', {
          params: {
            ...filters,
            page: currentPage,
            limit: 20
          }
        });
        
        setEarnings(response.data.earnings);
        setTotalPages(Math.ceil(response.data.total / 20));
      }
    } catch (error: any) {
      console.error('Error fetching transaction data:', error);
      toast.error('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
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
    return method === 'online' ? (
      <CreditCardIcon className="h-4 w-4" />
    ) : (
      <BanknotesIcon className="h-4 w-4" />
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      type: ''
    });
    setCurrentPage(1);
  };

  const exportTransactions = async () => {
    try {
      const response = await api.get('/earnings/provider/me/export', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Transactions exported successfully');
    } catch (error) {
      toast.error('Failed to export transactions');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transaction history...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
              <p className="mt-2 text-gray-600">View your earnings and settlement history</p>
            </div>
            <button
              onClick={exportTransactions}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('settlements')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settlements'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Settlements
                </div>
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'earnings'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                  Individual Earnings
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'settlements' ? 'Settlement History' : 'Earnings History'}
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
          
          {showFilters && (
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">All</option>
                    {activeTab === 'settlements' ? (
                      <>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </>
                    ) : (
                      <>
                        <option value="pending">Pending</option>
                        <option value="settled">Settled</option>
                        <option value="processing">Processing</option>
                        <option value="failed">Failed</option>
                      </>
                    )}
                  </select>
                </div>
                
                {activeTab === 'earnings' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">All</option>
                      <option value="online">Online</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Transaction List */}
          <div className="divide-y divide-gray-200">
            {activeTab === 'settlements' ? (
              transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div key={transaction._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {transaction.type === 'settlement' ? (
                            <ArrowDownTrayIcon className="h-8 w-8 text-green-600" />
                          ) : (
                            <ArrowUpTrayIcon className="h-8 w-8 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.settlementId && `ID: ${transaction.settlementId}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(transaction.initiatedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <div className="flex items-center justify-end mt-1">
                          {getStatusIcon(transaction.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {transaction.failureReason && (
                      <div className="mt-4 p-3 bg-red-50 rounded-md">
                        <p className="text-sm text-red-800">
                          <strong>Failure Reason:</strong> {transaction.failureReason}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No settlements found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your settlement history will appear here once payments are processed
                  </p>
                </div>
              )
            ) : (
              earnings.length > 0 ? (
                earnings.map((earning) => (
                  <div key={earning._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {earning.service.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            Customer: {earning.customer.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(earning.earnedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          +{formatCurrency(earning.providerEarnings)}
                        </p>
                        <div className="flex items-center justify-end mt-1 space-x-2">
                          <div className="flex items-center text-sm text-gray-500">
                            {getPaymentMethodIcon(earning.paymentMethod)}
                            <span className="ml-1 capitalize">{earning.paymentMethod}</span>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(earning.settlementStatus)}`}>
                            {earning.settlementStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Amount:</span>
                        <span className="ml-2 font-medium">{formatCurrency(earning.totalAmount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Platform Fee:</span>
                        <span className="ml-2 font-medium text-red-600">-{formatCurrency(earning.platformFee)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Your Earnings:</span>
                        <span className="ml-2 font-medium text-green-600">{formatCurrency(earning.providerEarnings)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No earnings found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your individual earnings will appear here once you complete bookings
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Pagination for Earnings */}
        {activeTab === 'earnings' && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
