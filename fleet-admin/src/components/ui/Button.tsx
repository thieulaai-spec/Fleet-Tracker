'use client';

import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  href?: string;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  fullWidth,
  icon, 
  href,
  className = '', 
  type = 'button',
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-white hover:brightness-110 hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)]',
    secondary: 'bg-transparent text-text border border-outline-variant hover:bg-surface-high hover:border-outline',
    danger: 'bg-transparent text-danger border border-danger/30 hover:bg-danger/10',
    ghost: 'bg-transparent text-text-muted hover:bg-surface-high hover:text-text hover:border-outline-variant',
  };

  const sizes = {
    sm: 'px-md py-xs text-xs h-9',
    md: 'px-lg py-sm text-sm h-11',
    lg: 'px-xl py-md text-base h-14',
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2 
    rounded-default font-semibold transition-all duration-200 
    active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none
    ${fullWidth ? 'w-full' : ''}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `;

  const content = (
    <>
      {isLoading && <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-current rounded-full animate-spin" />}
      {!isLoading && icon && <span className="flex items-center">{icon}</span>}
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses} {...(props as any)}>
        {content}
      </Link>
    );
  }

  return (
    <button 
      type={type}
      className={baseClasses}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {content}
    </button>
  );
}
