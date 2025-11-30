import React from 'react';
import { TagChip } from './TagChip';
import { TagInput } from './TagInput';

export interface TagListProps {
    tags: string[];
    onRemove?: (tag: string) => void;
    onAdd?: (tag: string) => void;
    onTagClick?: (tag: string) => void;
    editable?: boolean;
}

export function TagList({ tags, onRemove, onAdd, onTagClick, editable = false }: TagListProps) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
                <TagChip
                    key={tag}
                    tag={tag}
                    onClick={onTagClick ? () => onTagClick(tag) : undefined}
                    onRemove={editable && onRemove ? () => onRemove(tag) : undefined}
                    removable={editable}
                />
            ))}
            {editable && onAdd && (
                <TagInput
                    onAdd={onAdd}
                    existingTags={tags}
                />
            )}
        </div>
    );
}
