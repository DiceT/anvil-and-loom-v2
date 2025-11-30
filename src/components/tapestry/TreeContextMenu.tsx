import React, { useEffect, useRef } from 'react';
import { FilePlus, FolderPlus, Edit2, Trash2, MoveVertical, Tag } from 'lucide-react';
import { TapestryNode } from '../../types/tapestry';

interface TreeContextMenuProps {
    node: TapestryNode;
    position: { x: number; y: number };
    onClose: () => void;
    onNewEntry: () => void;
    onNewFolder: () => void;
    onRename: () => void;
    onDelete: () => void;
    onMove: () => void;
    onChangeBadge?: () => void;
}

export function TreeContextMenu({
    node,
    position,
    onClose,
    onNewEntry,
    onNewFolder,
    onRename,
    onDelete,
    onMove,
    onChangeBadge
}: TreeContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const isFolder = node.type === 'folder';

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-xl py-1"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            {isFolder && (
                <>
                    <button
                        onClick={() => {
                            onNewEntry();
                            onClose();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                    >
                        <FilePlus className="w-4 h-4" />
                        New Panel
                    </button>
                    <button
                        onClick={() => {
                            onNewFolder();
                            onClose();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                    >
                        <FolderPlus className="w-4 h-4" />
                        New Folder
                    </button>
                    <div className="border-t border-slate-700 my-1" />
                </>
            )}

            <button
                onClick={() => {
                    onRename();
                    onClose();
                }}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
            >
                <Edit2 className="w-4 h-4" />
                Rename
            </button>

            <button
                onClick={() => {
                    onMove();
                    onClose();
                }}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
            >
                <MoveVertical className="w-4 h-4" />
                Move
            </button>

            {!isFolder && onChangeBadge && (
                <button
                    onClick={() => {
                        onChangeBadge();
                        onClose();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                >
                    <Tag className="w-4 h-4" />
                    Change Badge
                </button>
            )}

            <div className="border-t border-slate-700 my-1" />

            <button
                onClick={() => {
                    onDelete();
                    onClose();
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2"
            >
                <Trash2 className="w-4 h-4" />
                Delete
            </button>
        </div>
    );
}
