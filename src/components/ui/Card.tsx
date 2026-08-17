import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;   // enable lift-on-hover effect
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, padding = 'md', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          'bg-white rounded-3xl shadow-card',
          hover
            ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover cursor-pointer'
            : '',
          paddingClasses[padding],
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
