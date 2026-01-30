import React, { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useSessionModalStore } from '../../stores/useSessionModalStore';
import { useSessionActions } from '../../hooks/useSessionActions';
import { X } from 'lucide-react';

export const ClockCreationModal = () => {
    const { activeModal, closeModal } = useSessionModalStore();
    const { dispatch } = useSessionActions();

    const [name, setName] = useState('');
    const [segments, setSegments] = useState(4);

    if (activeModal !== 'clock') return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await dispatch('clock.create', { name, segments });
        closeModal();
        setName('');
        setSegments(4);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Create Clock</h2>
                    <button onClick={closeModal} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                            Clock Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Alarm Level"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:border-violet-500 outline-none"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                            Segments ({segments})
                        </label>
                        <input
                            type="range"
                            min="2"
                            max="12"
                            value={segments}
                            onChange={(e) => setSegments(parseInt(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>2</span>
                            <span>4</span>
                            <span>6</span>
                            <span>8</span>
                            <span>10</span>
                            <span>12</span>
                        </div>
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
                            Create Clock
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
