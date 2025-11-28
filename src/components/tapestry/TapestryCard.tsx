import React, { useState } from 'react';
import { Calendar, FolderOpen, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { TapestryRegistryEntry } from '../../types/tapestry';

interface TapestryCardProps {
    tapestry: TapestryRegistryEntry;
    onOpen: (id: string) => void;
    onEdit: (id: string) => void;
    onRemove: (id: string) => void;
    onDelete: (id: string) => void;
}

export function TapestryCard({ tapestry, onOpen, onEdit, onRemove, onDelete }: TapestryCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    // Simple relative time formatting
    const formatRelativeTime = (dateString: string | undefined) => {
        if (!dateString) return 'Never opened';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    const lastOpened = formatRelativeTime(tapestry.lastOpenedAt);

    return (
        <div className="group relative bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-purple-500/50 transition-all duration-200">
            {/* Thumbnail */}
            <div className="relative h-32 bg-gradient-to-br from-purple-900/30 to-slate-900 overflow-hidden">
                {tapestry.imagePath ? (
                    <img
                        src={tapestry.imagePath}
                        alt={tapestry.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FolderOpen className="w-12 h-12 text-purple-400/30" />
                    </div>
                )}

                {/* Menu Button */}
                <div className="absolute top-2 right-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1.5 bg-slate-900/80 hover:bg-slate-900 rounded-md text-slate-300 hover:text-white transition-colors backdrop-blur-sm"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div className="absolute right-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-10">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(tapestry.id);
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(tapestry.id);
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                            >
                                <FolderOpen className="w-3.5 h-3.5" />
                                Remove from list
                            </button>
                            <div className="border-t border-slate-700" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(tapestry.id);
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete from disk
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div
                onClick={() => onOpen(tapestry.id)}
                className="p-4 cursor-pointer"
            >
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                    {tapestry.name}
                </h3>

                {tapestry.description && (
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                        {tapestry.description}
                    </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{lastOpened}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
