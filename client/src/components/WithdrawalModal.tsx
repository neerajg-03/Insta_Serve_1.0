import React, { useState } from 'react';
import { 
  XMarkIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../services/api';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess: () => void;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ 
  isOpen, 
  onClose, 
  availableBalance, 
  onSuccess 
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const validateWithdrawal = () => {
    const withdrawalAmount = parseFloat(amount);
    
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return false;
    }
    
    if (withdrawalAmount < 100) {
      toast.error('Minimum withdrawal amount is ₹100');
      return false;
    }
    
    if (withdrawalAmount > availableBalance) {
      toast.error('Insufficient balance');
      return false;
    }
    
    if (!bankAccount.accountHolderName || !bankAccount.accountNumber || !bankAccount.ifscCode || !bankAccount.bankName) {
      toast.error('Please complete all bank account details');
      return false;
    }
    
    return true;
  };

  const handleWithdrawal = async () => {
    if (!validateWithdrawal()) return;
    
    setLoading(true);
    
    try {
      const response = await api.post('/wallet/withdraw', {
        amount: parseFloat(amount),
        bankAccount: {
          accountHolderName: bankAccount.accountHolderName,
          accountNumber: bankAccount.accountNumber,
          ifscCode: bankAccount.ifscCode,
          bankName: bankAccount.bankName
        }
      });
      
      if (response.data.success) {
        toast.success('Withdrawal request submitted successfully');
        setAmount('');
        setBankAccount({
          accountHolderName: '',
          accountNumber: '',
          ifscCode: '',
          bankName: ''
        });
        onSuccess();
        onClose();
      } else {
        toast.error(response.data.message || 'Withdrawal request failed');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.response?.data?.message || 'Withdrawal request failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <BanknotesIcon className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Withdraw Earnings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Available Balance */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Available Balance</p>
                <p className="text-2xl font-bold text-green-900">₹{availableBalance.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-600">Minimum Withdrawal</p>
                <p className="text-sm font-semibold text-green-800">₹100</p>
              </div>
            </div>
          </div>

          {/* Withdrawal Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-lg">₹</span>
              </div>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                disabled={loading}
              />
            </div>
            {amount && parseFloat(amount) > availableBalance && (
              <p className="text-sm text-red-600 mt-1">
                <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                Amount exceeds available balance
              </p>
            )}
          </div>

          {/* Bank Account Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
              Bank Account Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={bankAccount.accountHolderName}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  placeholder="Enter account holder name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={bankAccount.accountNumber}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Enter account number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={bankAccount.ifscCode}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, ifscCode: e.target.value }))}
                  placeholder="Enter IFSC code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankAccount.bankName}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Enter bank name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-blue-600" />
              Important Information
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Withdrawals are processed within 24-48 hours</li>
              <li>• Minimum withdrawal amount is ₹100</li>
              <li>• Bank account details must match your registered account</li>
              <li>• Processing fees may apply as per bank charges</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 border border-gray-300 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleWithdrawal}
            disabled={loading || !amount || parseFloat(amount) < 100 || parseFloat(amount) > availableBalance}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white border-t-transparent border-r-transparent mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <BanknotesIcon className="h-4 w-4 mr-2" />
                Request Withdrawal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalModal;
