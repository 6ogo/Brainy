import React from 'react';

function isValidReactNode(node: unknown): node is React.ReactNode {
  // Exclude MotionValue and similar objects
  if (
    typeof node === 'object' &&
    node !== null &&
    // Framer MotionValue: has a private 'current' property and a 'set' method
    'set' in node &&
    typeof (node as any).set === 'function'
  ) {
    return false;
  }
  return typeof node === 'string' || typeof node === 'number' || React.isValidElement(node) || node === null || Array.isArray(node);
}

import { motion } from 'framer-motion';
import { cn, commonStyles } from '../styles/utils';

import { HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  leftIcon,
  rightIcon,
  onClick,
  ...props
}) => {
  const baseStyles = commonStyles.button[variant];
  
  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Scroll to top when navigating to a new page
    if (onClick) {
      onClick(e);
      // Small delay to allow navigation to complete before scrolling
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };
  
  return (
    <motion.button
      className={cn(
        baseStyles,
        sizeStyles[size],
        disabled || isLoading ? 'opacity-60 cursor-not-allowed' : '',
        className
      )}
      disabled={disabled || isLoading}
      whileHover={!disabled && !isLoading ? "hover" : undefined}
      whileTap={!disabled && !isLoading ? "tap" : undefined}
      variants={buttonVariants}
      onClick={handleClick}
      {...props}
    >
      <motion.div 
        className="flex items-center justify-center"
        initial={false}
        animate={{ opacity: 1 }}
      >
        {isLoading && (
          <motion.svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </motion.svg>
        )}
        
        {!isLoading && leftIcon && (
          <motion.span 
            className="mr-2 -ml-1"
            initial={{ x: -5, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {isValidReactNode(leftIcon) ? leftIcon : null}
          </motion.span>
        )}
        
        {isValidReactNode(children) ? children : null}
        
        {!isLoading && rightIcon && (
          <motion.span 
            className="ml-2 -mr-1"
            initial={{ x: 5, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {isValidReactNode(rightIcon) ? rightIcon : null}
          </motion.span>
        )}
      </motion.div>
    </motion.button>
  );
};

export default Button;