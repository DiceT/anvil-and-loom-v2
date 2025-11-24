import { LucideIcon } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

type IconButtonSize = 's' | 'm' | 'l' | 'xl';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  size?: IconButtonSize;
  active?: boolean;
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
        ${
          active
            ? 'text-slate-50 drop-shadow-[0_0_8px_rgba(148,163,184,0.5)]'
            : 'text-slate-500 hover:text-blue-400 hover:drop-shadow-[0_0_6px_rgba(96,165,250,0.4)]'
        }
        focus:outline-none
        focus:drop-shadow-[0_0_10px_rgba(96,165,250,0.6)]
        ${className}
      `}
      {...props}
    >
      <Icon className={iconSize} />
    </button>
  );
}
