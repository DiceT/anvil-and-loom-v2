import React, { useEffect, useState } from 'react';
import { FolderTree, Plus } from 'lucide-react';
import { useTapestryStore } from '../../stores/useTapestryStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useTabStore } from '../../stores/useTabStore';
import { TreeNode } from './TreeNode';
import { EntryCategory } from '../../types/tapestry';
import { MoveNodeDialog } from './MoveNodeDialog';

export function TapestryTree() {
    const { tree, loadTree, isLoading } = useTapestryStore();
    const { openEntry, activeEntryId } = useEditorStore();
    const { openTab } = useTabStore();

    const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [currentParentPath, setCurrentParentPath] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [currentName, setCurrentName] = useState('');

    const [newEntryTitle, setNewEntryTitle] = useState('');
    const [newEntryCategory, setNewEntryCategory] = useState<EntryCategory>('other');
    const [newFolderName, setNewFolderName] = useState('');
    const [renameName, setRenameName] = useState('');

    useEffect(() => {
        loadTree();
    }, [loadTree]);

    const handleEntryClick = async (path: string) => {
        try {
            // Load the entry first to get its data
            const entry = await window.electron.tapestry.loadEntry(path);
            if (!entry) {
                console.error('Entry not found:', path);
                return;
            }

            // Open tab in useTabStore
            openTab({
                id: entry.id,
                type: 'entry',
                title: entry.title,
                data: { path },
            });

            // Open entry in useEditorStore
            await openEntry(path);
        } catch (err) {
            console.error('Failed to open entry:', err);
        }
    };

    const handleNewEntry = (parentPath: string) => {
        setCurrentParentPath(parentPath);
        setNewEntryTitle('');
        setNewEntryCategory('other');
        setShowNewEntryDialog(true);
    };

    const handleNewFolder = (parentPath: string) => {
        setCurrentParentPath(parentPath);
        setNewFolderName('');
        setShowNewFolderDialog(true);
    };

    const handleRename = (path: string, name: string) => {
        setCurrentPath(path);
        setCurrentName(name);
        setRenameName(name);
        setShowRenameDialog(true);
    };

    const handleDelete = (path: string, name: string) => {
        setCurrentPath(path);
        setCurrentName(name);
        setShowDeleteDialog(true);
    };

    const confirmNewEntry = async () => {
        if (!newEntryTitle.trim()) return;

        try {
            await window.electron.tapestry.createEntry(currentParentPath, newEntryTitle.trim(), newEntryCategory);
            await loadTree();
            setShowNewEntryDialog(false);
        } catch (err) {
            console.error('Failed to create entry:', err);
        }
    };

    const confirmNewFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            await window.electron.tapestry.createFolder(currentParentPath, newFolderName.trim());
            await loadTree();
            setShowNewFolderDialog(false);
        } catch (err) {
            console.error('Failed to create folder:', err);
        }
    };

    const confirmRename = async () => {
        if (!renameName.trim() || renameName === currentName) {
            setShowRenameDialog(false);
            return;
        }

        try {
            await window.electron.tapestry.rename(currentPath, renameName.trim());
            await loadTree();
            setShowRenameDialog(false);
        } catch (err) {
            console.error('Failed to rename:', err);
        }
    };

    const confirmDelete = async () => {
        try {
            await window.electron.tapestry.deleteNode(currentPath);
            await loadTree();
            setShowDeleteDialog(false);
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const handleMove = (path: string, name: string) => {
        setCurrentPath(path);
        setCurrentName(name);
        setShowMoveDialog(true);
    };

    const confirmMove = async (targetPath: string) => {
        try {
            // Extract the actual filename from the path (e.g., "entry.md" instead of display title)
            const fileName = currentPath.split(/[\\/]/).pop() || currentName;
            await window.electron.tapestry.move(currentPath, targetPath, fileName);
            await loadTree();
            setShowMoveDialog(false);
        } catch (err) {
            console.error('Failed to move:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                Loading tree...
            </div>
        );
    }

    if (!tree || !tree.children) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                <FolderTree className="w-12 h-12 mb-2 text-slate-600" />
                <p className="text-sm text-center">No entries yet</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Explorer</span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => handleNewFolder(tree.path)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                            title="New Folder"
                        >
                            <FolderTree className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleNewEntry(tree.path)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                            title="New Entry"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {tree.children.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                            <p className="text-sm text-center">Empty tapestry</p>
                        </div>
                    ) : (
                        tree.children.map((node) => (
                            <TreeNode
                                key={node.id}
                                node={node}
                                parentPath={tree.path}
                                depth={0}
                                activeEntryId={activeEntryId}
                                onEntryClick={handleEntryClick}
                                onNewEntry={handleNewEntry}
                                onNewFolder={handleNewFolder}
                                onRename={handleRename}
                                onDelete={handleDelete}
                                onMove={handleMove}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* New Entry Dialog */}
            {showNewEntryDialog && (
                <Dialog
                    title="New Entry"
                    onClose={() => setShowNewEntryDialog(false)}
                    onConfirm={confirmNewEntry}
                    confirmText="Create"
                    confirmDisabled={!newEntryTitle.trim()}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={newEntryTitle}
                                onChange={(e) => setNewEntryTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Entry title..."
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newEntryTitle.trim()) {
                                        confirmNewEntry();
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Category
                            </label>
                            <select
                                value={newEntryCategory}
                                onChange={(e) => setNewEntryCategory(e.target.value as EntryCategory)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="world">World</option>
                                <option value="session">Session</option>
                                <option value="npc">NPC</option>
                                <option value="lore">Lore</option>
                                <option value="mechanics">Mechanics</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </Dialog>
            )}

            {/* New Folder Dialog */}
            {showNewFolderDialog && (
                <Dialog
                    title="Create New Folder"
                    onClose={() => setShowNewFolderDialog(false)}
                    onConfirm={confirmNewFolder}
                    confirmText="Create"
                    confirmDisabled={!newFolderName.trim()}
                >
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Folder Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Folder name..."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newFolderName.trim()) {
                                    confirmNewFolder();
                                }
                            }}
                        />
                    </div>
                </Dialog>
            )}

            {/* Rename Dialog */}
            {showRenameDialog && (
                <Dialog
                    title="Rename"
                    onClose={() => setShowRenameDialog(false)}
                    onConfirm={confirmRename}
                    confirmText="Rename"
                    confirmDisabled={!renameName.trim() || renameName === currentName}
                >
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            New Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={renameName}
                            onChange={(e) => setRenameName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="New name..."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && renameName.trim() && renameName !== currentName) {
                                    confirmRename();
                                }
                            }}
                        />
                    </div>
                </Dialog>
            )}

            {/* Move Dialog */}
            {showMoveDialog && (
                <MoveNodeDialog
                    nodePath={currentPath}
                    nodeName={currentName}
                    tree={tree}
                    onClose={() => setShowMoveDialog(false)}
                    onConfirm={confirmMove}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <Dialog
                    title="Confirm Delete"
                    onClose={() => setShowDeleteDialog(false)}
                    onConfirm={confirmDelete}
                    confirmText="Delete"
                    confirmDanger
                >
                    <p className="text-slate-300">
                        Are you sure you want to delete <span className="font-semibold text-white">{currentName}</span>?
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                        This action cannot be undone.
                    </p>
                </Dialog>
            )}
        </>
    );
}


// Simple Dialog Component
interface DialogProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
    confirmText: string;
    confirmDisabled?: boolean;
    confirmDanger?: boolean;
}

function Dialog({ title, children, onClose, onConfirm, confirmText, confirmDisabled, confirmDanger }: DialogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-800 rounded-lg shadow-2xl border border-slate-700 w-full max-w-md mx-4">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                </div>
                <div className="p-6">
                    {children}
                </div>
                <div className="flex gap-3 p-6 border-t border-slate-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={confirmDisabled}
                        className={`flex-1 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmDanger
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
