import { AlignJustify, AlignCenter } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';

// ─────────────────────────────────────────────────────────────────────────────
// Editor Width Toggle Component
// ─────────────────────────────────────────────────────────────────────────────

export function EditorWidthToggle() {
    const { settings, updateEditorSettings } = useSettingsStore();
    const { editorWidth } = settings.editor;

    const isReadable = editorWidth === 'readable';

    const toggleWidth = () => {
        updateEditorSettings({
            editorWidth: isReadable ? 'full' : 'readable'
        });
    };

    return (
        <button
            onClick={toggleWidth}
            className={`
        p-1.5 rounded transition-colors
        hover:bg-slate-700 hover:text-white
        text-slate-400
        focus:outline-none focus:ring-2 focus:ring-amber-500/50
      `}
            title={isReadable ? 'Switch to full width' : 'Switch to readable width'}
            aria-label={isReadable ? 'Switch to full width' : 'Switch to readable width'}
        >
            {isReadable ? (
                <AlignCenter className="w-4 h-4" />
            ) : (
                <AlignJustify className="w-4 h-4" />
            )}
        </button>
    );
}
