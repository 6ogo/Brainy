import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { cn, commonStyles, animations } from '../styles/utils';

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for trying out Brainbud',
    features: [
      '30 minutes daily conversation',
      '2 subjects (Math, English)',
      '1 basic avatar',
      'Basic progress tracking',
      'Community features'
    ],
    limitations: [
      'Limited conversation time',
      'Basic avatars only',
      'No advanced analytics',
      'No downloadable transcripts'
    ]
  },
  {
    name: 'Premium',
    price: '19.99',
    description: 'Unlock the full potential of AI tutoring',
    features: [
      '4 hours daily conversation',
      '30 minute video calls',
      'All subjects and specializations',
      'Advanced analytics and insights',
      'Downloadable conversation transcripts'
    ]
  },
  {
    name: 'Ultimate',
    price: '69',
    description: 'The complete AI tutoring experience',
    features: [
      'Increased conversation time',
      '60 minutes video calls',
      'All subjects and specializations',
      'Advanced analytics and insights',
      'Downloadable conversation transcripts',
      'Early access to new features'
    ]
  }
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Header />
      
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial="initial"
          animate="animate"
          variants={animations.fadeIn}
        >
          <motion.h1 
            className={cn(commonStyles.heading.h1, "mb-4")}
            variants={animations.slideUp}
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p 
            className={cn(commonStyles.text.lg, "mb-8")}
            variants={animations.slideUp}
          >
            Choose the perfect plan for your learning journey
          </motion.p>
        </motion.div>

        <motion.div 
          className="max-w-7xl mx-auto grid grid-cols-1 gap-8 lg:grid-cols-3"
          variants={animations.staggerChildren}
        >
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              variant="interactive"
              className="flex flex-col"
              delay={index * 0.1}
            >
              <div className="p-6 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-500 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
                
                <Button
                  variant="primary"
                  className="w-full mb-6"
                  onClick={() => navigate('/signup')}
                >
                  {plan.price === '0' ? 'Get Started' : 'Subscribe Now'}
                </Button>
              </div>

              <div className="border-t border-gray-200 p-6 bg-gray-50 flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations?.map((limitation) => (
                    <li key={limitation} className="flex items-start text-gray-400">
                      <X className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </motion.div>

        <motion.div 
          className="mt-16 text-center max-w-3xl mx-auto"
          variants={animations.fadeIn}
        >
          <h2 className={cn(commonStyles.heading.h2, "mb-4")}>
            Enterprise Solutions
          </h2>
          <p className={cn(commonStyles.text.lg, "mb-8")}>
            Looking for custom solutions for your school or organization?
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/contact')}
          >
            Contact Sales
          </Button>
        </motion.div>

        <motion.div 
          className="mt-16 bg-white rounded-2xl shadow-xl max-w-4xl mx-auto p-8"
          variants={animations.scale}
        >
          <h2 className={cn(commonStyles.heading.h2, "mb-6 text-center")}>
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-lg mb-2">Can I switch plans anytime?</h3>
              <p className="text-gray-600">Yes, you can upgrade, downgrade, or cancel your subscription at any time.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">Start with our free tier to experience Brainbud before committing to a paid plan.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">What's included in video calls?</h3>
              <p className="text-gray-600">Video calls include face-to-face learning with AI tutors and visual demonstrations.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">What payment methods are accepted?</h3>
              <p className="text-gray-600">We accept all major credit cards, PayPal, and Apple Pay.</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PricingPage;