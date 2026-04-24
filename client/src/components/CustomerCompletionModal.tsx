import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ShieldCheckIcon, ExclamationTriangleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../services/api';

interface CustomerCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceTitle: string;
  providerName: string;
}

const CustomerCompletionModal: React.FC<CustomerCompletionModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  serviceTitle,
  providerName
}) => {
  const [completionCode, setCompletionCode] = useState<string>('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeGenerated, setCodeGenerated] = useState(false);

  // Listen for completion code from socket
  useEffect(() => {
    const handleCompletionCodeGenerated = (data: any) => {
      if (data.bookingId === bookingId) {
        console.log('Completion code received for this booking:', data.completionCode);
        setCompletionCode(data.completionCode);
        setCodeGenerated(true);
        toast.success(`Completion code received: ${data.completionCode}`, {
          duration: 8000,
          icon: '🔢'
        });
      }
    };

    // Register socket listener
    if (isOpen) {
      import('../services/socketService').then(({ default: socketService }) => {
        socketService.onCompletionCodeGenerated(handleCompletionCodeGenerated);
      });
    }

    return () => {
      // Cleanup listener
      import('../services/socketService').then(({ default: socketService }) => {
        socketService.off('completion_code_generated', handleCompletionCodeGenerated);
      });
    };
  }, [isOpen, bookingId]);

  // Auto-format input code (add dash after 3 characters)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length >= 4) {
      value = value.slice(0, 3) + '-' + value.slice(3, 6);
    }
    setInputCode(value);
  };

  const handleCopyCode = () => {
    if (completionCode) {
      navigator.clipboard.writeText(completionCode);
      toast.success('Code copied to clipboard!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.length !== 7) {
      toast.error('Please enter a valid 6-character code (format: XXX-XXX)');
      return;
    }

    try {
      setLoading(true);
      const response = await bookingsAPI.verifyCompletionCode(bookingId, { completionCode: inputCode });
      
      if (response.message) {
        toast.success(response.message);
        onClose();
        // Refresh the page or trigger a reload to show completed status
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Code verification error:', error);
      toast.error(error.response?.data?.message || 'Failed to verify completion code');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
              <h3 className="text-xl font-bold text-white">Service Completion</h3>
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
            <p className="text-xs text-blue-600 mt-1">Provider: {providerName}</p>
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
                  <li>Provider will generate a 6-digit completion code</li>
                  <li>You will receive the code here automatically</li>
                  <li>Share the code with provider to verify service completion</li>
                  <li>Both parties confirm completion with the same code</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Completion Code Display */}
          {codeGenerated && completionCode && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-green-900">Completion Code</p>
                <button
                  onClick={handleCopyCode}
                  className="text-green-600 hover:text-green-700 p-1 hover:bg-green-100 rounded transition-colors"
                  title="Copy code"
                >
                  <ClipboardDocumentIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-green-800 tracking-wider">
                  {completionCode}
                </div>
                <p className="text-xs text-green-600 mt-2">Share this code with your provider</p>
              </div>
            </div>
          )}

          {/* Waiting for Code */}
          {!codeGenerated && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Waiting for completion code...</p>
                <p className="text-xs text-gray-500 mt-1">Provider will generate the code shortly</p>
              </div>
            </div>
          )}

          {/* Code Verification Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Completion Code (from provider)
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

export default CustomerCompletionModal;
