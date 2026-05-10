import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ProviderCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceTitle: string;
  customerName: string;
  onVerify: (bookingId: string, code: string) => void;
  loading?: boolean;
}

const ProviderCompletionModal: React.FC<ProviderCompletionModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  serviceTitle,
  customerName,
  onVerify,
  loading = false
}) => {
  const [inputCode, setInputCode] = useState('');

  // Auto-format input code (add dash after 3 characters)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length >= 4) {
      value = value.slice(0, 3) + '-' + value.slice(3, 6);
    }
    setInputCode(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.length !== 7) {
      toast.error('Please enter a valid 6-character code (format: XXX-XXX)');
      return;
    }
    onVerify(bookingId, inputCode);
  };

  const handleGenerateCode = () => {
    onVerify(bookingId, ''); // Empty code indicates generate new code
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
              <h3 className="text-xl font-bold text-white">Complete Service</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Service Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-1">Service Details</p>
            <p className="text-sm text-blue-700">{serviceTitle}</p>
            <p className="text-xs text-blue-600 mt-1">Customer: {customerName}</p>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900 mb-2">
                  Service Completion Process
                </p>
                <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                  <li>Click "Generate Code" to create a 6-digit completion code</li>
                  <li>Share the code with your customer</li>
                  <li>Customer will provide the code for verification</li>
                  <li>Enter the code below to complete the service</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Code Generation Section */}
          <div className="mb-6 text-center">
            <button
              onClick={handleGenerateCode}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Generate Completion Code
                </>
              )}
            </button>
          </div>

          {/* Code Verification Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Completion Code (from customer)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputCode}
                  onChange={handleInputChange}
                  placeholder="XXX-XXX"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg font-mono font-bold tracking-wider"
                  maxLength={7}
                />
                {inputCode.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-gray-400 text-sm">Enter 6-digit code</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || inputCode.length !== 7}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Verify & Complete
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProviderCompletionModal;
