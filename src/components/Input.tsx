import React, { forwardRef } from 'react';
import { cn, commonStyles } from '../styles/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    helperText, 
    error, 
    className, 
    leftIcon, 
    rightIcon, 
    fullWidth = true,
    disabled,
    ...props 
  }, ref) => {
    const inputStyles = error 
      ? commonStyles.input.error 
      : disabled 
        ? commonStyles.input.disabled 
        : commonStyles.input.base;
    
    const labelStyles = error 
      ? commonStyles.label.error 
      : commonStyles.label.base;

    return (
      <div className={cn('mb-4', fullWidth ? 'w-full' : '')}>
        {label && (
          <label className={labelStyles} htmlFor={props.id}>
            {label}
          </label>
        )}
        <div className="relative mt-1">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              inputStyles,
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              className
            )}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {(helperText || error) && (
          <p className={cn(
            'mt-1 text-sm',
            error ? 'text-error-500' : 'text-gray-500'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
