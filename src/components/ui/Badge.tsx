type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'sakura';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;   // show a colored dot before text
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-fuji-success/10 text-fuji-success',
  warning: 'bg-fuji-warning/10 text-fuji-warning',
  error:   'bg-fuji-error/10   text-fuji-error',
  info:    'bg-blue-50         text-blue-600',
  neutral: 'bg-fuji-soft-gray  text-fuji-charcoal/60',
  sakura:  'bg-fuji-sakura/10  text-fuji-sakura',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-fuji-success',
  warning: 'bg-fuji-warning',
  error:   'bg-fuji-error',
  info:    'bg-blue-500',
  neutral: 'bg-fuji-charcoal/40',
  sakura:  'bg-fuji-sakura',
};

export default function Badge({
  variant = 'neutral',
  dot = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5',
        'text-caption font-semibold font-sans',
        'px-2.5 py-0.5 rounded-full',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
