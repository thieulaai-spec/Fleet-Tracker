import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: string;
  onClick?: () => void;
  href?: string;
}

export function StatCard({ label, value, icon: Icon, trend, color = 'var(--color-primary)', onClick, href }: StatCardProps) {
  const content = (
    <div className={`
      flex flex-col gap-lg p-lg 
      bg-surface border border-border rounded-xl 
      transition-all duration-300 group hover:-translate-y-1 hover:shadow-glow hover:border-primary/30
      ${(onClick || href) ? 'cursor-pointer hover:border-primary-light' : ''}
    `}>
      <div className="flex justify-between items-start">
        <div 
          className="w-12 h-12 bg-white/3 rounded-lg flex items-center justify-center"
          style={{ color }}
        >
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`
            text-[12px] font-semibold px-1.5 py-0.5 rounded
            ${trend.isUp ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}
          `}>
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[12px] font-medium text-text-dim uppercase tracking-wider">{label}</span>
        <h3 className="text-2xl font-semibold text-text mt-1">{value}</h3>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="no-underline text-inherit block">
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick}>
      {content}
    </div>
  );
}
