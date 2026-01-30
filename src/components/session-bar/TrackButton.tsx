import React from 'react';
import { GripHorizontal } from 'lucide-react';
import { useSessionActions } from '../../hooks/useSessionActions';

export const TrackButton = () => {
    const { openTrackModal } = useSessionActions();

    return (
        <button
            onClick={openTrackModal}
            className="flex items-center justify-center p-2 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            title="Create Track"
        >
            <GripHorizontal size={18} />
        </button>
    );
};
