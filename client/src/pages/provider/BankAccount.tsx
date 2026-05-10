import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BuildingOfficeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface BankAccountDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  isVerified: boolean;
  verificationDate?: string;
}

const BankAccount: React.FC = () => {
  const navigate = useNavigate();
  const [bankAccount, setBankAccount] = useState<BankAccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: ''
  });

  useEffect(() => {
    fetchBankAccount();
  }, []);

  const fetchBankAccount = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wallet/provider/bank-account');
      
      if (response.data.success) {
        setBankAccount(response.data.bankAccount);
        setFormData(response.data.bankAccount);
      } else {
        toast.error('Failed to fetch bank account details');
      }
    } catch (error: any) {
      console.error('Error fetching bank account:', error);
      toast.error('Failed to fetch bank account details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.accountHolderName.trim()) {
      toast.error('Account holder name is required');
      return false;
    }
    
    if (!formData.accountNumber.trim()) {
      toast.error('Account number is required');
      return false;
    }
    
    if (!formData.ifscCode.trim()) {
      toast.error('IFSC code is required');
      return false;
    }
    
    if (!formData.bankName.trim()) {
      toast.error('Bank name is required');
      return false;
    }
    
    // Basic IFSC code validation (11 characters, starts with letters)
    if (!/^[A-Z]{4}0[A-Z0-9]{7}$/.test(formData.ifscCode.toUpperCase())) {
      toast.error('Invalid IFSC code format');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await api.post('/wallet/provider/bank-account', formData);
      
      if (response.data.success) {
        setBankAccount(response.data.bankAccount);
        setEditing(false);
        toast.success('Bank account details updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update bank account');
      }
    } catch (error: any) {
      console.error('Error updating bank account:', error);
      toast.error(error.response?.data?.message || 'Failed to update bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!bankAccount || bankAccount.isVerified) return;
    
    try {
      setLoading(true);
      const response = await api.post('/wallet/provider/verify-bank-account');
      
      if (response.data.success) {
        setBankAccount(prev => prev ? {
          ...prev,
          isVerified: true,
          verificationDate: new Date().toISOString()
        } : null);
        toast.success('Bank account verification initiated');
      } else {
        toast.error(response.data.message || 'Failed to initiate verification');
      }
    } catch (error: any) {
      console.error('Error verifying bank account:', error);
      toast.error('Failed to initiate verification');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading bank account details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/provider')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Bank Account Management</h1>
          <p className="mt-2 text-gray-600">Manage your bank account details for withdrawals</p>
        </div>

        {/* Bank Account Status */}
        {bankAccount && (
          <div className={`rounded-xl p-6 mb-8 border-2 ${
            bankAccount.isVerified 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {bankAccount.isVerified ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {bankAccount.isVerified ? 'Verified Bank Account' : 'Bank Account Pending Verification'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {bankAccount.isVerified 
                      ? 'Your bank account is verified and ready for withdrawals'
                      : 'Your bank account is pending verification. Please complete verification to enable withdrawals.'
                    }
                  </p>
                </div>
              </div>
              
              {bankAccount.isVerified && (
                <div className="flex items-center text-sm text-green-600">
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  <span className="font-medium">Verified</span>
                </div>
              )}
            </div>

            {!bankAccount.isVerified && (
              <div className="mt-4">
                <button
                  onClick={handleVerifyAccount}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Initiating Verification...
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                      Initiate Bank Account Verification
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bank Account Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-6 w-6 mr-2 text-blue-600" />
              Bank Account Details
            </h2>
            
            {!bankAccount || bankAccount.isVerified ? (
              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            ) : (
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-1" />
                <span className="font-medium">Account Verified</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleInputChange}
                  placeholder="Enter account holder name as per bank records"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!editing || loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your bank account number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!editing || loading}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  placeholder="Enter 11-digit IFSC code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  disabled={!editing || loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Enter bank name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!editing || loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch Name (Optional)
              </label>
              <input
                type="text"
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                placeholder="Enter branch name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!editing || loading}
              />
            </div>

            {editing && (
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-200 border border-gray-300 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                      Save Bank Account
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Important Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-blue-600" />
            Important Information
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Bank account verification is required for withdrawals</li>
            <li>• Verification process may take 2-3 business days</li>
            <li>• Ensure all details match your bank records exactly</li>
            <li>• IFSC code must be valid and belong to your bank branch</li>
            <li>• Withdrawals are processed within 24-48 hours after verification</li>
            <li>• Minimum withdrawal amount is ₹100</li>
            <li>• Bank charges may apply as per your bank's policies</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BankAccount;
