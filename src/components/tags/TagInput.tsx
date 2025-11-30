import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { normalizeTag, isValidTag } from '../../utils/tags';

export interface TagInputProps {
    onAdd: (tag: string) => void;
    existingTags?: string[];
    placeholder?: string;
}

export function TagInput({ onAdd, existingTags = [], placeholder = 'Add tag...' }: TagInputProps) {
    const [value, setValue] = useState('');
    const [isInputVisible, setIsInputVisible] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isInputVisible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isInputVisible]);

    const handleSubmit = () => {
        if (!value.trim()) {
            setIsInputVisible(false);
            return;
        }

        const normalized = normalizeTag(value);

        // Validate tag
        if (!isValidTag(normalized)) {
            return; // Could show error message here in future
        }

        // Check for duplicates
        if (existingTags.includes(normalized)) {
            setValue('');
            return;
        }

        onAdd(normalized);
        setValue('');
        setIsInputVisible(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            setValue('');
            setIsInputVisible(false);
        }
    };

    const handleBlur = () => {
        // Small delay to allow click events to fire
        setTimeout(() => {
            if (value.trim()) {
                handleSubmit();
            } else {
                setIsInputVisible(false);
            }
        }, 150);
    };

    if (!isInputVisible) {
        return (
            <button
                onClick={() => setIsInputVisible(true)}
                className="
                    inline-flex items-center gap-1 
                    px-2 py-0.5 
                    bg-slate-700/50 
                    border border-slate-600/50 
                    text-slate-400 
                    text-xs font-medium 
                    rounded-full
                    hover:bg-slate-700 
                    hover:border-slate-600
                    hover:text-slate-300
                    transition-colors
                "
            >
                <Plus className="w-3 h-3" />
                Tag
            </button>
        );
    }

    return (
        <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="
                px-2 py-0.5 
                bg-slate-900 
                border border-purple-500/50
                text-slate-300 text-xs 
                rounded-md
                focus:outline-none 
                focus:ring-1 
                focus:ring-purple-500
                w-32
            "
            placeholder={placeholder}
        />
    );
}
