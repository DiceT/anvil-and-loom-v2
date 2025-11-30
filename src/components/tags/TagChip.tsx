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
                bg-purple-500/10 
                border border-purple-500/20 
                text-purple-400 
                text-xs font-medium 
                rounded-full
                ${onClick ? 'hover:bg-purple-500/20 cursor-pointer' : ''}
                transition-colors
            `}
            onClick={handleClick}
        >
            {displayTag}
            {removable && onRemove && (
                <button
                    onClick={handleRemove}
                    className="hover:text-purple-300 transition-colors p-0.5"
                    aria-label={`Remove tag ${displayTag}`}
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
}
