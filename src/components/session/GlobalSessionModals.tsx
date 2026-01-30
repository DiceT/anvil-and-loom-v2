import React from 'react';
import { ClockCreationModal } from './ClockCreationModal';
import { TrackCreationModal } from './TrackCreationModal';

export const GlobalSessionModals = () => {
    return (
        <>
            <ClockCreationModal />
            <TrackCreationModal />
        </>
    );
};
