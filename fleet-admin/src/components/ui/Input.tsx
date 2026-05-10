import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <input 
        className={`input ${error ? 'error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="error-message">{error}</span>}

      <style jsx>{`
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .input-label {
          font: var(--font-label-sm);
          color: var(--color-text-muted);
        }

        .input.error {
          border-color: var(--color-danger);
        }

        .error-message {
          font-size: 12px;
          color: var(--color-danger);
        }
      `}</style>
    </div>
  );
}
