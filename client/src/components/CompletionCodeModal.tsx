import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CompletionCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceTitle: string;
  providerName: string;
  completionCode: string;
  onVerify: (bookingId: string, code: string) => void;
  loading?: boolean;
}

const CompletionCodeModal: React.FC<CompletionCodeModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  serviceTitle,
  providerName,
  completionCode,
  onVerify,
  loading = false
}) => {
  const [inputCode, setInputCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds

  // Auto-format input code (add dash after 3 characters)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length >= 4) {
      value = value.slice(0, 3) + '-' + value.slice(3, 6);
    }
    setInputCode(value);
  };

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          toast.error('Code expired. Please request a new code.');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeRemaining, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.length !== 7) {
      toast.error('Please enter a valid 6-character code');
      return;
    }
    onVerify(bookingId, inputCode);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(completionCode);
    toast.success('Code copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
              <h3 className="text-xl font-bold text-white">Service Completion Code</h3>
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

          {/* Completion Code Display */}
          <div className="mb-6 text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">Share this code with your service provider:</p>
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-4">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-3xl font-bold text-green-800 tracking-wider font-mono">
                  {completionCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                  title="Copy code"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center mt-3 text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-1 text-orange-500" />
              <span className={`font-medium ${timeRemaining <= 60 ? 'text-red-600' : 'text-gray-700'}`}>
                Expires in {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Provider Verification Section */}
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-amber-900 mb-2">
              ⚡ Provider Action Required
            </p>
            <p className="text-xs text-amber-700">
              Your service provider will enter this code to confirm completion. 
              Keep this window open until they finish verification.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
            <button
              onClick={handleCopyCode}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionCodeModal;
