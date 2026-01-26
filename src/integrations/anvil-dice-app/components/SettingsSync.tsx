import React, { useEffect } from 'react';
import { useSettings } from '../store/SettingsContext';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { EngineCore } from '../engine/core/EngineCore';

export const SettingsSync: React.FC<{ engine: EngineCore | null }> = ({ engine }) => {
    const { settings } = useSettings();
    const { settings: globalSettings } = useSettingsStore();

    useEffect(() => {
        if (engine) {
            engine.updateSettings(settings);
            engine.setRiverPebble(globalSettings.dice.enableRiverPebble);
        }
    }, [engine, settings, globalSettings.dice.enableRiverPebble]);
    return null;
};
