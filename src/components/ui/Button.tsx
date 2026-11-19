import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'secondary' | 'danger' | 'ghost' | 'outline-gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'gold',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    gold: 'bg-gold-gradient text-dark-950 shadow-gold-sm hover:shadow-gold-md hover:brightness-105 border border-gold-300/40',
    'outline-gold': 'bg-transparent text-gold-400 border border-gold-500/40 hover:bg-gold-500/10 hover:border-gold-400',
    secondary: 'bg-dark-800 text-slate-200 border border-dark-700 hover:bg-dark-750 hover:text-white',
    danger: 'bg-red-950/60 text-red-400 border border-red-800/60 hover:bg-red-900/60 hover:text-red-300',
    ghost: 'bg-transparent text-slate-300 hover:bg-white/5 hover:text-white',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
    icon: 'p-2.5 w-10 h-10',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2" />
      ) : null}
      {children}
    </button>
  );
};
