'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DateRange {
  from: string;
  to: string;
}

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange) => void;
}

const PRESET_RANGES = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'This Month', days: 'current_month' },
];

export function DateRangeFilter({ onRangeChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('Last 7 Days');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const handlePresetClick = (preset: typeof PRESET_RANGES[0]) => {
    const to = new Date();
    let from = new Date();

    if (preset.days === 'current_month') {
      from = new Date(to.getFullYear(), to.getMonth(), 1);
    } else {
      from.setDate(to.getDate() - (preset.days as number));
    }

    const range = {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };

    setSelectedLabel(preset.label);
    onRangeChange(range);
    setIsOpen(false);
  };

  const handleApply = () => {
    if (!customFrom || !customTo) return;
    
    setSelectedLabel(`${customFrom} to ${customTo}`);
    onRangeChange({ from: customFrom, to: customTo });
    setIsOpen(false);
  };

  return (
    <div className="filter-container">
      <div className="filter-trigger" onClick={() => setIsOpen(!isOpen)}>
        <Calendar size={18} className="icon" />
        <span>{selectedLabel}</span>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && (
        <div className="filter-dropdown">
          {PRESET_RANGES.map((preset) => (
            <div 
              key={preset.label} 
              className="preset-item"
              onClick={() => handlePresetClick(preset)}
            >
              {preset.label}
            </div>
          ))}
          <div className="divider" />
          <div className="custom-range">
            <span className="custom-label">Custom Range</span>
            <div className="inputs">
              <input 
                type="date" 
                className="date-input" 
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span>to</span>
              <input 
                type="date" 
                className="date-input" 
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
            <Button 
              size="sm" 
              fullWidth 
              style={{ marginTop: '12px' }}
              onClick={handleApply}
              disabled={!customFrom || !customTo}
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
        .filter-container {
          position: relative;
          width: 220px;
        }

        .filter-trigger {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 10px var(--space-md);
          background: var(--color-surface-high);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-default);
          cursor: pointer;
          color: var(--color-text);
          font-weight: 500;
          font-size: 14px;
          transition: all var(--transition-fast);
        }

        .filter-trigger:hover {
          border-color: var(--color-primary);
        }

        .icon {
          color: var(--color-primary-light);
        }

        .chevron {
          margin-left: auto;
          transition: transform var(--transition-fast);
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .filter-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          padding: var(--space-sm);
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .preset-item {
          padding: 10px var(--space-md);
          border-radius: var(--radius-sm);
          cursor: pointer;
          color: var(--color-text-dim);
          transition: all var(--transition-fast);
        }

        .preset-item:hover {
          background: var(--color-surface-high);
          color: var(--color-text);
        }

        .divider {
          height: 1px;
          background: var(--color-border);
          margin: var(--space-sm) 0;
        }

        .custom-range {
          padding: var(--space-sm) var(--space-md);
        }

        .custom-label {
          display: block;
          font-size: 12px;
          color: var(--color-text-muted);
          margin-bottom: 8px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .inputs {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .date-input {
          flex: 1;
          background: var(--color-surface-high);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 6px;
          color: var(--color-text);
          font-size: 12px;
          outline: none;
        }

        .date-input:focus {
          border-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
