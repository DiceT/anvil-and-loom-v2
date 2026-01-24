import React from 'react';
import { X } from 'lucide-react';
import { formatTag } from '../../utils/tags';

export interface TagChipProps {
    tag: string;
    onRemove?: () => void;
    onClick?: () => void;
    removable?: boolean;
}

export function TagChip({ tag, onRemove, onClick, removable = false }: TagChipProps) {
    const displayTag = formatTag(tag);

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            e.stopPropagation();
            onClick();
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemove) {
            onRemove();
        }
    };

    return (
        <span
            className={`
                inline-flex items-center gap-1 
                px-2 py-0.5 
                bg-amethyst/10 
                border border-amethyst/20 
                text-amethyst 
                text-xs font-medium 
                rounded-full
                ${onClick ? 'hover:bg-amethyst/20 cursor-pointer' : ''}
                transition-colors
            `}
            onClick={handleClick}
        >
            {displayTag}
            {removable && onRemove && (
                <button
                    onClick={handleRemove}
                    className="hover:text-amethyst/80 transition-colors p-0.5"
                    aria-label={`Remove tag ${displayTag}`}
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
}
