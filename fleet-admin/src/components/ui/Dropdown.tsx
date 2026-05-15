'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'right', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});

  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 250; // Estimated menu height
        
        const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        const styles: React.CSSProperties = {
          position: 'fixed',
          minWidth: '200px',
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
          styles.left = `${rect.right - 200}px`;
        }

        setDropdownStyles(styles);
      }
    };

    if (isOpen) {
      updatePosition();
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

  const renderTrigger = () => {
    if (React.isValidElement(trigger)) {
      const element = trigger as React.ReactElement<any>;
      return React.cloneElement(element, {
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
          if (element.props.onClick) element.props.onClick(e);
        }
      });
    }
    return (
      <div className="cursor-pointer" onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}>
        {trigger}
      </div>
    );
  };

  const dropdown = isOpen && (
    <div 
      ref={dropdownRef}
      style={dropdownStyles}
      className="bg-surface border border-border rounded-md shadow-lg p-2 animate-in fade-in slide-in-from-top-2 duration-200 glass" 
      onClick={() => setIsOpen(false)}
    >
      <div className="flex flex-col gap-1 dropdown-content">
        {children}
      </div>
    </div>
  );

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {renderTrigger()}
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
