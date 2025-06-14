import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { cn, commonStyles } from '../styles/utils';
import { 
  Mail, 
  MessageSquare, 
  Users,
  Send,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { name, email, subject, message, inquiryType } = formData;
    
    const emailBody = `Name: ${name}
Email: ${email}
Inquiry Type: ${inquiryType}
Subject: ${subject}

Message:
${message}`;

    const mailtoLink = `mailto:info@learny.se?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
    
    // Show success message
    setSubmitted(true);
    toast.success('Email client opened with your message!');
    setIsSubmitting(false);
  };

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Subscriptions' },
    { value: 'partnership', label: 'Partnership Opportunities' },
    { value: 'enterprise', label: 'Enterprise Solutions' },
    { value: 'press', label: 'Press & Media' }
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="p-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h1 className={cn(commonStyles.heading.h2, "mb-4")}>
                Message Sent Successfully!
              </h1>
              <p className={cn(commonStyles.text.lg, "mb-6")}>
                Thank you for contacting us. Your email client should have opened with your message to info@learny.se.
              </p>
              <Button
                variant="primary"
                onClick={() => setSubmitted(false)}
              >
                Send Another Message
              </Button>
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className={cn(commonStyles.heading.h1, "mb-6")}>
            Get in Touch
          </h1>
          <p className={cn(commonStyles.text.lg)}>
            Have questions about Brainbud? We're here to help! Reach out to our team 
            and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <Card className="p-6 h-fit">
                <h2 className={cn(commonStyles.heading.h3, "mb-6")}>
                  Contact Information
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Email Us
                      </h3>
                      <p className="text-gray-700 font-medium mb-1">
                        info@learny.se
                      </p>
                      <p className="text-sm text-gray-500">
                        Get in touch for general inquiries
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-primary-600" />
                      <span className="text-gray-600">
                        Live Chat Support (Coming Soon)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-primary-600" />
                      <a href="/help" className="text-primary-600 hover:text-primary-700">
                        Help Center
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-8">
                <h2 className={cn(commonStyles.heading.h3, "mb-6")}>
                  Send us a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      id="name"
                      label="Full Name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      required
                    />
                    <Input
                      id="email"
                      label="Email Address"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      required
                    />
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

                  <Input
                    id="subject"
                    label="Subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of your inquiry"
                    required
                  />

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
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isSubmitting}
                    leftIcon={<Send className="h-5 w-5" />}
                  >
                    {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <Card className="p-8">
            <h2 className={cn(commonStyles.heading.h2, "mb-6 text-center")}>
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How quickly will I get a response?</h3>
                <p className="text-gray-600 text-sm">We typically respond to all inquiries within 24 hours during business days.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Do you offer phone support?</h3>
                <p className="text-gray-600 text-sm">Phone support is coming soon! Premium and Ultimate subscribers will have access to priority phone support.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I schedule a demo?</h3>
                <p className="text-gray-600 text-sm">Absolutely! Contact our sales team to schedule a personalized demo of Brainbud.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Do you offer enterprise solutions?</h3>
                <p className="text-gray-600 text-sm">Yes, we provide custom solutions for schools, universities, and organizations.</p>
              </div>
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

export default ContactPage;