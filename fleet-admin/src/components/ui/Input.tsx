import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-sm w-full">
      {label && <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">{label}</label>}
      <input 
        className={`
          w-full px-lg py-md
          bg-surface-low border border-outline-variant rounded-default
          text-text text-sm transition-all duration-150 outline-none
          focus:border-primary focus:ring-4 focus:ring-primary/10
          ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : ''} 
          placeholder:text-text-dim/50
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-danger font-medium mt-1">{error}</span>}
    </div>
  );
}
