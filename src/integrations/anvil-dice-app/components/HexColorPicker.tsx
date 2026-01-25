import React, { useState, useEffect } from 'react';

interface HexColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    label?: string;
    showAlpha?: boolean;
}

/**
 * Color picker with HEX input and optional alpha channel.
 * Combines native color picker with editable HEX text field.
 */
export function HexColorPicker({ value, onChange, label, showAlpha = true }: HexColorPickerProps) {
    // Parse incoming value to extract RGB and alpha
    const parseColor = (hex: string): { rgb: string; alpha: number } => {
        // Handle #RRGGBBAA format
        if (hex.length === 9) {
            return {
                rgb: hex.substring(0, 7),
                alpha: parseInt(hex.substring(7, 9), 16) / 255
            };
        }
        // Handle #RRGGBB format
        return { rgb: hex.substring(0, 7) || '#000000', alpha: 1 };
    };

    const { rgb, alpha } = parseColor(value);
    const [hexInput, setHexInput] = useState(value);
    const [alphaValue, setAlphaValue] = useState(Math.round(alpha * 100));

    // Sync input when external value changes
    useEffect(() => {
        setHexInput(value);
        const { alpha: newAlpha } = parseColor(value);
        setAlphaValue(Math.round(newAlpha * 100));
    }, [value]);

    // Combine RGB and alpha into #RRGGBBAA
    const combineColor = (rgbHex: string, alphaPct: number): string => {
        const alphaHex = Math.round((alphaPct / 100) * 255).toString(16).padStart(2, '0');
        return showAlpha ? `${rgbHex}${alphaHex}` : rgbHex;
    };

    const handleColorChange = (newRgb: string) => {
        const combined = combineColor(newRgb, alphaValue);
        setHexInput(combined);
        onChange(combined);
    };

    const handleAlphaChange = (newAlpha: number) => {
        setAlphaValue(newAlpha);
        const combined = combineColor(rgb, newAlpha);
        setHexInput(combined);
        onChange(combined);
    };

    const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setHexInput(val);
        // Only update if valid hex
        if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(val)) {
            onChange(val);
        }
    };

    return (
        <div style={{ flex: 1 }}>
            {label && (
                <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '12px' }}>
                    {label}
                </label>
            )}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                {/* Native color picker */}
                <input
                    type="color"
                    value={rgb}
                    onChange={(e) => handleColorChange(e.target.value)}
                    style={{ width: '40px', height: '34px', cursor: 'pointer', padding: 0, border: '1px solid #555', borderRadius: '4px' }}
                />
                {/* HEX text input */}
                <input
                    type="text"
                    value={hexInput}
                    onChange={handleHexInput}
                    placeholder="#RRGGBBAA"
                    style={{
                        flex: 1,
                        padding: '6px 8px',
                        background: '#333',
                        border: '1px solid #555',
                        color: 'white',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        minWidth: '90px'
                    }}
                />
            </div>
            {/* Alpha slider */}
            {showAlpha && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#666', minWidth: '14px' }}>α</span>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={alphaValue}
                        onChange={(e) => handleAlphaChange(parseInt(e.target.value))}
                        style={{ flex: 1, height: '4px' }}
                    />
                    <span style={{ fontSize: '10px', color: '#888', minWidth: '28px' }}>{alphaValue}%</span>
                </div>
            )}
        </div>
    );
}
