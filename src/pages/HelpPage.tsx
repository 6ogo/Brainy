import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { cn, commonStyles } from '../styles/utils';
import { 
  HelpCircle, 
  Book, 
  MessageSquare, 
  Mail, 
  Search,
  ChevronRight,
  Video,
  Settings,
  Clock,
  Users
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendMessage = () => {
    const { name, email, subject, message, inquiryType } = formData;
    
    const emailBody = `Name: ${name}
Email: ${email}
Inquiry Type: ${inquiryType}
Subject: ${subject}

Message:
${message}`;

    const mailtoLink = `mailto:info@learny.se?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
  };

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book className="h-6 w-6" />,
      description: 'Learn the basics of using Brainbud',
      articles: [
        'How to create your first account',
        'Setting up your learning preferences',
        'Choosing the right AI tutor',
        'Understanding subscription plans'
      ]
    },
    {
      id: 'using-features',
      title: 'Using Features',
      icon: <Settings className="h-6 w-6" />,
      description: 'Master all of Brainbud\'s capabilities',
      articles: [
        'Starting a conversation with your AI tutor',
        'Using voice features effectively',
        'Accessing video tutoring sessions',
        'Tracking your learning progress'
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <HelpCircle className="h-6 w-6" />,
      description: 'Solve common technical issues',
      articles: [
        'Voice recognition not working',
        'Video call connection problems',
        'Login and account access issues',
        'Browser compatibility problems'
      ]
    },
    {
      id: 'account-billing',
      title: 'Account & Billing',
      icon: <Users className="h-6 w-6" />,
      description: 'Manage your account and subscription',
      articles: [
        'Updating your payment method',
        'Changing your subscription plan',
        'Downloading conversation transcripts',
        'Deleting your account'
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Live Chat Support',
      description: 'Get instant help from our support team',
      icon: <MessageSquare className="h-6 w-6" />,
      action: 'Coming Soon',
      available: 'Feature in development'
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      icon: <Video className="h-6 w-6" />,
      action: 'Coming Soon',
      available: 'Feature in development'
    },
    {
      title: 'Email Support',
      description: 'Send us a detailed message',
      icon: <Mail className="h-6 w-6" />,
      action: 'Send Email',
      available: 'Response within 24 hours',
      onClick: () => window.location.href = 'mailto:info@learny.se'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our team',
      icon: <Clock className="h-6 w-6" />,
      action: 'Coming Soon',
      available: 'Feature in development'
    }
  ];

  const popularArticles = [
    {
      title: 'How to get the most out of your AI tutor',
      category: 'Getting Started',
      readTime: '5 min read',
      views: '12.5k views'
    },
    {
      title: 'Troubleshooting voice recognition issues',
      category: 'Troubleshooting',
      readTime: '3 min read',
      views: '8.2k views'
    },
    {
      title: 'Understanding your learning analytics',
      category: 'Using Features',
      readTime: '7 min read',
      views: '6.8k views'
    },
    {
      title: 'Upgrading your subscription plan',
      category: 'Account & Billing',
      readTime: '4 min read',
      views: '5.9k views'
    },
    {
      title: 'Setting up video tutoring sessions',
      category: 'Using Features',
      readTime: '6 min read',
      views: '4.7k views'
    }
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.articles.some(article => article.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Subscriptions' },
    { value: 'partnership', label: 'Partnership Opportunities' },
    { value: 'enterprise', label: 'Enterprise Solutions' },
    { value: 'press', label: 'Press & Media' }
  ];

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
            How can we help you?
          </h1>
          <p className={cn(commonStyles.text.lg, "mb-8")}>
            Find answers, get support, and learn how to make the most of Brainbud
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, features, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Quick Actions */}
          <div className="mb-16">
            <h2 className={cn(commonStyles.heading.h2, "mb-8 text-center")}>
              Get Support
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card key={index} variant="hover" className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary-100 rounded-full text-primary-600">
                      {action.icon}
                    </div>
                  </div>
                  <h3 className={cn(commonStyles.heading.h4, "mb-2")}>
                    {action.title}
                  </h3>
                  <p className={cn(commonStyles.text.sm, "mb-4")}>
                    {action.description}
                  </p>
                  <Button
                    variant={action.onClick ? "primary" : "outline"}
                    size="sm"
                    className="w-full mb-3"
                    onClick={action.onClick}
                    disabled={!action.onClick}
                  >
                    {action.action}
                  </Button>
                  <p className="text-xs text-gray-500">{action.available}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Help Categories */}
            <div className="lg:col-span-2">
              <h2 className={cn(commonStyles.heading.h2, "mb-8")}>
                Browse Help Topics
              </h2>
              
              {filteredCategories.length === 0 ? (
                <Card className="p-8 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className={cn(commonStyles.heading.h3, "mb-2")}>
                    No results found
                  </h3>
                  <p className={cn(commonStyles.text.base)}>
                    Try adjusting your search terms or browse our categories below.
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredCategories.map((category) => (
                    <Card key={category.id} variant="hover" className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary-100 rounded-lg text-primary-600 flex-shrink-0">
                          {category.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={cn(commonStyles.heading.h3, "mb-2")}>
                            {category.title}
                          </h3>
                          <p className={cn(commonStyles.text.base, "mb-4")}>
                            {category.description}
                          </p>
                          <div className="space-y-2">
                            {category.articles.map((article, index) => (
                              <button
                                key={index}
                                className="flex items-center justify-between w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-sm text-gray-700">{article}</span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Popular Articles */}
              <Card className="p-6 mb-8">
                <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
                  Popular Articles
                </h3>
                <div className="space-y-4">
                  {popularArticles.map((article, index) => (
                    <button
                      key={index}
                      className="block w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 mb-1 text-sm">
                        {article.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{article.category}</span>
                        <span>{article.readTime}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{article.views}</p>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Contact Info */}
              <Card className="p-6">
                <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
                  Get in Touch
                </h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">Email Support</p>
                      <p className="text-sm text-gray-600">info@learny.se</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => window.location.href = 'mailto:info@learny.se'}
                  >
                    Contact Support
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-4xl mx-auto mt-16">
          <Card className="p-8">
            <h2 className={cn(commonStyles.heading.h3, "mb-6")}>
              Send us a Message
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-1">
                  Inquiry Type
                </label>
                <select
                  id="inquiryType"
                  name="inquiryType"
                  value={formData.inquiryType}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  {inquiryTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Brief description of your inquiry"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Please provide details about your inquiry..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleSendMessage}
                leftIcon={<Mail className="h-5 w-5" />}
              >
                Send Message
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12 px-4 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Product</h3>
              <ul className="space-y-4">
                <li><a href="/pricing" className="text-base text-gray-600 hover:text-primary-600">Pricing</a></li>
                <li><a href="/faq" className="text-base text-gray-600 hover:text-primary-600">FAQ</a></li>
                <li><a href="/help" className="text-base text-gray-600 hover:text-primary-600">Help Center</a></li>
                <li><a href="/blog" className="text-base text-gray-600 hover:text-primary-600">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Company</h3>
              <ul className="space-y-4">
                <li><a href="/about" className="text-base text-gray-600 hover:text-primary-600">About Us</a></li>
                <li><a href="/careers" className="text-base text-gray-600 hover:text-primary-600">Careers</a></li>
                <li><a href="/contact" className="text-base text-gray-600 hover:text-primary-600">Contact</a></li>
                <li><a href="/blog" className="text-base text-gray-600 hover:text-primary-600">News</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Resources</h3>
              <ul className="space-y-4">
                <li><a href="/help" className="text-base text-gray-600 hover:text-primary-600">Help Center</a></li>
                <li><a href="/contact" className="text-base text-gray-600 hover:text-primary-600">Support</a></li>
                <li><a href="/blog" className="text-base text-gray-600 hover:text-primary-600">Learning Tips</a></li>
                <li><a href="/contact" className="text-base text-gray-600 hover:text-primary-600">Partners</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Legal</h3>
              <ul className="space-y-4">
                <li><a href="/privacy" className="text-base text-gray-600 hover:text-primary-600">Privacy</a></li>
                <li><a href="/terms" className="text-base text-gray-600 hover:text-primary-600">Terms</a></li>
                <li><a href="/privacy" className="text-base text-gray-600 hover:text-primary-600">Cookie Policy</a></li>
                <li><a href="/terms" className="text-base text-gray-600 hover:text-primary-600">Licenses</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-base text-gray-400 text-center">
              &copy; {new Date().getFullYear()} Brainbud Education, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HelpPage;