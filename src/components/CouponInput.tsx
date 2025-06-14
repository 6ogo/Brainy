import React, { useState } from 'react';
import { Tag, Check, X, AlertCircle, Percent } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { cn } from '../styles/utils';

interface CouponInputProps {
  onCouponApply: (coupon: string) => void;
  onCouponRemove: () => void;
  appliedCoupon?: string;
  isLoading?: boolean;
  className?: string;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  onCouponApply,
  onCouponRemove,
  appliedCoupon,
  isLoading = false,
  className
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = () => {
    if (couponCode.trim()) {
      // Preserve the exact case as entered by the user
      onCouponApply(couponCode.trim());
      setCouponCode('');
    }
  };

  const handleRemove = () => {
    onCouponRemove();
    setIsExpanded(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Don't force uppercase here - let user enter as they want
    setCouponCode(e.target.value);
  };

  if (appliedCoupon) {
    return (
      <div className={cn("flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md", className)}>
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-green-100 rounded-full">
            <Check className="h-3 w-3 text-green-600" />
          </div>
          <div>
            <span className="text-sm font-medium text-green-800">
              Coupon Applied
            </span>
            <p className="text-xs text-green-600">"{appliedCoupon}"</p>
          </div>
        </div>
        <Button
          variant="text"
          size="sm"
          onClick={handleRemove}
          className="text-green-600 hover:text-green-700 p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {!isExpanded ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          leftIcon={<Percent className="h-4 w-4" />}
          className="w-full text-sm"
        >
          Apply Coupon Code
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                value={couponCode}
                onChange={handleInputChange}
                placeholder="Enter coupon code"
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApply();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleApply}
              disabled={!couponCode.trim() || isLoading}
              isLoading={isLoading}
              size="sm"
              className="px-4"
            >
              Apply
            </Button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Coupon Tips:</p>
                <ul className="space-y-1">
                  <li>• Codes are case-sensitive</li>
                  <li>• Some coupons are plan-specific</li>
                  <li>• Discount applies at checkout</li>
                </ul>
              </div>
            </div>
          </div>
          
          <Button
            variant="text"
            size="sm"
            onClick={() => {
              setIsExpanded(false);
              setCouponCode('');
            }}
            className="text-gray-500 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};