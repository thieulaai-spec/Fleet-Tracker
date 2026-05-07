'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  label?: string;
  className?: string;
}

export function LoadingSpinner({ size = 24, label, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner ${className}`}>
      <span className="spinner" aria-hidden="true" />
      {label && <span className="spinner-label">{label}</span>}

      <style jsx>{`
        .loading-spinner {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          color: var(--color-text-muted);
        }

        .spinner {
          width: ${size}px;
          height: ${size}px;
          border: 3px solid rgba(255, 255, 255, 0.12);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.85s linear infinite;
        }

        .spinner-label {
          font: var(--font-body-md);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}