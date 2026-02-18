import Image from 'next/image';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable Icon component for SVG icons
 * 
 * Usage:
 * <Icon name="navigation/home" size={24} />
 * <Icon name="actions/cart" size={20} />
 * <Icon name="status/star" size={16} />
 */
export default function Icon({ name, size = 24, color, className, style }: IconProps) {
  return (
    <Image
      src={`/icons/${name}.svg`}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
    />
  );
}
