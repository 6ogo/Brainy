import React from 'react';
import { cn, commonStyles } from '../styles/utils';

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
}) => {
  const variantStyles = commonStyles.card[variant];
  
  return (
    <div 
      className={cn(variantStyles, className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {(title || subtitle) && (
        <div className={cn('px-4 py-3 border-b border-gray-200', headerClassName)}>
          {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      
      <div className={cn('p-4', bodyClassName)}>
        {children}
      </div>
      
      {footer && (
        <div className={cn('px-4 py-3 bg-gray-50 border-t border-gray-200', footerClassName)}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
