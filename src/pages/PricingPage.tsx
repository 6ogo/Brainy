import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { CouponInput } from '../components/CouponInput';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { cn, commonStyles, animations } from '../styles/utils';
import { purchaseSubscription, getCurrentSubscription } from '../services/subscriptionService';
import { createPortalSession, validateCoupon } from '../services/stripeService';
import { useAuth } from '../contexts/AuthContext';
import { products } from '../stripe-config';
import toast from 'react-hot-toast';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [isCouponLoading, setIsCouponLoading] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      
      try {
        const subscription = await getCurrentSubscription();
        setCurrentSubscription(subscription);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    fetchSubscription();
  }, [user]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (planId === 'free_tier') {
      navigate('/subjects');
      return;
    }

    try {
      setIsLoading(true);
      await purchaseSubscription(planId as keyof typeof products, appliedCoupon);
    } catch (error) {
      console.error('Subscription error:', error);
      if (error instanceof Error && error.message.includes('coupon')) {
        toast.error('Invalid or expired coupon code. Please check and try again.');
        setAppliedCoupon(''); // Clear the invalid coupon
      } else {
        toast.error('Failed to process subscription. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      const url = await createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open customer portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCouponApply = async (couponCode: string) => {
    setIsCouponLoading(true);
    try {
      const isValid = await validateCoupon(couponCode);
      if (isValid) {
        setAppliedCoupon(couponCode);
        toast.success(`Coupon "${couponCode}" applied successfully!`);
      } else {
        toast.error('Invalid or expired coupon code. Please check the code and try again.');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error('Failed to validate coupon. Please try again.');
    } finally {
      setIsCouponLoading(false);
    }
  };

  const handleCouponRemove = () => {
    setAppliedCoupon('');
    toast.success('Coupon removed.');
  };

  const plans = [
    {
      id: 'free_tier',
      name: 'Free',
      price: '0',
      description: 'Perfect for trying out Brainbud',
      features: [
        '30 minutes daily conversation',
        '2 subjects (Math, English)',
        'Basic progress tracking',
        'Community features'
      ],
      limitations: [
        'Limited conversation time',
        'No video calls',
        'No advanced analytics',
        'No downloadable transcripts'
      ]
    },
    {
      ...products.premium,
      features: [
        '4 hours daily conversation',
        '30 minute video calls',
        'All subjects and specializations',
        'Advanced analytics and insights',
        'Downloadable conversation transcripts'
      ]
    },
    {
      ...products.ultimate,
      features: [
        'Unlimited conversation time',
        '60 minutes video calls',
        'All subjects and specializations',
        'Advanced analytics and insights',
        'Downloadable conversation transcripts',
        'Early access to new features',
        'Priority support'
      ]
    }
  ];

  const getCurrentPlanId = () => {
    if (!currentSubscription) return 'free_tier';
    
    switch (currentSubscription.subscription_level) {
      case 'premium':
        return 'premium';
      case 'ultimate':
        return 'ultimate';
      default:
        return 'free_tier';
    }
  };

  const currentPlanId = getCurrentPlanId();

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
            {user ? 'Upgrade Your Plan' : 'Simple, Transparent Pricing'}
          </motion.h1>
          <motion.p 
            className={cn(commonStyles.text.lg, "mb-8")}
            variants={animations.slideUp}
          >
            {user ? 'Unlock more features and enhance your learning experience' : 'Choose the perfect plan for your learning journey'}
          </motion.p>

          {user && currentSubscription && currentPlanId !== 'free_tier' && (
            <motion.div variants={animations.slideUp}>
              <Button
                variant="secondary"
                onClick={handleManageSubscription}
                isLoading={isLoading}
                className="mb-8"
              >
                Manage Current Subscription
              </Button>
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          className="max-w-7xl mx-auto grid grid-cols-1 gap-8 lg:grid-cols-3"
          variants={animations.staggerChildren}
        >
          {plans.map((plan, index) => (
            <SubscriptionCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentPlanId === plan.id}
              isPopular={plan.id === 'premium'}
              onSubscribe={handleSubscribe}
              isLoading={isLoading}
              delay={index * 0.1}
            />
          ))}
        </motion.div>

        {user && (
          <motion.div 
            className="max-w-md mx-auto mt-12"
            variants={animations.slideUp}
          >
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Gift className="h-5 w-5 text-primary-600" />
                <span className="font-medium text-gray-900">Have a coupon code?</span>
              </div>
              <CouponInput
                onCouponApply={handleCouponApply}
                onCouponRemove={handleCouponRemove}
                appliedCoupon={appliedCoupon}
                isLoading={isCouponLoading}
              />
              {appliedCoupon && (
                <div className="mt-3 text-sm text-green-600">
                  Your coupon will be applied at checkout
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {user && currentPlanId !== 'free_tier' && (
          <motion.div 
            className="mt-16 text-center"
            variants={animations.fadeIn}
          >
            <Card className="max-w-2xl mx-auto p-8">
              <h3 className={cn(commonStyles.heading.h3, "mb-4")}>
                Current Subscription Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-semibold capitalize">{currentSubscription?.subscription_level || 'Free'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold capitalize">{currentSubscription?.subscription_status || 'Active'}</p>
                </div>
                {currentSubscription?.current_period_end && (
                  <div>
                    <p className="text-sm text-gray-600">Next Billing Date</p>
                    <p className="font-semibold">
                      {new Date(currentSubscription.current_period_end * 1000).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Daily Conversation Limit</p>
                  <p className="font-semibold">
                    {currentSubscription?.daily_conversation_minutes === -1 
                      ? 'Unlimited' 
                      : `${currentSubscription?.daily_conversation_minutes || 30} minutes`}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

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
            <div>
              <h3 className="font-semibold text-lg mb-2">How do coupon codes work?</h3>
              <p className="text-gray-600">Enter your coupon code before selecting a plan. The discount will be applied at checkout and validated with Stripe.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Can I get a refund?</h3>
              <p className="text-gray-600">We offer a 30-day money-back guarantee for all paid subscriptions.</p>
            </div>
          </div>
        </motion.div>

        {!user && (
          <motion.div 
            className="mt-16 text-center"
            variants={animations.fadeIn}
          >
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Home
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PricingPage;