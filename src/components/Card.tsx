import React from 'react';
import { motion } from 'framer-motion';
import { cn, commonStyles, animations } from '../styles/utils';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'base' | 'hover' | 'interactive';
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
  delay?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  variant = 'base',
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  footer,
  onClick,
  delay = 0,
}) => {
  const variantStyles = commonStyles.card[variant];
  
  return (
    <motion.div 
      className={cn(variantStyles, className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      initial="initial"
      animate="animate"
      variants={animations.scale}
      transition={{ delay }}
      whileHover={variant !== 'base' ? { y: -5, transition: { duration: 0.2 } } : undefined}
      whileTap={variant === 'interactive' ? { scale: 0.98 } : undefined}
    >
      {(title || subtitle) && (
        <motion.div 
          className={cn('px-4 py-3 border-b border-gray-200', headerClassName)}
          variants={animations.fadeIn}
        >
          {title && (
            <motion.h3 
              className="text-lg font-medium text-gray-900"
              variants={animations.slideUp}
            >
              {title}
            </motion.h3>
          )}
          {subtitle && (
            <motion.p 
              className="mt-1 text-sm text-gray-500"
              variants={animations.slideUp}
            >
              {subtitle}
            </motion.p>
          )}
        </motion.div>
      )}
      
      <motion.div 
        className={cn('p-4', bodyClassName)}
        variants={animations.fadeIn}
      >
        {children}
      </motion.div>
      
      {footer && (
        <motion.div 
          className={cn('px-4 py-3 bg-gray-50 border-t border-gray-200', footerClassName)}
          variants={animations.slideUp}
        >
          {footer}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Card;