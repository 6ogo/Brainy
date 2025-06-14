import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { cn, commonStyles } from '../styles/utils';
import { CheckCircle, ArrowRight, Loader } from 'lucide-react';
import { Header } from '../components/Header';
import toast from 'react-hot-toast';

export const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the session_id from URL parameters
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // If no session ID is provided, redirect to subjects page
    if (!sessionId) {
      toast.error('Invalid checkout session');
      navigate('/subjects');
      return;
    }

    // Simulate verification of the checkout session
    // In a real implementation, you would verify the session with your backend
    const verifyCheckout = async () => {
      try {
        setIsLoading(true);
        // Wait a moment to allow the webhook to process the payment
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
      } catch (error) {
        console.error('Error verifying checkout:', error);
        toast.error('Failed to verify payment. Please contact support.');
        navigate('/subjects');
      }
    };

    verifyCheckout();
  }, [sessionId, navigate]);

  const handleContinue = () => {
    navigate('/subjects');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            {isLoading ? (
              <div className="py-8">
                <Loader className="h-12 w-12 text-primary-500 mx-auto mb-4 animate-spin" />
                <h2 className={cn(commonStyles.heading.h2, "mb-4")}>
                  Processing Your Payment
                </h2>
                <p className={cn(commonStyles.text.base)}>
                  Please wait while we confirm your subscription...
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-green-100 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                
                <h2 className={cn(commonStyles.heading.h2, "mb-4")}>
                  Payment Successful!
                </h2>
                
                <p className={cn(commonStyles.text.lg, "mb-8")}>
                  Thank you for your subscription. Your account has been upgraded and all premium features are now unlocked.
                </p>
                
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-primary-800 mb-2">
                    What's Next?
                  </h3>
                  <ul className="text-left text-primary-700 space-y-2">
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-primary-700 mr-2 flex-shrink-0">1</span>
                      <span>Explore all unlocked subjects in your dashboard</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-primary-700 mr-2 flex-shrink-0">2</span>
                      <span>Try the video call learning mode with your AI tutor</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-primary-700 mr-2 flex-shrink-0">3</span>
                      <span>Access advanced analytics to track your progress</span>
                    </li>
                  </ul>
                </div>
                
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleContinue}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Continue to Dashboard
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;