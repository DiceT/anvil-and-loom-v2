/**
 * PresetTableButtons - Quick create buttons for common table types
 *
 * Provides buttons to quickly create tables with pre-configured roll ranges:
 * - d66: 6 rows with ranges 11-16, 21-26, ..., 61-66
 * - d88: 8 rows with ranges 11-18, 21-28, ..., 81-88
 * - 2d6: 11 rows with ranges 2, 3, 4, ..., 12
 * - 2d8: 15 rows with ranges 2, 3, 4, ..., 16
 */



export interface PresetTableButtonsProps {
  onCreatePresetTable: (preset: 'd66' | 'd88' | '2d6' | '2d8') => void;
  disabled?: boolean;
}

const presetConfigs = [
  {
    type: 'd66' as const,
    label: 'd66',
    description: '6 rows: 11-66',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    type: 'd88' as const,
    label: 'd88',
    description: '8 rows: 11-88',
    color: 'bg-green-600 hover:bg-green-700',
  },
  {
    type: '2d6' as const,
    label: '2d6',
    description: '11 rows: 2-12',
    color: 'bg-purple-600 hover:bg-purple-700',
  },
  {
    type: '2d8' as const,
    label: '2d8',
    description: '15 rows: 2-16',
    color: 'bg-orange-600 hover:bg-orange-700',
  },
];

export function PresetTableButtons({ onCreatePresetTable, disabled = false }: PresetTableButtonsProps) {
  return (
    <div className="mt-3">
      <p className="text-xs text-slate-500 mb-2">Quick Create:</p>
      <div className="grid grid-cols-4 gap-2">
        {presetConfigs.map((preset) => (
          <button
            key={preset.type}
            onClick={() => onCreatePresetTable(preset.type)}
            disabled={disabled}
            className={`flex items-center justify-center px-2 py-2 rounded-lg text-white text-xs font-medium transition-colors ${preset.color} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={preset.description}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
