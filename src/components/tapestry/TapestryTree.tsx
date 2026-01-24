import React, { useEffect, useState, useMemo } from 'react';
import { FolderTree, Plus, X, Tag } from 'lucide-react';
import { useTapestryStore } from '../../stores/useTapestryStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useTabStore } from '../../stores/useTabStore';
import { useTagStore } from '../../stores/useTagStore';
import { TreeNode } from './TreeNode';
import { EntryCategory, TapestryNode } from '../../types/tapestry';
import { MoveNodeDialog } from './MoveNodeDialog';


import { Dialog } from '../ui/Dialog';

export function TapestryTree() {
    const { tree, loadTree, isLoading, activeTagFilter, setTagFilter } = useTapestryStore();
    const { getPanelsWithTag } = useTagStore();
    const { openEntry, activeEntryId, handleRename: updateStoreAfterRename } = useEditorStore();
    const { openTab } = useTabStore();

    const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showChangeBadgeDialog, setShowChangeBadgeDialog] = useState(false);

    const [currentParentPath, setCurrentParentPath] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [currentName, setCurrentName] = useState('');

    const [newEntryTitle, setNewEntryTitle] = useState('');
    const [newEntryCategory, setNewEntryCategory] = useState<EntryCategory>('other');
    const [newFolderName, setNewFolderName] = useState('');
    const [renameName, setRenameName] = useState('');
    const [changeBadgeCategory, setChangeBadgeCategory] = useState<EntryCategory>('other');

    useEffect(() => {
        loadTree();
    }, [loadTree]);

    // Filter tree based on active tag
    const filteredTree = useMemo(() => {
        if (!tree || !activeTagFilter) return tree;

        const panelsWithTag = new Set(getPanelsWithTag(activeTagFilter));

        const filterNode = (node: TapestryNode): TapestryNode | null => {
            if (node.type === 'entry') {
                // Keep entry if it has the tag
                return panelsWithTag.has(node.id) ? node : null;
            }

            if (node.type === 'folder' && node.children) {
                // Filter children
                const filteredChildren = node.children
                    .map(filterNode)
                    .filter((child): child is TapestryNode => child !== null);

                // Keep folder if it has matching children
                if (filteredChildren.length > 0) {
                    return { ...node, children: filteredChildren };
                }
            }

            return null;
        };

        // Special case for root: always keep it, just filter children
        if (tree.children) {
            const filteredChildren = tree.children
                .map(filterNode)
                .filter((child): child is TapestryNode => child !== null);

            return { ...tree, children: filteredChildren };
        }

        return tree;
    }, [tree, activeTagFilter, getPanelsWithTag]);

    const handleEntryClick = async (path: string) => {
        try {
            // Load the entry first to get its data
            const entry = await window.electron.tapestry.loadEntry(path);
            if (!entry) {
                console.error('Entry not found:', path);
                return;
            }

            // Open tab in useTabStore
            const isMap = entry.category === 'map';
            openTab({
                id: entry.id,
                type: isMap ? 'map' : 'entry',
                title: entry.title,
                data: { path },
            });

            // Open entry in useEditorStore for ALL types (so activeEntryId is set)
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
            const result = await window.electron.tapestry.createEntry(currentParentPath, newEntryTitle.trim(), newEntryCategory);
            await loadTree();
            setShowNewEntryDialog(false);
            // Auto-open the newly created panel
            if (result?.path) {
                try {
                    await openEntry(result.path);
                } catch (openErr) {
                    console.error('Failed to open newly created entry:', openErr);
                }
            }
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
            const newPath = await window.electron.tapestry.rename(currentPath, renameName.trim());
            // Update editor store BEFORE reloading tree to ensure UI updates immediately
            if (newPath && typeof newPath === 'string') {
                updateStoreAfterRename(currentPath, newPath, renameName.trim());
            }
            await loadTree();
            setShowRenameDialog(false);
        } catch (err) {
            console.error('Failed to rename:', err);
        }
    };

    const confirmDelete = async () => {
        try {
            // Check if the entry is open and close it
            const entry = useEditorStore.getState().openEntries.find(e => e.path === currentPath);
            if (entry) {
                await useEditorStore.getState().closeEntry(entry.id);
            }

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

    const handleDropNode = async (draggedPath: string, targetPath: string) => {
        if (draggedPath === targetPath) return;
        try {
            const fileName = draggedPath.split(/[\\/]/).pop() || 'entry';
            await window.electron.tapestry.move(draggedPath, targetPath, fileName);
            await loadTree();
        } catch (err) {
            console.error('Failed to move node:', err);
        }
    };

    const handleChangeBadge = (path: string, currentCategory: string) => {
        setCurrentPath(path);
        setChangeBadgeCategory((currentCategory as EntryCategory) || 'other');
        setShowChangeBadgeDialog(true);
    };

    const confirmChangeBadge = async () => {
        try {
            // Load the entry
            const entry = await window.electron.tapestry.loadEntry(currentPath);
            if (!entry) return;

            // Update the category in frontmatter
            entry.frontmatter.category = changeBadgeCategory;

            // Save it back
            await window.electron.tapestry.saveEntry(entry);
            await loadTree();
            setShowChangeBadgeDialog(false);
        } catch (err) {
            console.error('Failed to change badge:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                Loading tree...
            </div>
        );
    }

    if (!filteredTree || !filteredTree.children) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                <FolderTree className="w-12 h-12 mb-2 text-slate-600" />
                <p className="text-sm text-center">
                    {activeTagFilter ? `No entries found with tag #${activeTagFilter}` : 'No entries yet'}
                </p>
                {activeTagFilter && (
                    <button
                        onClick={() => setTagFilter(null)}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                    >
                        Clear filter
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800">
            <div className="flex items-center justify-between p-3 border-b border-slate-800">
                <div className="flex items-center gap-0 -space-x-1">
                    <button
                        onClick={() => handleNewFolder(tree?.path || '')}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
                        title="New Folder"
                    >
                        <FolderTree className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleNewEntry(tree?.path || '')}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
                        title="New Panel"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Active Filter Bar */}
            {activeTagFilter && (
                <div className="px-4 py-2 bg-purple-900/20 border-b border-purple-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-300">
                            Filtering by <span className="font-medium text-purple-200">#{activeTagFilter}</span>
                        </span>
                    </div>
                    <button
                        onClick={() => setTagFilter(null)}
                        className="p-1 hover:bg-purple-500/20 rounded-full text-purple-400 hover:text-purple-200 transition-colors"
                        title="Clear filter"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto p-2">
                {filteredTree.children.map((node) => (
                    <TreeNode
                        key={node.id}
                        node={node}
                        parentPath={tree?.path || ''}
                        depth={0}
                        activeEntryId={activeEntryId}
                        onEntryClick={handleEntryClick}
                        onNewEntry={handleNewEntry}
                        onNewFolder={handleNewFolder}
                        onRename={handleRename}
                        onDelete={handleDelete}
                        onMove={handleMove}
                        onChangeBadge={handleChangeBadge}
                        onDropNode={handleDropNode}
                    />
                ))}
            </div>

            {/* New Panel Dialog */}
            {showNewEntryDialog && (
                <Dialog
                    title="New Panel"
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
                                placeholder="Panel title..."
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
            {showMoveDialog && tree && (
                <MoveNodeDialog
                    nodePath={currentPath}
                    nodeName={currentName}
                    tree={tree}
                    onClose={() => setShowMoveDialog(false)}
                    onConfirm={confirmMove}
                />
            )}

            {/* Change Badge Dialog */}
            {showChangeBadgeDialog && (
                <Dialog
                    title="Change Badge"
                    onClose={() => setShowChangeBadgeDialog(false)}
                    onConfirm={confirmChangeBadge}
                    confirmText="Change"
                >
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Category
                        </label>
                        <select
                            value={changeBadgeCategory}
                            onChange={(e) => setChangeBadgeCategory(e.target.value as EntryCategory)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                        >
                            <option value="world">World</option>
                            <option value="session">Session</option>
                            <option value="npc">NPC</option>
                            <option value="lore">Lore</option>
                            <option value="mechanics">Mechanics</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </Dialog>
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
        </div>
    );
}



