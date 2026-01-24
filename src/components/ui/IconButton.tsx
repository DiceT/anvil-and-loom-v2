import { LucideIcon } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

type IconButtonSize = 's' | 'm' | 'l' | 'xl';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  icon: LucideIcon;
  size?: IconButtonSize;
  active?: boolean;
  tooltip?: string;
}

const sizeClasses: Record<IconButtonSize, { icon: string; button: string }> = {
  s: { icon: 'w-4 h-4', button: 'p-1' },
  m: { icon: 'w-6 h-6', button: 'p-1' },
  l: { icon: 'w-8 h-8', button: 'p-1' },
  xl: { icon: 'w-10 h-10', button: 'p-1' },
};

export function IconButton({
  icon: Icon,
  size = 'm',
  active = false,
  tooltip,
  className = '',
  ...props
}: IconButtonProps) {
  const { icon: iconSize, button: buttonPadding } = sizeClasses[size];

  return (
    <button
      className={`
        ${buttonPadding}
        rounded
        transition-all
        duration-200
        ${active
          ? 'text-type-primary drop-shadow-[0_0_8px_rgba(232,228,220,0.5)]'
          : 'text-type-tertiary hover:text-sapphire hover:drop-shadow-[0_0_6px_rgba(107,158,221,0.4)]'
        }
        focus:outline-none
        focus:drop-shadow-[0_0_10px_rgba(107,158,221,0.6)]
        ${className}
      `}
      {...(tooltip ? { 'data-tooltip': tooltip } : {})}
      {...props}
    >
      <Icon className={iconSize} />
    </button>
  );
}
