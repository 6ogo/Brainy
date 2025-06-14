import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { cn, commonStyles } from '../styles/utils';
import { 
  Search, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Book,
  CreditCard,
  Settings,
  Shield,
  Users,
  Zap
} from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const FAQPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const categories = [
    { id: 'all', name: 'All Questions', icon: <HelpCircle className="h-5 w-5" /> },
    { id: 'getting-started', name: 'Getting Started', icon: <Book className="h-5 w-5" /> },
    { id: 'billing', name: 'Billing & Plans', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'features', name: 'Features', icon: <Zap className="h-5 w-5" /> },
    { id: 'technical', name: 'Technical', icon: <Settings className="h-5 w-5" /> },
    { id: 'privacy', name: 'Privacy & Security', icon: <Shield className="h-5 w-5" /> },
    { id: 'account', name: 'Account Management', icon: <Users className="h-5 w-5" /> }
  ];

  const faqs: FAQ[] = [
    // Getting Started
    {
      id: '1',
      question: 'How do I get started with Brainbud?',
      answer: 'Getting started is easy! Simply sign up for a free account, complete the onboarding process to set your learning preferences, choose your subjects, and start your first conversation with an AI tutor. The free plan gives you 30 minutes daily to explore our platform.',
      category: 'getting-started'
    },
    {
      id: '2',
      question: 'What subjects does Brainbud support?',
      answer: 'Brainbud supports a wide range of subjects including Mathematics, Science (Physics, Chemistry, Biology), English Language Arts, History, World Languages, and Test Preparation (SAT, ACT, GRE, etc.). Free users have access to Math and English, while premium subscribers get access to all subjects.',
      category: 'getting-started'
    },
    {
      id: '3',
      question: 'How does the AI tutoring work?',
      answer: 'Our AI tutors use advanced natural language processing to understand your questions and provide personalized explanations. They adapt to your learning style, remember your progress, and can explain concepts in multiple ways until you understand. You can interact through text or voice conversations.',
      category: 'getting-started'
    },
    {
      id: '4',
      question: 'Can I use Brainbud on my mobile device?',
      answer: 'Yes! Brainbud works on all devices including smartphones, tablets, and computers. Our web app is optimized for mobile use, and we also offer a progressive web app (PWA) that you can install on your device for a native app-like experience.',
      category: 'getting-started'
    },

    // Billing & Plans
    {
      id: '5',
      question: 'What are the different subscription plans?',
      answer: 'We offer three plans: Free (30 min daily, Math & English), Premium ($19.99/month with 4 hours daily, all subjects, video calls), and Ultimate ($69/month with unlimited time, extended video calls, and early access to new features).',
      category: 'billing'
    },
    {
      id: '6',
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time through your account settings or the billing portal. Your subscription will remain active until the end of your current billing period, and you won\'t be charged for the next cycle.',
      category: 'billing'
    },
    {
      id: '7',
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all paid subscriptions. If you\'re not satisfied within the first 30 days, contact our support team for a full refund. Refunds for subsequent months are handled on a case-by-case basis.',
      category: 'billing'
    },
    {
      id: '8',
      question: 'How do coupon codes work?',
      answer: 'You can apply coupon codes during the checkout process. Simply enter your code in the "Promotion Code" field when subscribing. Codes may offer discounts on your first month, first year, or ongoing subscription depending on the specific promotion.',
      category: 'billing'
    },

    // Features
    {
      id: '9',
      question: 'What\'s the difference between text and video tutoring?',
      answer: 'Text tutoring allows for detailed written explanations and is great for step-by-step problem solving. Video tutoring includes visual demonstrations, facial expressions, and real-time interaction, making it ideal for complex concepts that benefit from visual learning.',
      category: 'features'
    },
    {
      id: '10',
      question: 'How accurate are the AI tutors?',
      answer: 'Our AI tutors are highly accurate and continuously improving. They\'re trained on vast educational datasets and regularly updated. However, they should supplement, not replace, traditional education. For critical academic decisions, we recommend consulting with human educators.',
      category: 'features'
    },
    {
      id: '11',
      question: 'Can I download my conversation transcripts?',
      answer: 'Yes! Premium and Ultimate subscribers can download their conversation transcripts in PDF format. This feature is great for reviewing what you\'ve learned and sharing progress with teachers or parents.',
      category: 'features'
    },
    {
      id: '12',
      question: 'How does the progress tracking work?',
      answer: 'Brainbud tracks your learning progress through conversation analysis, time spent studying, topics covered, and performance metrics. You can view detailed analytics including learning streaks, subject mastery, and personalized insights in your dashboard.',
      category: 'features'
    },

    // Technical
    {
      id: '13',
      question: 'What browsers are supported?',
      answer: 'Brainbud works on all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of your preferred browser. Voice features require microphone permissions.',
      category: 'technical'
    },
    {
      id: '14',
      question: 'Why isn\'t voice recognition working?',
      answer: 'Voice recognition requires microphone permissions. Check that you\'ve allowed microphone access in your browser settings. Also ensure you\'re in a quiet environment and speaking clearly. If issues persist, try refreshing the page or switching browsers.',
      category: 'technical'
    },
    {
      id: '15',
      question: 'Can I use Brainbud offline?',
      answer: 'Brainbud requires an internet connection to function as our AI tutors operate in the cloud. However, you can download conversation transcripts and study materials for offline review if you have a premium subscription.',
      category: 'technical'
    },

    // Privacy & Security
    {
      id: '16',
      question: 'How is my data protected?',
      answer: 'We use industry-standard encryption (SSL/TLS) for data transmission and AES-256 encryption for data storage. We comply with GDPR, CCPA, and other privacy regulations. Your learning data is never sold to third parties.',
      category: 'privacy'
    },
    {
      id: '17',
      question: 'Who can see my conversations?',
      answer: 'Your conversations are private and only accessible to you. Our staff may access anonymized data for service improvement, but personal conversations are never reviewed without your explicit consent, except as required by law.',
      category: 'privacy'
    },
    {
      id: '18',
      question: 'Can I delete my account and data?',
      answer: 'Yes, you can delete your account and all associated data at any time through your account settings. This action is permanent and cannot be undone. You can also export your data before deletion if needed.',
      category: 'privacy'
    },

    // Account Management
    {
      id: '19',
      question: 'How do I change my password?',
      answer: 'You can change your password in your account settings under the "Security" section. For security, you\'ll need to enter your current password before setting a new one. We recommend using a strong, unique password.',
      category: 'account'
    },
    {
      id: '20',
      question: 'Can I have multiple accounts?',
      answer: 'Each person should have only one Brainbud account. However, we offer family plans for households with multiple learners. Contact our support team if you need to merge accounts or set up family access.',
      category: 'account'
    },
    {
      id: '21',
      question: 'How do I contact customer support?',
      answer: 'You can reach our support team through the contact form on our website, by emailing support@brainbud.com, or through the live chat feature (available to premium subscribers). We typically respond within 24 hours.',
      category: 'account'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary-100 rounded-full">
              <HelpCircle className="h-12 w-12 text-primary-600" />
            </div>
          </div>
          <h1 className={cn(commonStyles.heading.h1, "mb-6")}>
            Frequently Asked Questions
          </h1>
          <p className={cn(commonStyles.text.lg)}>
            Find answers to common questions about Brainbud. Can't find what you're looking for? 
            Contact our support team for personalized help.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Categories and Search */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-8">
                {/* Search */}
                <div className="mb-6">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search FAQs
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="search"
                      type="text"
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors",
                          selectedCategory === category.id
                            ? "bg-primary-100 text-primary-700 font-medium"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {category.icon}
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results Count */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </Card>
            </div>

            {/* FAQ Content */}
            <div className="lg:col-span-3">
              {filteredFAQs.length === 0 ? (
                <Card className="p-8 text-center">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className={cn(commonStyles.heading.h3, "mb-2")}>
                    No questions found
                  </h3>
                  <p className={cn(commonStyles.text.base, "mb-4")}>
                    Try adjusting your search terms or selecting a different category.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => {
                    const isExpanded = expandedItems.includes(faq.id);
                    return (
                      <Card key={faq.id} className="overflow-hidden">
                        <button
                          onClick={() => toggleExpanded(faq.id)}
                          className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 pr-4">
                              {faq.question}
                            </h3>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-6 pb-4 border-t border-gray-100">
                            <p className={cn(commonStyles.text.base, "pt-4")}>
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="max-w-4xl mx-auto mt-16">
          <Card className="p-8 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200">
            <div className="text-center">
              <h2 className={cn(commonStyles.heading.h3, "mb-4")}>
                Still have questions?
              </h2>
              <p className={cn(commonStyles.text.base, "mb-6")}>
                Our support team is here to help! Get in touch and we'll respond within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  onClick={() => window.location.href = '/contact'}
                >
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = 'mailto:support@brainbud.com'}
                >
                  Email Us
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FAQPage;