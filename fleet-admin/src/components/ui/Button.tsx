'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  fullWidth,
  icon, 
  className = '', 
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'full-width' : ''} ${className} ${isLoading ? 'loading' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <span className="spinner-sm" />}
      {!isLoading && icon && <span className="btn-icon">{icon}</span>}
      <span>{children}</span>

      <style jsx>{`
        .spinner-sm {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .btn-icon {
          display: flex;
          align-items: center;
        }

        .full-width {
          width: 100%;
          justify-content: center;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
