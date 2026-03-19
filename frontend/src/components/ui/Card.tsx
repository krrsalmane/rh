import React from 'react';
import { cn } from '../../shared/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false }) => {
  return (
    <div className={cn(
      'glass-card p-6 border border-white/10 rounded-2xl bg-slate-900/50 backdrop-blur-xl',
      hover && 'hover:bg-slate-900/70 hover:border-white/20 hover:shadow-2xl hover:shadow-primary-500/10 cursor-default',
      className
    )}>
      {children}
    </div>
  );
};
