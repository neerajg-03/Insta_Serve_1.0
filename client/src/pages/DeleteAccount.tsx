import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const DeleteAccount: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'how-to-delete': true,
    'data-deleted': false,
    'data-retained': false,
    'retention': false
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">Delete Account</h1>
            <p className="mt-2 text-red-100">Last Updated: June 15, 2026</p>
          </div>

          {/* Warning Banner */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> Account deletion is permanent. Once deleted, your account cannot be recovered and all associated data will be removed.
                </p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="px-6 py-6 space-y-4">
            {/* How to Delete Account */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('how-to-delete')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <span className="font-semibold text-gray-800 text-left flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  How to Delete Your Account
                </span>
                {expandedSections['how-to-delete'] ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {expandedSections['how-to-delete'] && (
                <div className="px-4 py-4 bg-white">
                  <p className="text-gray-700 mb-4">You can request account deletion through the following methods:</p>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Method 1: Through the App</h4>
                      <ol className="list-decimal list-inside space-y-2 text-blue-800">
                        <li>Log in to your InstaServe account</li>
                        <li>Go to your Profile</li>
                        <li>Navigate to Settings</li>
                        <li>Select "Delete Account"</li>
                        <li>Confirm your deletion request</li>
                      </ol>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">Method 2: Email Request</h4>
                      <p className="text-purple-800 mb-2">Send an email to:</p>
                      <p className="text-purple-800 font-mono bg-purple-100 p-2 rounded">
                        support@instaserve.in
                      </p>
                      <p className="text-purple-800 mt-2">Include your registered email address and request account deletion.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Data That Will Be Deleted */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('data-deleted')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <span className="font-semibold text-gray-800 text-left flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Data That Will Be Deleted
                </span>
                {expandedSections['data-deleted'] ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {expandedSections['data-deleted'] && (
                <div className="px-4 py-4 bg-white">
                  <p className="text-gray-700 mb-4">The following data will be permanently deleted:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>Full name and profile information</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>Email address</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>Phone number</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>Address and location details</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>Booking history</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>Profile photos and uploaded documents</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>Communication history</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>Wallet balance (if any)</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Data That May Be Retained */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('data-retained')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <span className="font-semibold text-gray-800 text-left flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange-600" />
                  Data That May Be Retained
                </span>
                {expandedSections['data-retained'] ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {expandedSections['data-retained'] && (
                <div className="px-4 py-4 bg-white">
                  <p className="text-gray-700 mb-4">Certain data may be retained for legal, accounting, or security purposes:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>Transaction records for legal and accounting compliance</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>Dispute records and resolution documentation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>Fraud prevention and security logs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>Data required by applicable laws and regulations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>Anonymized data for analytics and service improvement</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Retention Period */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('retention')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <span className="font-semibold text-gray-800 text-left flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange-600" />
                  Data Retention Period
                </span>
                {expandedSections['retention'] ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {expandedSections['retention'] && (
                <div className="px-4 py-4 bg-white">
                  <p className="text-gray-700 mb-4">Data retention timeline:</p>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2 font-semibold">✓</span>
                      <div>
                        <span className="font-semibold">Personal account data:</span> Deleted within 30 days of request
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-600 mr-2 font-semibold">⏱</span>
                      <div>
                        <span className="font-semibold">Transaction records:</span> Retained for up to 7 years to comply with tax and financial regulations
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-600 mr-2 font-semibold">⏱</span>
                      <div>
                        <span className="font-semibold">Dispute records:</span> Retained for up to 3 years after resolution
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-600 mr-2 font-semibold">⏱</span>
                      <div>
                        <span className="font-semibold">Security logs:</span> Retained for up to 1 year for security purposes
                      </div>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
            <p className="text-gray-700 mb-2">If you have questions about account deletion, please contact us:</p>
            <p className="text-gray-700">
              <strong>Email:</strong>{' '}
              <a href="mailto:support@instaserve.in" className="text-primary-600 hover:underline">
                support@instaserve.in
              </a>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This Account Deletion Policy is effective as of June 15, 2026.</p>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
