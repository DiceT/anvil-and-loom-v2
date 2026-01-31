import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { diceEngine } from '../../integrations/anvil-dice-app';
import logo from '../../assets/images/anvil-and-loom.png'; // Assuming png based on previous discovery

// Helper to convert store settings to engine config
const mapSettingsToEngine = (diceSettings: any) => ({
    theme: {
        diceColor: diceSettings.diceColor,
        labelColor: diceSettings.numberColor,
        outlineColor: '#000000',
        diceColorSecondary: diceSettings.diceColorSecondary || diceSettings.diceColor,
        labelColorSecondary: diceSettings.numberColorSecondary || diceSettings.numberColor,
        outlineColorSecondary: '#000000',
        texture: diceSettings.texture || 'ledgerandink',
        material: diceSettings.material || 'plastic',
        shader: diceSettings.shader || 'none',
        shaderColor: diceSettings.shaderColor || '#ff0055',
        shaderColorSecondary: diceSettings.shaderColorSecondary || '#00aaff',
        font: 'Arial',
        scale: diceSettings.scale || 1.0,
        textureContrast: diceSettings.textureContrast || 1.0
    },
    physics: {
        throwForce: 60,
        gravity: 9.81,
        surface: diceSettings.surfaceType || 'felt_green',
        soundVolume: 0.5,
        spinForce: 15,
        wallRestitution: 0.5,
        groundFriction: 0.5
    },
    soundVolume: 0.5
});

/**
 * AppInitializer
 * 
 * Handles global application initialization tasks:
 * 1. Synchronizing settings to subsystems (DiceEngine, etc.)
 * 2. Pre-loading key resources
 * 3. displaying a Splash Screen to mask startup operations
 */
export const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    // Subscribe to settings to keep engine in sync
    // We use a selector to only re-run when dice settings change
    const diceSettings = useSettingsStore(state => state.settings.dice);

    // Effect: Synchronize Settings (Runs on mount + whenever settings change)
    useEffect(() => {
        if (diceSettings) {
            console.log('[AppInitializer] Syncing dice settings to Engine');

            // BRIDGE: Load 'anvil_dice_settings' from localStorage if available
            // This is required because the Dice Tool Integration uses its own isolated context/storage
            // that is NOT fully synced to useSettingsStore yet.
            // We merge these "Visual/Physics" settings on top of the global store defaults.
            let mergedSettings = diceSettings;
            try {
                const saved = localStorage.getItem('anvil_dice_settings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Merge local storage settings (Theme/Physics) with global store (which handles RiverPebble)
                    mergedSettings = {
                        ...diceSettings,
                        // actually mapSettingsToEngine reads: diceSettings.diceColor
                        // But `anvil_dice_settings` has `theme.diceColor`.
                        // So we need to map the integration format to the store format

                        diceColor: parsed.theme?.diceColor ?? diceSettings.diceColor,
                        numberColor: parsed.theme?.labelColor ?? diceSettings.numberColor,
                        diceColorSecondary: parsed.theme?.diceColorSecondary ?? diceSettings.diceColorSecondary,
                        numberColorSecondary: parsed.theme?.labelColorSecondary ?? diceSettings.numberColorSecondary,
                        texture: parsed.theme?.texture ?? diceSettings.texture,
                        material: parsed.theme?.material ?? diceSettings.material,
                        shader: parsed.theme?.shader ?? diceSettings.shader,
                        shaderColor: parsed.theme?.shaderColor ?? diceSettings.shaderColor,
                        shaderColorSecondary: parsed.theme?.shaderColorSecondary ?? diceSettings.shaderColorSecondary,
                        scale: parsed.theme?.scale ?? diceSettings.scale,
                        textureContrast: parsed.theme?.textureContrast ?? diceSettings.textureContrast,

                        surfaceType: parsed.physics?.surface ?? diceSettings.surfaceType
                    };
                    console.log('[AppInitializer] Merged integration settings:', mergedSettings);
                }
            } catch (err) {
                console.warn('[AppInitializer] Failed to load anvil_dice_settings', err);
            }

            const appSettings = mapSettingsToEngine(mergedSettings);
            diceEngine.updateSettings(appSettings);

            if (typeof (diceEngine.getEngineCore() as any)?.setRiverPebble === 'function') {
                (diceEngine.getEngineCore() as any).setRiverPebble(diceSettings.enableRiverPebble);
            }
        }
    }, [diceSettings]);

    // Effect: Startup Sequence
    useEffect(() => {
        const initApp = async () => {
            console.log('[AppInitializer] Starting application initialization...');

            // Artificial delay to show branding (and allow engine/heavy resources to settle)
            // Users perceives this as "loading" which feels more robust than a flash
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('[AppInitializer] Initialization complete. Fading splash.');
            setFadeOut(true);

            // Remove from DOM after fade
            setTimeout(() => {
                setLoading(false);
            }, 1000); // 1s fade duration
        };

        initApp();
    }, []);

    return (
        <>
            {/* Main Application (Always rendered to allow background init) */}
            {children}

            {/* Splash Screen Overlay */}
            {loading && (
                <div
                    className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-zinc-950 transition-opacity duration-1000 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <div className="flex flex-col items-center animate-pulse">
                        <img
                            src={logo}
                            alt="Anvil & Loom"
                            className="w-48 h-auto mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        />
                        <div className="flex gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                    <div className="absolute bottom-8 text-zinc-600 text-xs font-mono tracking-widest">
                        INITIALIZING REALITY ENGINE...
                    </div>
                </div>
            )}
        </>
    );
};
