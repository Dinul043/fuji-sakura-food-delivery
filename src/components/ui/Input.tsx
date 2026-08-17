import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;       // left icon
  iconRight?: React.ReactNode;  // right icon (e.g. clear button)
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-label font-semibold text-fuji-charcoal font-sans"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fuji-charcoal/40 pointer-events-none"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full h-11 font-sans text-body text-fuji-charcoal',
              'bg-white border rounded-2xl outline-none',
              'placeholder:text-fuji-charcoal/35',
              'transition-colors duration-150',
              error
                ? 'border-fuji-error focus:ring-2 focus:ring-fuji-error/20'
                : 'border-fuji-soft-gray focus:border-fuji-sakura focus:ring-2 focus:ring-fuji-sakura/15',
              icon    ? 'pl-10'  : 'pl-4',
              iconRight ? 'pr-10' : 'pr-4',
              className,
            ].join(' ')}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />

          {iconRight && (
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fuji-charcoal/40"
              aria-hidden="true"
            >
              {iconRight}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-caption text-fuji-error font-sans" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-caption text-fuji-charcoal/50 font-sans">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
