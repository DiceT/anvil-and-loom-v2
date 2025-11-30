import { useState, useRef, useEffect } from 'react';
import { Tag, X, Search } from 'lucide-react';
import { useTagStore } from '../../stores/useTagStore';

interface TagBrowserProps {
    onTagSelect: (tag: string) => void;
    currentFilter?: string | null;
}

export function TagBrowser({ onTagSelect, currentFilter }: TagBrowserProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { getAllTags, getTagUsage } = useTagStore();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const allTags = getAllTags();
    const filteredTags = searchQuery
        ? allTags.filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        : allTags;

    // Sort by usage (descending), then alphabetically
    const sortedTags = [...filteredTags].sort((a, b) => {
        const usageA = getTagUsage(a);
        const usageB = getTagUsage(b);
        if (usageA !== usageB) {
            return usageB - usageA;
        }
        return a.localeCompare(b);
    });

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleTagClick = (tag: string) => {
        onTagSelect(tag);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
                title="Browse Tags"
            >
                <Tag className="w-4 h-4" />
            </button>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
                >
                    {/* Search Input */}
                    <div className="p-2 border-b border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-2 top-2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tags..."
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Tag List */}
                    <div className="max-h-64 overflow-y-auto">
                        {sortedTags.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">
                                {searchQuery ? 'No matching tags' : 'No tags yet'}
                            </div>
                        ) : (
                            <div className="p-1">
                                {sortedTags.map((tag) => {
                                    const usage = getTagUsage(tag);
                                    const isActive = currentFilter === tag;

                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagClick(tag)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${isActive
                                                    ? 'bg-purple-900/40 text-purple-200'
                                                    : 'hover:bg-slate-700 text-slate-300'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Tag className="w-3 h-3" />
                                                <span>#{tag}</span>
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {usage}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
