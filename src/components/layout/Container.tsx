interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm:   'max-w-2xl',
  md:   'max-w-4xl',
  lg:   'max-w-6xl',
  xl:   'max-w-7xl',
  full: 'max-w-full',
};

export default function Container({
  size = 'xl',
  className = '',
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={[
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
