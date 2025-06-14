import React, { useEffect } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';
import { FileText, Scale, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export const TermsPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: <CheckCircle className="h-6 w-6" />,
      content: 'By accessing and using Brainbud, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'
    },
    {
      id: 'service-description',
      title: 'Service Description',
      icon: <Info className="h-6 w-6" />,
      content: 'Brainbud is an AI-powered educational platform that provides personalized tutoring services through conversational interfaces and video interactions. Our service includes access to AI tutors, learning analytics, and educational content across various subjects.'
    },
    {
      id: 'user-accounts',
      title: 'User Accounts',
      icon: <FileText className="h-6 w-6" />,
      content: 'You must create an account to use our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account.'
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable Use Policy',
      icon: <Scale className="h-6 w-6" />,
      content: 'You agree to use Brainbud only for lawful purposes and in accordance with these Terms. You may not use our service to engage in any activity that could harm, disable, or impair our service or interfere with any other party\'s use of our service.'
    },
    {
      id: 'prohibited-activities',
      title: 'Prohibited Activities',
      icon: <XCircle className="h-6 w-6" />,
      content: 'You may not: (a) attempt to gain unauthorized access to our systems, (b) use our service for any illegal or unauthorized purpose, (c) transmit viruses or malicious code, (d) harass or abuse other users, or (e) attempt to reverse engineer our AI technology.'
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      icon: <FileText className="h-6 w-6" />,
      content: 'All content, features, and functionality of Brainbud are owned by us and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.'
    },
    {
      id: 'payment-terms',
      title: 'Payment and Billing',
      icon: <Scale className="h-6 w-6" />,
      content: 'Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We reserve the right to change our pricing with 30 days notice to existing subscribers.'
    },
    {
      id: 'privacy-data',
      title: 'Privacy and Data Use',
      icon: <Info className="h-6 w-6" />,
      content: 'Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy. By using our service, you consent to the collection and use of your information as described in our Privacy Policy.'
    },
    {
      id: 'disclaimers',
      title: 'Disclaimers and Limitations',
      icon: <AlertTriangle className="h-6 w-6" />,
      content: 'Brainbud is provided "as is" without warranties of any kind. We do not guarantee that our service will be uninterrupted or error-free. Our AI tutors are educational tools and should not replace professional educational advice when needed.'
    },
    {
      id: 'termination',
      title: 'Termination',
      icon: <XCircle className="h-6 w-6" />,
      content: 'We may terminate or suspend your account and access to our service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.'
    }
  ];

  const importantNotices = [
    {
      type: 'warning',
      title: 'Educational Purpose',
      content: 'Brainbud is designed for educational purposes. While our AI tutors are sophisticated, they should supplement, not replace, traditional education and professional academic guidance.'
    },
    {
      type: 'info',
      title: 'Age Requirements',
      content: 'Users under 13 years old must have parental consent to use our service. Users between 13-18 should have parental guidance when using our platform.'
    },
    {
      type: 'success',
      title: 'Data Portability',
      content: 'You can export your learning data and conversation history at any time through your account settings. We believe your educational data belongs to you.'
    }
  ];

  const getNoticeStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getNoticeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary-100 rounded-full">
              <Scale className="h-12 w-12 text-primary-600" />
            </div>
          </div>
          <h1 className={cn(commonStyles.heading.h1, "mb-6")}>
            Terms of Service
          </h1>
          <p className={cn(commonStyles.text.lg, "mb-4")}>
            These terms govern your use of Brainbud and describe the rights and responsibilities 
            that apply to both you and us.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: December 14, 2024 | Effective Date: December 14, 2024
          </p>
        </div>

        {/* Important Notices */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className={cn(commonStyles.heading.h3, "mb-6")}>
            Important Notices
          </h2>
          <div className="space-y-4">
            {importantNotices.map((notice, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-lg border",
                  getNoticeStyle(notice.type)
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNoticeIcon(notice.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {notice.title}
                    </h3>
                    <p className="text-gray-700 text-sm">
                      {notice.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <Card key={section.id} className="p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                    {section.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className={cn(commonStyles.heading.h3, "mb-4")}>
                    {index + 1}. {section.title}
                  </h2>
                  <p className={cn(commonStyles.text.base)}>
                    {section.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Terms */}
        <div className="max-w-4xl mx-auto mt-16">
          <Card className="p-8">
            <h2 className={cn(commonStyles.heading.h3, "mb-6")}>
              Additional Important Terms
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Governing Law</h3>
                <p className={cn(commonStyles.text.base)}>
                  These Terms are governed by the laws of the State of California, United States, 
                  without regard to conflict of law principles.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Changes to Terms</h3>
                <p className={cn(commonStyles.text.base)}>
                  We reserve the right to modify these Terms at any time. We will notify users of 
                  significant changes via email or through our service. Continued use of our service 
                  after changes constitutes acceptance of the new Terms.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Severability</h3>
                <p className={cn(commonStyles.text.base)}>
                  If any provision of these Terms is found to be unenforceable, the remaining 
                  provisions will continue to be valid and enforceable.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                <p className={cn(commonStyles.text.base)}>
                  If you have questions about these Terms, please contact us at legal@brainbud.com 
                  or through our contact page.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Agreement Confirmation */}
        <div className="max-w-4xl mx-auto mt-16">
          <Card className="p-8 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
                Agreement Acknowledgment
              </h3>
              <p className={cn(commonStyles.text.base)}>
                By using Brainbud, you acknowledge that you have read, understood, and agree to be 
                bound by these Terms of Service and our Privacy Policy.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;