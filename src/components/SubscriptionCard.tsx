import React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { cn, commonStyles } from '../styles/utils';

interface SubscriptionCardProps {
  plan: {
    id: string;
    name: string;
    price: string;
    description: string;
    features: string[];
    limitations?: string[];
  };
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSubscribe: (planId: string) => void;
  isLoading?: boolean;
  delay?: number;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plan,
  isCurrentPlan = false,
  isPopular = false,
  onSubscribe,
  isLoading = false,
  delay = 0
}) => {
  const getIcon = () => {
    switch (plan.id) {
      case 'premium':
        return <Crown className="h-6 w-6" />;
      case 'ultimate':
        return <Zap className="h-6 w-6" />;
      default:
        return <Check className="h-6 w-6" />;
    }
  };

  const getGradient = () => {
    switch (plan.id) {
      case 'premium':
        return 'from-blue-500 to-purple-600';
      case 'ultimate':
        return 'from-purple-600 to-pink-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="relative"
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </div>
        </div>
      )}
      
      <Card
        variant="hover"
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          isPopular && "ring-2 ring-orange-400 ring-opacity-50",
          isCurrentPlan && "ring-2 ring-green-400 ring-opacity-50"
        )}
      >
        {/* Header with gradient */}
        <div className={cn(
          "p-6 text-white bg-gradient-to-br",
          getGradient()
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {getIcon()}
              <h3 className="text-xl font-bold">{plan.name}</h3>
            </div>
            {isCurrentPlan && (
              <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">
                Current
              </div>
            )}
          </div>
          
          <div className="flex items-baseline">
            <span className="text-4xl font-extrabold">${plan.price}</span>
            <span className="ml-1 text-lg opacity-80">/month</span>
          </div>
          
          <p className="mt-2 text-sm opacity-90">{plan.description}</p>
        </div>

        {/* Features */}
        <div className="p-6 flex-grow">
          <ul className="space-y-3">
            {plan.features?.map((feature, index) => (
              <motion.li
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 + index * 0.05 }}
                className="flex items-start space-x-3"
              >
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </motion.li>
            ))}
            
            {plan.limitations?.map((limitation, index) => (
              <motion.li
                key={limitation}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 + (plan.features?.length || 0) * 0.05 + index * 0.05 }}
                className="flex items-start space-x-3 text-gray-400"
              >
                <div className="h-5 w-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                  <div className="h-3 w-3 border border-gray-300 rounded-full"></div>
                </div>
                <span className="text-sm">{limitation}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <div className="p-6 pt-0">
          <Button
            variant={isCurrentPlan ? "outline" : "primary"}
            className="w-full"
            onClick={() => onSubscribe(plan.id)}
            isLoading={isLoading}
            disabled={isCurrentPlan}
          >
            {isCurrentPlan ? 'Current Plan' : 
             plan.price === '0' ? 'Get Started' : 
             'Upgrade Now'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};