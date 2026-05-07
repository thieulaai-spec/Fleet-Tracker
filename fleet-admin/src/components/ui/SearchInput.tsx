'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function SearchInput({ label, className = '', ...props }: SearchInputProps) {
  return (
    <div className="search-input-group">
      {label && <label className="search-input-label">{label}</label>}
      <div className="search-input-shell">
        <Search size={18} className="search-input-icon" />
        <input className={`search-input ${className}`} {...props} />
      </div>

      <style jsx>{`
        .search-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .search-input-label {
          font: var(--font-label-sm);
          color: var(--color-text-muted);
        }

        .search-input-shell {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          width: 100%;
          padding: 10px 14px;
          background: var(--color-surface-low);
          border: 1px solid var(--color-outline-variant);
          border-radius: var(--radius-default);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .search-input-shell:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .search-input-icon {
          color: var(--color-text-dim);
          flex: none;
        }

        .search-input {
          width: 100%;
          border: none;
          background: transparent;
          color: var(--color-text);
          font: var(--font-body-md);
          outline: none;
        }

        .search-input::placeholder {
          color: var(--color-text-dim);
        }
      `}</style>
    </div>
  );
}