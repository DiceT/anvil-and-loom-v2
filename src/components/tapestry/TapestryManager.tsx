import React, { useEffect, useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useTapestryStore } from '../../stores/useTapestryStore';
import { TapestryCard } from './TapestryCard';
import { CreateTapestryDialog } from './CreateTapestryDialog';
import { EditTapestryDialog } from './EditTapestryDialog';
import { TapestryRegistryEntry } from '../../types/tapestry';

export function TapestryManager() {
    const {
        registry,
        isLoading,
        error,
        loadRegistry,
        createTapestry,
        openTapestry,
        updateTapestry,
        removeTapestry,
        deleteTapestry,
        clearError,
    } = useTapestryStore();

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingTapestry, setEditingTapestry] = useState<TapestryRegistryEntry | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        loadRegistry();
    }, [loadRegistry]);

    const handleCreate = async (data: { name: string; description?: string; imagePath?: string }) => {
        try {
            const id = await createTapestry(data);
            await openTapestry(id);
        } catch (err) {
            console.error('Failed to create tapestry:', err);
        }
    };

    const handleOpen = async (id: string) => {
        try {
            await openTapestry(id);
            // Build stitch index
            const { useStitchStore } = await import('../../stores/useStitchStore');
            useStitchStore.getState().buildIndex(id);
        } catch (err) {
            console.error('Failed to open tapestry:', err);
        }
    };

    const handleEdit = (id: string) => {
        const tapestry = registry.tapestries.find((t) => t.id === id);
        if (tapestry) {
            setEditingTapestry(tapestry);
            setShowEditDialog(true);
        }
    };

    const handleSaveEdit = async (id: string, updates: { name?: string; description?: string; imagePath?: string }) => {
        try {
            await updateTapestry(id, updates);
            setShowEditDialog(false);
            setEditingTapestry(null);
        } catch (err) {
            console.error('Failed to update tapestry:', err);
        }
    };

    const handleRemove = async (id: string) => {
        if (confirm('Remove this tapestry from the list? The files will not be deleted.')) {
            try {
                await removeTapestry(id);
            } catch (err) {
                console.error('Failed to remove tapestry:', err);
            }
        }
    };

    const handleDelete = async (id: string) => {
        const tapestry = registry.tapestries.find((t) => t.id === id);
        if (!tapestry) return;

        if (deleteConfirm === id) {
            try {
                await deleteTapestry(id);
                setDeleteConfirm(null);
            } catch (err) {
                console.error('Failed to delete tapestry:', err);
            }
        } else {
            setDeleteConfirm(id);
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    const sortedTapestries = [...registry.tapestries].sort((a, b) => {
        const dateA = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
        const dateB = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Your Tapestries</h1>
                            <p className="text-slate-400">
                                Choose a tapestry to continue, or create a new one
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-lg shadow-purple-500/20"
                        >
                            <Plus className="w-5 h-5" />
                            New Tapestry
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-300">{error}</p>
                        </div>
                        <button
                            onClick={clearError}
                            className="text-red-400 hover:text-red-300 text-sm"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-slate-400">Loading tapestries...</div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && sortedTapestries.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                            <Plus className="w-10 h-10 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">No Tapestries Yet</h2>
                        <p className="text-slate-400 mb-6 text-center max-w-md">
                            Create your first tapestry to start building your world, tracking sessions, and weaving your story.
                        </p>
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Tapestry
                        </button>
                    </div>
                )}

                {/* Tapestry Grid */}
                {!isLoading && sortedTapestries.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedTapestries.map((tapestry) => (
                            <div key={tapestry.id} className="relative">
                                <TapestryCard
                                    tapestry={tapestry}
                                    onOpen={handleOpen}
                                    onEdit={handleEdit}
                                    onRemove={handleRemove}
                                    onDelete={handleDelete}
                                />
                                {deleteConfirm === tapestry.id && (
                                    <div
                                        className="absolute inset-0 bg-red-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center p-4 cursor-pointer"
                                        onClick={() => handleDelete(tapestry.id)}
                                    >
                                        <div className="text-center">
                                            <p className="text-white font-semibold mb-2">Click again to confirm deletion</p>
                                            <p className="text-red-200 text-sm">This will permanently delete all files</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <CreateTapestryDialog
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onCreate={handleCreate}
            />

            <EditTapestryDialog
                isOpen={showEditDialog}
                tapestry={editingTapestry}
                onClose={() => {
                    setShowEditDialog(false);
                    setEditingTapestry(null);
                }}
                onSave={handleSaveEdit}
            />
        </div>
    );
}
