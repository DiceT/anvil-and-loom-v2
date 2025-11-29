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
            <div className="relative bg-slate-800 rounded-lg shadow-2xl border border-slate-700 w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <FolderPlus className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Create New Tapestry</h2>
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
                        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                            Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter tapestry name..."
                            autoFocus
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            placeholder="Enter a brief description..."
                        />
                    </div>

                    {/* Image Path */}
                    <div>
                        <label htmlFor="imagePath" className="block text-sm font-medium text-slate-300 mb-2">
                            Image Path
                        </label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                id="imagePath"
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

                    {/* Info Text */}
                    <p className="text-xs text-slate-500">
                        The tapestry will be created in your default Tapestries folder.
                    </p>

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
                            Create Tapestry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
