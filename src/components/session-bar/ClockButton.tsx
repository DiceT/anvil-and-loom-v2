import React from 'react';
import { Clock } from 'lucide-react';
import { useSessionActions } from '../../hooks/useSessionActions';

export const ClockButton = () => {
    const { openClockModal } = useSessionActions();

    return (
        <button
            onClick={openClockModal}
            className="flex items-center justify-center p-2 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            title="Create Clock"
        >
            <Clock size={18} />
        </button>
    );
};
