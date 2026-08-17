interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Predefined shape shortcuts */
  shape?: 'line' | 'circle' | 'card' | 'avatar';
}

export default function Skeleton({ shape, className = '', ...props }: SkeletonProps) {
  const shapeClass =
    shape === 'circle' ? 'rounded-full' :
    shape === 'card'   ? 'rounded-3xl h-64 w-full' :
    shape === 'avatar' ? 'rounded-full h-10 w-10' :
    shape === 'line'   ? 'rounded-lg h-4 w-full' :
    '';

  return (
    <div
      className={[
        'animate-pulse bg-fuji-soft-gray',
        shapeClass,
        className,
      ].join(' ')}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Convenience: Restaurant card skeleton */
export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 flex flex-col gap-3">
        <Skeleton shape="line" className="w-3/4 h-5" />
        <Skeleton shape="line" className="w-1/2 h-4" />
        <div className="flex gap-3">
          <Skeleton shape="line" className="w-1/3 h-4" />
          <Skeleton shape="line" className="w-1/3 h-4" />
        </div>
      </div>
    </div>
  );
}
