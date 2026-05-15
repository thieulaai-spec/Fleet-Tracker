'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  align?: 'left' | 'right';
}

export function Select({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select...', 
  className = '',
  label,
  align = 'left'
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 300; // Estimated max height
        
        const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        const styles: React.CSSProperties = {
          position: 'fixed',
          width: `${Math.max(rect.width, 200)}px`,
          zIndex: 9999,
        };

        if (showAbove) {
          styles.bottom = `${window.innerHeight - rect.top + 8}px`;
        } else {
          styles.top = `${rect.bottom + 8}px`;
        }

        if (align === 'left') {
          styles.left = `${rect.left}px`;
        } else {
          styles.left = `${rect.right - Math.max(rect.width, 200)}px`;
        }

        setDropdownStyles(styles);
      }
    };

    if (isOpen) {
      updatePosition();
      // Use capture phase to catch scrolls on any element (like Modal body)
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, align]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const dropdown = isOpen && (
    <div 
      ref={dropdownRef}
      style={dropdownStyles}
      className="bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 overflow-hidden ring-1 ring-black/5"
    >
      <div className="p-1.5 flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
              value === option.value 
                ? 'bg-primary text-white font-semibold shadow-md shadow-primary/20' 
                : 'text-text-dim hover:text-text hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {option.icon && (
                <span className={value === option.value ? 'text-white' : 'text-primary-light/70'}>
                  {option.icon}
                </span>
              )}
              <span>{option.label}</span>
            </div>
            {value === option.value && <Check size={14} className="text-white" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">{label}</label>}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full px-4 py-2.5 bg-surface-low/50 backdrop-blur-sm border border-border/50 rounded-xl text-sm font-medium text-text transition-all duration-200 hover:bg-surface-low hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 ${isOpen ? 'border-primary/60 ring-2 ring-primary/10 bg-surface-low shadow-lg' : 'shadow-sm'}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {selectedOption?.icon && (
              <span className="text-primary-light/80">{selectedOption.icon}</span>
            )}
            <span className={selectedOption ? 'text-text' : 'text-text-dim'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-text-dim transition-transform duration-300 ease-out ${isOpen ? 'rotate-180 text-primary-light' : ''}`} 
          />
        </button>

        {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
      </div>
    </div>
  );
}
