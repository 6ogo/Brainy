import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { cn, commonStyles } from '../styles/utils';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Users, 
  Building,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitted(true);
      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.');
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: 'Email Us',
      content: 'support@brainbud.com',
      description: 'Get in touch for general inquiries'
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      description: 'Monday to Friday, 9 AM - 6 PM PST'
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: 'Visit Us',
      content: '123 Innovation Drive, San Francisco, CA 94105',
      description: 'Our headquarters in the heart of Silicon Valley'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Support Hours',
      content: '24/7 Online Support',
      description: 'AI-powered help available anytime'
    }
  ];

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
                Thank you for contacting us. We've received your message and will get back to you within 24 hours.
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
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {info.title}
                        </h3>
                        <p className="text-gray-700 font-medium mb-1">
                          {info.content}
                        </p>
                        <p className="text-sm text-gray-500">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Links */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-primary-600" />
                      <a href="#" className="text-primary-600 hover:text-primary-700">
                        Live Chat Support
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-primary-600" />
                      <a href="#" className="text-primary-600 hover:text-primary-700">
                        Community Forum
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-primary-600" />
                      <a href="#" className="text-primary-600 hover:text-primary-700">
                        Enterprise Solutions
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
                <p className="text-gray-600 text-sm">Yes! Premium and Ultimate subscribers have access to priority phone support.</p>
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
    </div>
  );
};

export default ContactPage;