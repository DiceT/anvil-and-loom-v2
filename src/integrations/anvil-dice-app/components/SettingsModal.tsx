import React, { useState } from 'react';
import { useSettings } from '../store/SettingsContext';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { DicePreview } from './DicePreview';
import { HexColorPicker } from './HexColorPicker';
import type { SurfaceMaterial } from '../engine/types';


interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    textures: string[];
    // Bounds Props
    boundsWidth: number;
    setBoundsWidth: (w: number) => void;
    boundsDepth: number;
    setBoundsDepth: (d: number) => void;
    isAutoFit: boolean;
    setIsAutoFit: (auto: boolean) => void;
    onUpdateBounds: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, textures,
    boundsWidth, setBoundsWidth, boundsDepth, setBoundsDepth,
    isAutoFit, setIsAutoFit, onUpdateBounds
}) => {
    const { settings, updateTheme, updatePhysics, setSoundVolume, resetSettings } = useSettings();
    const { settings: globalSettings, updateDiceSettings } = useSettingsStore();
    const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'special'>('appearance');

    if (!isOpen) return null;

    // Helper for Surface Material Preset Logic
    const setSurface = (surface: SurfaceMaterial) => {
        updatePhysics({ surface });
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                width: '1000px', height: '650px', backgroundColor: '#222',
                borderRadius: '12px', border: '1px solid #444', display: 'flex', flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#eee', fontFamily: 'sans-serif'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px', borderBottom: '1px solid #333',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0 }}>Dice Settings</h2>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer'
                    }}>×</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        style={{
                            flex: 1, padding: '15px', background: activeTab === 'appearance' ? '#333' : 'transparent',
                            border: 'none', color: activeTab === 'appearance' ? 'white' : '#888', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >Appearance</button>
                    <button
                        onClick={() => setActiveTab('behavior')}
                        style={{
                            flex: 1, padding: '15px', background: activeTab === 'behavior' ? '#333' : 'transparent',
                            border: 'none', color: activeTab === 'behavior' ? 'white' : '#888', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >Behavior</button>
                    <button
                        onClick={() => setActiveTab('special')}
                        style={{
                            flex: 1, padding: '15px', background: activeTab === 'special' ? '#333' : 'transparent',
                            border: 'none', color: activeTab === 'special' ? 'white' : '#888', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >Special</button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', gap: '30px' }}>

                    {activeTab === 'appearance' && (
                        <>
                            {/* Controls */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Texture */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Texture</label>
                                    <select
                                        value={settings.theme.texture}
                                        onChange={(e) => updateTheme({ texture: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '6px' }}
                                    >
                                        {textures.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                {/* Material Type */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Material</label>
                                    <select
                                        value={settings.theme.material}
                                        onChange={(e) => updateTheme({ material: e.target.value as any })}
                                        style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '6px' }}
                                    >
                                        <option value="plastic">Plastic Fantastic</option>
                                        <option value="stone_master">Stone Master</option>
                                        <option value="relic_stone">Relic Stone</option>
                                        <option value="metal_master">Forged Metal</option>
                                        <option value="arcane_master">Illuminated Heart</option>
                                        <option value="glass">Pure Glass</option>
                                        <option value="void_glass">Void Glass</option>
                                        <option value="arcane_resin">Arcane Resin</option>
                                    </select>
                                </div>

                                {/* Shader Selection */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Core Effect</label>
                                    <select
                                        value={settings.theme.shader || 'none'}
                                        onChange={(e) => updateTheme({ shader: e.target.value as any })}
                                        style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '6px' }}
                                    >
                                        <option value="none">None</option>
                                        <option value="liquid">Liquid Core</option>
                                        <option value="singularity">Singularity</option>
                                        <option value="flamecore">Flamecore</option>
                                        <option value="vortex">Vortex</option>
                                        <option value="nebula">Nebula</option>
                                        <option value="caustic">Caustic Water</option>
                                    </select>
                                </div>

                                {/* Shader Colors (Conditional) */}
                                {(settings.theme.shader && settings.theme.shader !== 'none') && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Effect Primary</label>
                                            <HexColorPicker
                                                value={settings.theme.shaderColor || '#ff0055'}
                                                onChange={(c) => updateTheme({ shaderColor: c })}
                                                showAlpha={false}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Effect Secondary</label>
                                            <HexColorPicker
                                                value={settings.theme.shaderColorSecondary || '#00aaff'}
                                                onChange={(c) => updateTheme({ shaderColorSecondary: c })}
                                                showAlpha={false}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Font Selection */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Font</label>
                                    <select
                                        value={settings.theme.font}
                                        onChange={(e) => updateTheme({ font: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '6px', fontFamily: settings.theme.font, fontSize: '16px' }}
                                    >
                                        <option value="Arial" style={{ fontFamily: 'Arial' }}>Arial (Default)</option>
                                        <option value="Asul" style={{ fontFamily: 'Asul' }}>Asul</option>
                                        <option value="Atomic Age" style={{ fontFamily: 'Atomic Age' }}>Atomic Age</option>
                                        <option value="Caesar Dressing" style={{ fontFamily: 'Caesar Dressing' }}>Caesar Dressing</option>
                                        <option value="Gentium Book" style={{ fontFamily: 'Gentium Book' }}>Gentium Book</option>
                                        <option value="Goblin" style={{ fontFamily: 'Goblin' }}>Goblin</option>
                                        <option value="Josefin" style={{ fontFamily: 'Josefin' }}>Josefin</option>
                                        <option value="Metamorphous" style={{ fontFamily: 'Metamorphous' }}>Metamorphous</option>
                                        <option value="Orbitron" style={{ fontFamily: 'Orbitron' }}>Orbitron</option>
                                        <option value="Stoke" style={{ fontFamily: 'Stoke' }}>Stoke</option>
                                    </select>
                                </div>

                                {/* Colors */}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <HexColorPicker
                                        label="Dice Color"
                                        value={settings.theme.diceColor}
                                        onChange={(val) => updateTheme({ diceColor: val })}
                                        showAlpha={false}
                                    />
                                    <HexColorPicker
                                        label="Label Color"
                                        value={settings.theme.labelColor}
                                        onChange={(val) => updateTheme({ labelColor: val })}
                                        showAlpha={false}
                                    />
                                    <HexColorPicker
                                        label="Outline"
                                        value={settings.theme.outlineColor}
                                        onChange={(val) => updateTheme({ outlineColor: val })}
                                        showAlpha={false}
                                    />
                                </div>

                                {/* Secondary Colors (for d66/d88 ones die) */}
                                <div style={{ marginTop: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '11px' }}>Secondary Colors (d66/d88 ones die)</label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <HexColorPicker
                                            label="Dice"
                                            value={settings.theme.diceColorSecondary || settings.theme.diceColor}
                                            onChange={(val) => updateTheme({ diceColorSecondary: val })}
                                            showAlpha={false}
                                        />
                                        <HexColorPicker
                                            label="Label"
                                            value={settings.theme.labelColorSecondary || settings.theme.labelColor}
                                            onChange={(val) => updateTheme({ labelColorSecondary: val })}
                                            showAlpha={false}
                                        />
                                        <HexColorPicker
                                            label="Outline"
                                            value={settings.theme.outlineColorSecondary || settings.theme.outlineColor}
                                            onChange={(val) => updateTheme({ outlineColorSecondary: val })}
                                            showAlpha={false}
                                        />
                                    </div>
                                </div>

                                {/* Scale & Contrast */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Scale: {settings.theme.scale.toFixed(1)}x</label>
                                        <input
                                            type="range" min="0.6" max="1.5" step="0.1"
                                            value={settings.theme.scale}
                                            onChange={(e) => updateTheme({ scale: parseFloat(e.target.value) })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Contrast: {(settings.theme.textureContrast || 1.0).toFixed(1)}</label>
                                        <input
                                            type="range" min="0.5" max="2.0" step="0.1"
                                            value={settings.theme.textureContrast || 1.0}
                                            onChange={(e) => updateTheme({ textureContrast: parseFloat(e.target.value) })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', borderRadius: '12px' }}>
                                <DicePreview />
                                <div style={{ marginTop: '10px', color: '#666', fontSize: '12px' }}>Live Preview (D20)</div>
                            </div>
                        </>
                    )}

                    {activeTab === 'behavior' && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {/* Surface Materials */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '15px', color: '#aaa' }}>Surface Material (Friction & Bounce)</label>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    {(['felt', 'wood', 'rubber', 'glass'] as SurfaceMaterial[]).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSurface(s)}
                                            style={{
                                                flex: 1, padding: '20px',
                                                background: settings.physics.surface === s ? '#4a90e2' : '#333',
                                                border: '1px solid #555', borderRadius: '8px', color: 'white',
                                                cursor: 'pointer', textTransform: 'capitalize', fontSize: '16px'
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sliders */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Throw Force: {settings.physics.throwForce}</label>
                                <input
                                    type="range" min="20" max="80" step="5"
                                    value={settings.physics.throwForce}
                                    onChange={(e) => updatePhysics({ throwForce: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Higher force = faster, harder rolls.</div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Gravity: {settings.physics.gravity.toFixed(1)}</label>
                                <input
                                    type="range" min="5" max="20" step="0.1"
                                    value={settings.physics.gravity}
                                    onChange={(e) => updatePhysics({ gravity: parseFloat(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Standard Earth gravity is 9.8.</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Master Volume: {Math.round(settings.soundVolume * 100)}%</label>
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={settings.soundVolume}
                                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Adjust sound effects volume (0 to mute).</div>
                            </div>

                            {/* BOUNDS Section (Moved from Overlay) */}
                            <div style={{ borderTop: '1px solid #444', paddingTop: '20px', marginTop: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', color: '#white' }}>Simulation Bounds</h3>
                                    <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#aaa' }}>
                                        <input
                                            type="checkbox"
                                            checked={isAutoFit}
                                            onChange={(e) => setIsAutoFit(e.target.checked)}
                                        />
                                        Auto-Fit to Screen
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div>
                                        <label style={{ marginRight: '10px', color: '#aaa' }}>Width:</label>
                                        <input
                                            type="number"
                                            value={boundsWidth}
                                            onChange={(e) => setBoundsWidth(Number(e.target.value))}
                                            disabled={isAutoFit}
                                            style={{ width: '60px', padding: '10px', borderRadius: '6px', background: '#333', border: '1px solid #555', color: 'white', opacity: isAutoFit ? 0.5 : 1 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ marginRight: '10px', color: '#aaa' }}>Depth:</label>
                                        <input
                                            type="number"
                                            value={boundsDepth}
                                            onChange={(e) => setBoundsDepth(Number(e.target.value))}
                                            disabled={isAutoFit}
                                            style={{ width: '60px', padding: '10px', borderRadius: '6px', background: '#333', border: '1px solid #555', color: 'white', opacity: isAutoFit ? 0.5 : 1 }}
                                        />
                                    </div>
                                    <button
                                        onClick={onUpdateBounds}
                                        disabled={isAutoFit}
                                        style={{ padding: '10px 20px', background: '#555', border: 'none', color: 'white', borderRadius: '6px', cursor: isAutoFit ? 'default' : 'pointer', opacity: isAutoFit ? 0.5 : 1 }}
                                    >
                                        Update Bounds
                                    </button>
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                                    Defines the invisible walls around the dice.
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'special' && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div>
                                <h3 style={{ margin: '0 0 15px 0', color: 'white' }}>Special Dice Models</h3>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#333', borderRadius: '8px', border: '1px solid #444' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>River Pebble d6</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                            Replaces standard <strong>d6</strong> with a 12-sided pebble model.
                                            <br />
                                            Faces are mapped 1-6 twice (e.g. 1 & 12 = 6).
                                        </div>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={globalSettings.dice.enableRiverPebble}
                                            onChange={(e) => updateDiceSettings({ enableRiverPebble: e.target.checked })}
                                            style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                                        />
                                        <span style={{ color: globalSettings.dice.enableRiverPebble ? '#4a90e2' : '#888' }}>
                                            {globalSettings.dice.enableRiverPebble ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '20px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={resetSettings} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #555', color: '#aaa', borderRadius: '6px', cursor: 'pointer' }}>Reset Defaults</button>
                    <button onClick={onClose} style={{ padding: '10px 30px', background: '#4a90e2', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Done</button>
                </div>
            </div>
        </div>
    );
};
