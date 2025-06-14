import React, { useEffect } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';
import { Shield, Eye, Lock, Database, Users, Globe } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      icon: <Database className="h-6 w-6" />,
      content: [
        {
          subtitle: 'Personal Information',
          text: 'We collect information you provide directly, such as your name, email address, and account preferences when you create an account or contact us.'
        },
        {
          subtitle: 'Learning Data',
          text: 'We collect data about your learning sessions, including conversation transcripts, progress metrics, and performance analytics to personalize your experience.'
        },
        {
          subtitle: 'Technical Information',
          text: 'We automatically collect certain technical information, including IP address, browser type, device information, and usage patterns to improve our service.'
        }
      ]
    },
    {
      id: 'information-use',
      title: 'How We Use Your Information',
      icon: <Eye className="h-6 w-6" />,
      content: [
        {
          subtitle: 'Service Provision',
          text: 'We use your information to provide, maintain, and improve our AI tutoring services, including personalizing your learning experience.'
        },
        {
          subtitle: 'Communication',
          text: 'We may use your contact information to send you service updates, educational content, and respond to your inquiries.'
        },
        {
          subtitle: 'Analytics and Improvement',
          text: 'We analyze usage patterns and learning data to improve our AI models and develop new features that benefit all users.'
        }
      ]
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing',
      icon: <Users className="h-6 w-6" />,
      content: [
        {
          subtitle: 'No Sale of Personal Data',
          text: 'We do not sell, rent, or trade your personal information to third parties for their marketing purposes.'
        },
        {
          subtitle: 'Service Providers',
          text: 'We may share information with trusted service providers who help us operate our platform, such as cloud hosting and payment processing services.'
        },
        {
          subtitle: 'Legal Requirements',
          text: 'We may disclose information when required by law or to protect our rights, safety, or the rights and safety of others.'
        }
      ]
    },
    {
      id: 'data-security',
      title: 'Data Security',
      icon: <Lock className="h-6 w-6" />,
      content: [
        {
          subtitle: 'Encryption',
          text: 'All data transmission is encrypted using industry-standard SSL/TLS protocols. Personal data is encrypted at rest using AES-256 encryption.'
        },
        {
          subtitle: 'Access Controls',
          text: 'We implement strict access controls and authentication measures to ensure only authorized personnel can access user data.'
        },
        {
          subtitle: 'Regular Audits',
          text: 'We conduct regular security audits and vulnerability assessments to maintain the highest security standards.'
        }
      ]
    },
    {
      id: 'user-rights',
      title: 'Your Rights and Choices',
      icon: <Shield className="h-6 w-6" />,
      content: [
        {
          subtitle: 'Access and Portability',
          text: 'You have the right to access your personal data and request a copy of your information in a portable format.'
        },
        {
          subtitle: 'Correction and Deletion',
          text: 'You can update your personal information through your account settings or request deletion of your account and associated data.'
        },
        {
          subtitle: 'Opt-out Options',
          text: 'You can opt out of non-essential communications and certain data processing activities through your account preferences.'
        }
      ]
    },
    {
      id: 'international-transfers',
      title: 'International Data Transfers',
      icon: <Globe className="h-6 w-6" />,
      content: [
        {
          subtitle: 'Global Service',
          text: 'Brainbud operates globally, and your data may be transferred to and processed in countries other than your country of residence.'
        },
        {
          subtitle: 'Adequate Protection',
          text: 'We ensure that international data transfers are protected by appropriate safeguards, including standard contractual clauses and adequacy decisions.'
        },
        {
          subtitle: 'Compliance',
          text: 'We comply with applicable data protection laws, including GDPR, CCPA, and other regional privacy regulations.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary-100 rounded-full">
              <Shield className="h-12 w-12 text-primary-600" />
            </div>
          </div>
          <h1 className={cn(commonStyles.heading.h1, "mb-6")}>
            Privacy Policy
          </h1>
          <p className={cn(commonStyles.text.lg, "mb-4")}>
            Your privacy is important to us. This policy explains how we collect, use, 
            and protect your information when you use Brainbud.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: December 14, 2024
          </p>
        </div>

        {/* Quick Overview */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <h2 className={cn(commonStyles.heading.h3, "mb-4")}>
              Privacy at a Glance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Secure by Design</h3>
                <p className="text-sm text-gray-600">End-to-end encryption and industry-leading security practices</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Transparent</h3>
                <p className="text-sm text-gray-600">Clear information about what data we collect and how we use it</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">User Control</h3>
                <p className="text-sm text-gray-600">You control your data with easy access, correction, and deletion options</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section) => (
            <Card key={section.id} className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                  {section.icon}
                </div>
                <h2 className={cn(commonStyles.heading.h2)}>
                  {section.title}
                </h2>
              </div>
              
              <div className="space-y-6">
                {section.content.map((item, index) => (
                  <div key={index}>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {item.subtitle}
                    </h3>
                    <p className={cn(commonStyles.text.base)}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Contact Information */}
        <div className="max-w-4xl mx-auto mt-16">
          <Card className="p-8 bg-gradient-to-r from-gray-50 to-gray-100">
            <h2 className={cn(commonStyles.heading.h3, "mb-4")}>
              Questions About Privacy?
            </h2>
            <p className={cn(commonStyles.text.base, "mb-6")}>
              If you have any questions about this Privacy Policy or our data practices, 
              please don't hesitate to contact us.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
                <p className="text-gray-600">privacy@brainbud.com</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Protection Officer</h3>
                <p className="text-gray-600">dpo@brainbud.com</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;