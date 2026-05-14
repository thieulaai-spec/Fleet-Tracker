'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  startOfToday,
  addYears,
  subYears
} from 'date-fns';

interface DatePickerProps {
  value: string | Date | null;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  error?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  label,
  className = '',
  error
}: DatePickerProps) {
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : startOfToday());
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  const selectedDate = value ? new Date(value) : null;
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' as 'top' | 'bottom' });

  const updatePosition = () => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const pickerWidth = 320; // Default width
    const pickerHeight = 380; // Approximate height for days view
    
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Decide placement: bottom by default, top if not enough space below but enough above
    const placement = (spaceBelow < pickerHeight && spaceAbove > spaceBelow) ? 'top' : 'bottom';
    
    let top = 0;
    if (placement === 'top') {
      top = rect.top - 8; // We use transform: translateY(-100%) in CSS or calculate here
    } else {
      top = rect.bottom + 8;
    }

    // Horizontal positioning: try to align left, but don't overflow right
    let left = rect.left;
    if (left + pickerWidth > window.innerWidth) {
      left = window.innerWidth - pickerWidth - 16;
    }
    if (left < 16) left = 16;

    setCoords({
      top: top + window.scrollY,
      left: left + window.scrollX,
      width: rect.width,
      placement
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const portalContent = document.getElementById('datepicker-portal-content');
        if (portalContent && portalContent.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keyup', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keyup', handleKeyDown);
    };
  }, []);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (view === 'days') setCurrentMonth(subMonths(currentMonth, 1));
    if (view === 'months') setCurrentMonth(subYears(currentMonth, 1));
    if (view === 'years') setCurrentMonth(subYears(currentMonth, 12));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (view === 'days') setCurrentMonth(addMonths(currentMonth, 1));
    if (view === 'months') setCurrentMonth(addYears(currentMonth, 1));
    if (view === 'years') setCurrentMonth(addYears(currentMonth, 12));
  };

  const handleDateClick = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
    setView('days');
  };

  const toggleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (view === 'days') setView('months');
    else if (view === 'months') setView('years');
    else setView('days');
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between px-2 py-2 bg-white/5 rounded-xl border border-white/5 mx-2 my-2">
      <button
        type="button"
        onClick={handlePrevMonth}
        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-text-dim hover:text-text"
      >
        <ChevronLeft size={18} />
      </button>
      <button 
        type="button"
        onClick={toggleView}
        className="px-2 py-1 hover:bg-white/10 rounded-lg transition-colors text-sm font-semibold text-text flex items-center gap-1 group"
      >
        {view === 'days' && format(currentMonth, 'MMMM yyyy')}
        {view === 'months' && format(currentMonth, 'yyyy')}
        {view === 'years' && (
          <>
            {(() => {
              const startYear = currentMonth.getFullYear() - 5;
              return `${startYear} - ${startYear + 11}`;
            })()}
          </>
        )}
      </button>
      <button
        type="button"
        onClick={handleNextMonth}
        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-text-dim hover:text-text"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );

  const renderDays = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return (
      <div className="grid grid-cols-7 mb-1 px-2">
        {days.map((day) => (
          <div key={day} className="text-[10px] font-bold text-text-dim uppercase tracking-widest text-center py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const interval = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1 p-2">
        {interval.map((date) => {
          const isCurrentMonth = isSameMonth(date, monthStart);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);

          return (
            <button
              key={date.toString()}
              type="button"
              onClick={() => handleDateClick(date)}
              className={`
                relative h-9 w-full flex items-center justify-center rounded-xl text-xs transition-all duration-200
                ${!isCurrentMonth ? 'text-text-dim/30' : 'text-text'}
                ${isSelected 
                  ? 'bg-primary text-white font-bold shadow-lg shadow-primary/25 z-10' 
                  : 'hover:bg-white/10'}
                ${isTodayDate && !isSelected ? 'text-primary-light font-bold ring-1 ring-primary-light/30' : ''}
              `}
            >
              {format(date, 'd')}
              {isTodayDate && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-light rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderMonths = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return (
      <div className="grid grid-cols-3 gap-2 p-3">
        {months.map((m, i) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(i);
              setCurrentMonth(newDate);
              setView('days');
            }}
            className={`
              h-12 flex items-center justify-center rounded-xl text-xs font-medium transition-all
              ${selectedDate && selectedDate.getMonth() === i && selectedDate.getFullYear() === currentMonth.getFullYear() 
                ? 'bg-primary text-white shadow-lg' 
                : currentMonth.getMonth() === i && !selectedDate
                  ? 'bg-white/10 text-text'
                  : 'hover:bg-white/10 text-text'}
            `}
          >
            {m}
          </button>
        ))}
      </div>
    );
  };

  const renderYears = () => {
    const startYear = currentMonth.getFullYear() - 5;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);
    return (
      <div className="grid grid-cols-3 gap-2 p-3">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => {
              const newDate = new Date(currentMonth);
              newDate.setFullYear(year);
              setCurrentMonth(newDate);
              setView('months');
            }}
            className={`
              h-12 flex items-center justify-center rounded-xl text-xs font-medium transition-all
              ${selectedDate && selectedDate.getFullYear() === year 
                ? 'bg-primary text-white shadow-lg' 
                : currentMonth.getFullYear() === year && !selectedDate
                  ? 'bg-white/10 text-text'
                  : 'hover:bg-white/10 text-text'}
            `}
          >
            {year}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">{label}</label>}
      
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setView('days');
          }}
          className={`
            flex items-center gap-3 w-full px-4 py-2.5 bg-surface-low/50 backdrop-blur-sm border border-border/50 rounded-xl text-sm font-medium text-text transition-all duration-200 
            hover:bg-surface-low hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 
            ${isOpen ? 'border-primary/60 ring-2 ring-primary/10 bg-surface-low shadow-lg' : 'shadow-sm'}
          `}
        >
          <CalendarIcon size={16} className={`text-text-dim transition-colors duration-200 ${isOpen || selectedDate ? 'text-primary-light' : ''}`} />
          <span className={selectedDate ? 'text-text' : 'text-text-dim'}>
            {selectedDate ? format(selectedDate, 'PPP') : placeholder}
          </span>
          {selectedDate && (
            <div 
              className="ml-auto p-1 hover:bg-white/10 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            >
              <X size={14} className="text-text-dim" />
            </div>
          )}
        </button>

        {error && <p className="text-[10px] font-bold text-danger uppercase tracking-wider mt-1.5 ml-1">{error}</p>}

        {isOpen && mounted && createPortal(
          <div 
            id="datepicker-portal-content"
            ref={pickerRef}
            style={{ 
              position: 'absolute',
              top: coords.top,
              left: coords.left,
              minWidth: 320,
              transform: coords.placement === 'top' ? 'translateY(-100%)' : 'none'
            }}
            className={`bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-9999 animate-in fade-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-black/5 ${
              coords.placement === 'top' ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'
            }`}
          >
            {renderHeader()}
            {view === 'days' && (
              <>
                {renderDays()}
                {renderCells()}
              </>
            )}
            {view === 'months' && renderMonths()}
            {view === 'years' && renderYears()}
            
            <div className="p-3 border-t border-white/5 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setCurrentMonth(startOfToday());
                  setView('days');
                  if (view === 'days') handleDateClick(startOfToday());
                }}
                className="text-[10px] font-bold text-primary-light uppercase tracking-widest hover:text-primary transition-colors"
              >
                Go to Today
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
