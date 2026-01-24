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
            <div className="relative bg-slate-800 rounded-lg shadow-2xl border border-slate-700 w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Edit3 className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Edit Tapestry</h2>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-slate-300 mb-2">
                            Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="edit-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter tapestry name..."
                            autoFocus
                            required
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Location
                        </label>
                        <div className="relative">
                            <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                                className="w-full pl-10 pr-24 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                                placeholder="Select folder..."
                            />
                            <button
                                type="button"
                                onClick={handlePickFolder}
                                className="absolute right-1 top-1 bottom-1 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors border border-slate-600"
                            >
                                Browse...
                            </button>
                        </div>
                        <p className="text-xs text-yellow-500/80 mt-1">
                            Warning: Changing this will point the Tapestry to a new location. Files are not moved.
                        </p>
                        {path !== tapestry.path && (
                            <div className="mt-2 text-xs">
                                <span className="text-slate-500">Currently pointing to:</span>
                                <div className="text-slate-400 font-mono break-all bg-slate-900/30 p-1.5 rounded border border-slate-800 mt-0.5">
                                    {tapestry.path}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            placeholder="Enter a brief description..."
                        />
                    </div>

                    {/* Image Path */}
                    <div>
                        <label htmlFor="edit-imagePath" className="block text-sm font-medium text-slate-300 mb-2">
                            Image Path
                        </label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                id="edit-imagePath"
                                type="text"
                                value={imagePath}
                                onChange={(e) => setImagePath(e.target.value)}
                                onClick={handlePickImage}
                                className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
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
                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
