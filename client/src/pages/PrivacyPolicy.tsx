import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const privacySections = [
    {
      id: 'intro',
      title: 'Introduction',
      content: `Welcome to InstaServe. Your privacy is important to us. This Privacy Policy explains how InstaServe collects, uses, stores, and protects your information when you use our website, mobile application, and related services.` 
    },
    {
      id: 'information-collected',
      title: '1. Information We Collect',
      content: `Information You Provide

When you create an account or use our services, we may collect:

• Full name
• Email address
• Mobile phone number
• Profile photo (optional)
• Address and location details
• Service booking information
• Communication and support messages

Service Provider Information

For service providers, we may additionally collect:

• Business or professional information
• Identity verification documents
• Verification photographs
• Bank account or payment details (where applicable)
• Service offerings and pricing information

Automatically Collected Information

We may collect:

• Device information
• IP address
• App usage data
• Browser information
• Location information (when permitted by you)`
    },
    {
      id: 'how-we-use',
      title: '2. How We Use Your Information',
      content: `We use your information to:

• Create and manage user accounts
• Process service bookings
• Connect customers with service providers
• Verify provider identities
• Provide customer support
• Improve our services and user experience
• Send booking updates and important notifications
• Prevent fraud, abuse, and unauthorized activities
• Comply with legal obligations`
    },
    {
      id: 'location',
      title: '3. Location Information',
      content: `InstaServe may collect and use location information to:

• Display nearby service providers
• Improve service availability
• Facilitate booking and service delivery

You may disable location access through your device settings; however, some features may not function properly.`
    },
    {
      id: 'sharing',
      title: '4. Sharing of Information',
      content: `We do not sell your personal information.

We may share information:

• Between customers and service providers to facilitate bookings
• With trusted service providers who help operate our platform
• With payment processors for transaction processing
• When required by law or legal process
• To protect the safety, rights, and security of users and InstaServe`
    },
    {
      id: 'security',
      title: '5. Data Security',
      content: `We implement reasonable security measures to protect your information from unauthorized access, loss, misuse, or disclosure. However, no internet-based service can guarantee absolute security.` 
    },
    {
      id: 'retention',
      title: '6. Data Retention',
      content: `We retain information for as long as necessary to:

• Provide services
• Resolve disputes
• Enforce agreements
• Comply with legal obligations

When information is no longer required, we take reasonable steps to delete or anonymize it.`
    },
    {
      id: 'third-party',
      title: '7. Third-Party Services',
      content: `InstaServe may use third-party services for:

• Authentication
• Cloud storage
• Analytics
• Push notifications
• Payment processing

These providers may have their own privacy policies governing the use of your information.`
    },
    {
      id: 'children',
      title: '8. Children\'s Privacy',
      content: `InstaServe is not intended for children under the age of 13. We do not knowingly collect personal information from children.` 
    },
    {
      id: 'rights',
      title: '9. Your Rights',
      content: `Depending on applicable laws, you may have the right to:

• Access your personal information
• Correct inaccurate information
• Request deletion of your account and data
• Withdraw consent where applicable

To exercise these rights, please contact us using the details below.`
    },
    {
      id: 'deletion',
      title: '10. Account Deletion',
      content: `Users may request account deletion by contacting us through the support channels provided in the application or by emailing us.

Upon receiving a valid request, we will take reasonable steps to delete or anonymize personal information, subject to legal and operational requirements.`
    },
    {
      id: 'changes',
      title: '11. Changes to This Privacy Policy',
      content: `We may update this Privacy Policy from time to time. Updated versions will be posted on this page with a revised "Last Updated" date.` 
    },
    {
      id: 'contact',
      title: '12. Contact Us',
      content: `If you have questions regarding this Privacy Policy, please contact us:

InstaServe Support

Email: support@instaserve.in

We will make reasonable efforts to respond to privacy-related inquiries in a timely manner.`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="mt-2 text-primary-100">Last Updated: June 15, 2026</p>
          </div>

          {/* Introduction */}
          <div className="px-6 py-6 border-b border-gray-200">
            <p className="text-gray-700 leading-relaxed">
              Welcome to InstaServe. Your privacy is important to us. This Privacy Policy explains how InstaServe collects, uses, stores, and protects your information when you use our website, mobile application, and related services.
            </p>
          </div>

          {/* Privacy Sections */}
          <div className="px-6 py-4 space-y-4">
            {privacySections.map((section) => (
              <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold text-gray-800 text-left">{section.title}</span>
                  {expandedSections[section.id] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedSections[section.id] && (
                  <div className="px-4 py-4 bg-white">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{section.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This Privacy Policy is effective as of June 15, 2026.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
