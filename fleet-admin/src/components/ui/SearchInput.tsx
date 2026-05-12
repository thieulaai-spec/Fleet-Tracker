'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
}

export function SearchInput({ label, className = '', containerClassName = '', ...props }: SearchInputProps) {
  return (
    <div className={`flex flex-col gap-sm w-full ${containerClassName}`}>
      {label && <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">{label}</label>}
      <div className={`
        flex items-center gap-md w-full px-lg py-md 
        bg-surface-low border border-outline-variant rounded-default 
        transition-all duration-200 shadow-sm
        focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10
      `}>
        <Search size={18} className="text-text-dim flex-none" />
        <input 
          className={`w-full bg-transparent text-text text-sm outline-none placeholder:text-text-dim/50 ${className}`} 
          {...props} 
        />
      </div>
    </div>
  );
}