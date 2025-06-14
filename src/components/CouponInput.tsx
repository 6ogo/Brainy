import React, { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';
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
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Coupon "{appliedCoupon}" applied
          </span>
        </div>
        <Button
          variant="text"
          size="sm"
          onClick={handleRemove}
          className="text-green-600 hover:text-green-700"
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
          leftIcon={<Tag className="h-4 w-4" />}
          className="w-full"
        >
          Have a coupon code?
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              value={couponCode}
              onChange={handleInputChange}
              placeholder="Enter coupon code (case-sensitive)"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApply();
                }
              }}
            />
            <Button
              onClick={handleApply}
              disabled={!couponCode.trim() || isLoading}
              isLoading={isLoading}
              size="sm"
            >
              Apply
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            Coupon codes are case-sensitive. Enter exactly as provided.
          </div>
          <Button
            variant="text"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-gray-500"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};