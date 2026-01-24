import React, { useState, useEffect } from 'react';
import { X, Edit3, Image as ImageIcon, Folder } from 'lucide-react';
import { TapestryRegistryEntry } from '../../types/tapestry';

interface EditTapestryDialogProps {
    isOpen: boolean;
    tapestry: TapestryRegistryEntry | null;
    onClose: () => void;
    onSave: (id: string, updates: { name?: string; description?: string; imagePath?: string; path?: string }) => void;
}

export function EditTapestryDialog({ isOpen, tapestry, onClose, onSave }: EditTapestryDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imagePath, setImagePath] = useState('');
    const [path, setPath] = useState('');

    useEffect(() => {
        if (tapestry) {
            setName(tapestry.name);
            setDescription(tapestry.description || '');
            setImagePath(tapestry.imagePath || '');
            setPath(tapestry.path);
        }
    }, [tapestry]);

    if (!isOpen || !tapestry) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        onSave(tapestry.id, {
            name: name.trim(),
            description: description.trim() || undefined,
            imagePath: imagePath.trim() || undefined,
            path: path.trim() !== tapestry.path ? path.trim() : undefined,
        });

        onClose();
    };

    const handleCancel = () => {
        // Reset to original values
        if (tapestry) {
            setName(tapestry.name);
            setDescription(tapestry.description || '');
            setImagePath(tapestry.imagePath || '');
            setPath(tapestry.path);
        }
        onClose();
    };

    const handlePickFolder = async () => {
        try {
            // @ts-ignore
            const newPath = await window.electron.tapestry.pickFolder();
            if (newPath) {
                setPath(newPath);
            }
        } catch (error) {
            console.error('Failed to pick folder:', error);
        }
    };

    const handlePickImage = async () => {
        if (!tapestry) return;
        try {
            const path = await window.electron.tapestry.pickImage(tapestry.path);
            if (path) {
                setImagePath(path);
            }
        } catch (error) {
            console.error('Failed to pick image:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleCancel}
            />

            {/* Dialog */}
            <div className="relative bg-canvas-surface rounded-lg shadow-2xl border border-border w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sapphire/10 rounded-lg">
                            <Edit3 className="w-5 h-5 text-sapphire" />
                        </div>
                        <h2 className="text-xl font-semibold text-type-primary">Edit Tapestry</h2>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-1.5 hover:bg-canvas-panel rounded-md text-type-tertiary hover:text-type-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-type-secondary mb-2">
                            Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="edit-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-canvas-panel border border-border rounded-md text-type-primary placeholder-type-tertiary focus:outline-none focus:ring-2 focus:ring-sapphire"
                            placeholder="Enter tapestry name..."
                            autoFocus
                            required
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-type-secondary mb-2">
                            Location
                        </label>
                        <div className="relative">
                            <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-type-tertiary" />
                            <input
                                type="text"
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                                className="w-full pl-10 pr-24 py-2 bg-canvas-panel border border-border rounded-md text-type-primary placeholder-type-tertiary focus:outline-none focus:ring-2 focus:ring-sapphire font-mono text-xs"
                                placeholder="Select folder..."
                            />
                            <button
                                type="button"
                                onClick={handlePickFolder}
                                className="absolute right-1 top-1 bottom-1 px-3 bg-canvas-surface hover:bg-canvas-panel text-type-secondary rounded text-xs transition-colors border border-border"
                            >
                                Browse...
                            </button>
                        </div>
                        <p className="text-xs text-gold/80 mt-1">
                            Warning: Changing this will point the Tapestry to a new location. Files are not moved.
                        </p>
                        {path !== tapestry.path && (
                            <div className="mt-2 text-xs">
                                <span className="text-type-tertiary">Currently pointing to:</span>
                                <div className="text-type-secondary font-mono break-all bg-canvas-panel/50 p-1.5 rounded border border-border mt-0.5">
                                    {tapestry.path}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-type-secondary mb-2">
                            Description
                        </label>
                        <textarea
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-canvas-panel border border-border rounded-md text-type-primary placeholder-type-tertiary focus:outline-none focus:ring-2 focus:ring-sapphire resize-none"
                            placeholder="Enter a brief description..."
                        />
                    </div>

                    {/* Image Path */}
                    <div>
                        <label htmlFor="edit-imagePath" className="block text-sm font-medium text-type-secondary mb-2">
                            Image Path
                        </label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-type-tertiary" />
                            <input
                                id="edit-imagePath"
                                type="text"
                                value={imagePath}
                                onChange={(e) => setImagePath(e.target.value)}
                                onClick={handlePickImage}
                                className="w-full pl-10 pr-3 py-2 bg-canvas-panel border border-border rounded-md text-type-primary placeholder-type-tertiary focus:outline-none focus:ring-2 focus:ring-sapphire cursor-pointer"
                                placeholder="Click to select image..."
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2 bg-canvas-panel hover:bg-canvas-panel/80 text-type-primary rounded-md transition-colors border border-border"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-sapphire hover:bg-sapphire/80 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!name.trim()}
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
