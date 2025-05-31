import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { theme } from './theme';

/**
 * Combines multiple class names, resolves conflicts and merges them
 * This is useful for conditionally applying classes and merging with Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function to access theme values
 * This ensures type safety and consistent access to theme values
 */
export const getThemeValue = {
  color: (path: string): string => {
    const parts = path.split('.');
    let result: any = theme.colors;
    
    for (const part of parts) {
      if (result[part] === undefined) {
        console.warn(`Theme color path "${path}" not found`);
        return '';
      }
      result = result[part];
    }
    
    return result;
  },
  
  font: (family: keyof typeof theme.typography.fontFamily): string => {
    return theme.typography.fontFamily[family];
  },
  
  fontSize: (size: keyof typeof theme.typography.fontSize): string => {
    return theme.typography.fontSize[size];
  },
  
  fontWeight: (weight: keyof typeof theme.typography.fontWeight): string => {
    return theme.typography.fontWeight[weight];
  },
  
  spacing: (size: keyof typeof theme.spacing): string => {
    return theme.spacing[size];
  },
  
  borderRadius: (radius: keyof typeof theme.borderRadius): string => {
    return theme.borderRadius[radius];
  },
  
  shadow: (shadow: keyof typeof theme.shadows): string => {
    return theme.shadows[shadow];
  },
  
  transition: (transition: keyof typeof theme.transitions): string => {
    return theme.transitions[transition];
  },
};

/**
 * Common styles used across the application
 * This ensures consistency in styling components
 */
export const commonStyles = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  heading: {
    h1: 'text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl',
    h2: 'text-3xl font-bold text-gray-900',
    h3: 'text-2xl font-bold text-gray-900',
    h4: 'text-xl font-semibold text-gray-900',
    h5: 'text-lg font-semibold text-gray-900',
    h6: 'text-base font-semibold text-gray-900',
  },
  
  text: {
    base: 'text-base text-gray-500',
    lg: 'text-lg text-gray-500',
    sm: 'text-sm text-gray-500',
    xs: 'text-xs text-gray-500',
  },
  
  button: {
    primary: 'px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors',
    secondary: 'px-4 py-2 bg-white text-indigo-600 font-medium rounded-md border border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors',
    outline: 'px-4 py-2 bg-transparent text-indigo-600 font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors',
    text: 'font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none transition-colors',
  },
  
  card: {
    base: 'bg-white rounded-lg shadow-md overflow-hidden',
    hover: 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow',
    interactive: 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg cursor-pointer transition-all transform hover:-translate-y-1',
  },
  
  input: {
    base: 'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500',
    error: 'block w-full rounded-md border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500',
    disabled: 'block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm text-gray-500 cursor-not-allowed',
  },
  
  label: {
    base: 'block text-sm font-medium text-gray-700',
    error: 'block text-sm font-medium text-red-600',
  },
  
  section: {
    light: 'py-12 bg-white',
    gray: 'py-12 bg-gray-50',
    gradient: 'py-12 bg-gradient-to-b from-indigo-50 to-white',
  },
};

export default {
  cn,
  getThemeValue,
  commonStyles,
};
