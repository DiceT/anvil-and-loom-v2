import React, { useState } from 'react';
import { X, FolderPlus, Image as ImageIcon } from 'lucide-react';

interface CreateTapestryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { name: string; description?: string; imagePath?: string }) => void;
}

export function CreateTapestryDialog({ isOpen, onClose, onCreate }: CreateTapestryDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imagePath, setImagePath] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        onCreate({
            name: name.trim(),
            description: description.trim() || undefined,
            imagePath: imagePath.trim() || undefined,
        });

        // Reset form
        setName('');
        setDescription('');
        setImagePath('');
        onClose();
    };

    const handleCancel = () => {
        setName('');
        setDescription('');
        setImagePath('');
        onClose();
    };

    const handlePickImage = async () => {
        try {
            const path = await window.electron.tapestry.pickImage();
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
                            <FolderPlus className="w-5 h-5 text-sapphire" />
                        </div>
                        <h2 className="text-xl font-semibold text-type-primary">Create New Tapestry</h2>
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
                        <label htmlFor="name" className="block text-sm font-medium text-type-secondary mb-2">
                            Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-canvas-panel border border-border rounded-md text-type-primary placeholder-type-tertiary focus:outline-none focus:ring-2 focus:ring-sapphire"
                            placeholder="Enter tapestry name..."
                            autoFocus
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-type-secondary mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-canvas-panel border border-border rounded-md text-type-primary placeholder-type-tertiary focus:outline-none focus:ring-2 focus:ring-sapphire resize-none"
                            placeholder="Enter a brief description..."
                        />
                    </div>

                    {/* Image Path */}
                    <div>
                        <label htmlFor="imagePath" className="block text-sm font-medium text-type-secondary mb-2">
                            Image Path
                        </label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-type-tertiary" />
                            <input
                                id="imagePath"
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

                    {/* Info Text */}
                    <p className="text-xs text-type-tertiary">
                        The tapestry will be created in your default Tapestries folder.
                    </p>

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
                            Create Tapestry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
