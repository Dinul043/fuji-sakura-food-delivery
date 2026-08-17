'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-fuji-sakura text-white hover:bg-[#d44d7a] shadow-sakura',
  secondary: 'bg-fuji-soft-gray text-fuji-charcoal hover:bg-[#dedede]',
  ghost:     'bg-transparent text-fuji-charcoal hover:bg-fuji-soft-gray',
  danger:    'bg-fuji-error text-white hover:bg-[#dc2626]',
  outline:   'bg-transparent border border-fuji-sakura text-fuji-sakura hover:bg-fuji-sakura hover:text-white',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-label rounded-xl gap-1.5',
  md: 'h-11 px-6 text-body rounded-2xl gap-2',
  lg: 'h-13 px-8 text-body-lg rounded-2xl gap-2.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      className = '',
      disabled,
      onClick,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        // cast ref — motion accepts HTMLButtonElement ref
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        whileTap={{ scale: isDisabled ? 1 : 0.97 }}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        transition={{ duration: 0.15 }}
        disabled={isDisabled}
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        className={[
          'inline-flex items-center justify-center font-sans font-semibold',
          'transition-colors duration-150 cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuji-sakura focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'min-w-[44px] min-h-[44px]',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        // spread only safe HTML attrs (not motion-specific)
        aria-label={(rest as React.AriaAttributes)['aria-label']}
        aria-disabled={isDisabled}
      >
        {loading ? (
          <>
            <span className="sr-only">Loading</span>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="shrink-0" aria-hidden="true">{icon}</span>
            )}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && (
              <span className="shrink-0" aria-hidden="true">{icon}</span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
