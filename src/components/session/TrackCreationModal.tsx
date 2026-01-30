import React, { useState } from 'react';
import { useSessionModalStore } from '../../stores/useSessionModalStore';
import { useSessionActions } from '../../hooks/useSessionActions';
import { X } from 'lucide-react';

export const TrackCreationModal = () => {
    const { activeModal, closeModal } = useSessionModalStore();
    const { dispatch } = useSessionActions();

    const [name, setName] = useState('');
    const [difficulty, setDifficulty] = useState<string>('Troublesome');

    if (activeModal !== 'track') return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Map difficulty to segments/ticks
        // Ironsworn logic:
        // Troublesome: 12 boxes (3 ticks per progress) - wait, standard tracks are always 10 boxes usually?
        // Ironsworn progress tracks are fixed 10 boxes.
        // Difficulty determines how much progress is marked.
        // So we just store difficulty.

        await dispatch('track.create', {
            name,
            segments: 10, // Standard size
            difficulty
        });

        closeModal();
        setName('');
        setDifficulty('Troublesome');
    };

    const difficulties = ['Troublesome', 'Dangerous', 'Formidable', 'Extreme', 'Epic'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Create Progress Track</h2>
                    <button onClick={closeModal} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                            Track Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Reach the Ironlands"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:border-violet-500 outline-none"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                            Difficulty
                        </label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:border-violet-500 outline-none"
                        >
                            {difficulties.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 mr-2 text-slate-300 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Track
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
