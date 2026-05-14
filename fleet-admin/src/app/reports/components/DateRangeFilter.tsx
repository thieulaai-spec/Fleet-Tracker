'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
    <div className="relative w-[220px]" ref={containerRef}>
      <div 
        className="flex items-center gap-sm py-[10px] px-md bg-surface-high border border-border rounded-default cursor-pointer text-text font-medium text-sm transition-all duration-200 hover:border-primary"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar size={18} className="text-primary-light" />
        <span>{selectedLabel}</span>
        <ChevronDown size={16} className={`ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-[320px] bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-200 p-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 mb-md">
            {PRESET_RANGES.map((preset) => (
              <div 
                key={preset.label} 
                className="py-2.5 px-3 rounded-lg cursor-pointer text-text-dim text-xs font-medium transition-all duration-200 hover:bg-white/10 hover:text-text border border-transparent hover:border-white/10"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </div>
            ))}
          </div>

          <div className="h-px bg-border/50 mb-md" />
          
          <div className="flex flex-col gap-sm">
            <span className="block text-[10px] text-text-dim mb-1 uppercase font-bold tracking-wider">Custom Range</span>
            <div className="flex flex-col gap-sm">
              <DatePicker 
                value={customFrom}
                onChange={setCustomFrom}
                placeholder="From date"
                className="w-full"
              />
              <DatePicker 
                value={customTo}
                onChange={setCustomTo}
                placeholder="To date"
                className="w-full"
              />
            </div>
            <Button 
              size="md" 
              fullWidth 
              className="mt-2"
              onClick={handleApply}
              disabled={!customFrom || !customTo}
            >
              Apply Range
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
