import { useSettingsStore } from '../../stores/useSettingsStore';
import { EditorSettings } from '../../types/settings';

export function EditorSettingsPanel() {
    const { settings, updateEditorSettings } = useSettingsStore();
    const { editor } = settings;

    const Toggle = ({
        label,
        description,
        checked,
        onChange
    }: {
        label: string;
        description?: string;
        checked: boolean;
        onChange: (checked: boolean) => void;
    }) => (
        <div className="flex items-center justify-between py-3">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-200">{label}</span>
                {description && <span className="text-xs text-slate-500">{description}</span>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${checked ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );

    return (
        <div className="space-y-8 pb-8">
            {/* Theme & Appearance */}
            <div>
                <h3 className="text-lg font-medium text-slate-100 mb-4 border-b border-slate-800 pb-2">Appearance</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Editor Theme
                        </label>
                        <select
                            value={editor.theme}
                            onChange={(e) => updateEditorSettings({ theme: e.target.value as EditorSettings['theme'] })}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                        >
                            <option value="nord-dark">Nord Dark</option>
                            <option value="nord-light">Nord Light</option>
                        </select>
                    </div>
                    <Toggle
                        label="Show Floating Toolbar"
                        description="Show the formatting tooltip when selecting text"
                        checked={editor.showToolbar}
                        onChange={(v) => updateEditorSettings({ showToolbar: v })}
                    />
                </div>
            </div>

            {/* Markdown Features */}
            <div>
                <h3 className="text-lg font-medium text-slate-100 mb-4 border-b border-slate-800 pb-2">Markdown Features</h3>
                <div className="divide-y divide-slate-800">
                    <Toggle
                        label="GitHub Flavored Markdown (GFM)"
                        description="Enable tables, task lists, and strikethrough"
                        checked={editor.enableGfm}
                        onChange={(v) => updateEditorSettings({ enableGfm: v })}
                    />
                    {editor.enableGfm && (
                        <div className="pl-4 border-l-2 border-slate-800 ml-1 space-y-1">
                            <Toggle
                                label="Tables"
                                checked={editor.enableTables}
                                onChange={(v) => updateEditorSettings({ enableTables: v })}
                            />
                            <Toggle
                                label="Task Lists"
                                checked={editor.enableTaskLists}
                                onChange={(v) => updateEditorSettings({ enableTaskLists: v })}
                            />
                            <Toggle
                                label="Strikethrough"
                                checked={editor.enableStrikethrough}
                                onChange={(v) => updateEditorSettings({ enableStrikethrough: v })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Behavior */}
            <div>
                <h3 className="text-lg font-medium text-slate-100 mb-4 border-b border-slate-800 pb-2">Behavior</h3>
                <div className="divide-y divide-slate-800">
                    <Toggle
                        label="Undo/Redo History"
                        checked={editor.enableHistory}
                        onChange={(v) => updateEditorSettings({ enableHistory: v })}
                    />
                    <Toggle
                        label="Enhanced Clipboard"
                        description="Better copy/paste support for markdown"
                        checked={editor.enableClipboard}
                        onChange={(v) => updateEditorSettings({ enableClipboard: v })}
                    />
                    <Toggle
                        label="Smart Indent"
                        description="Tab to indent lists and code blocks"
                        checked={editor.enableIndent}
                        onChange={(v) => updateEditorSettings({ enableIndent: v })}
                    />
                    <Toggle
                        label="Live Sync"
                        description="Update Tapestry entry as you type (auto-save)"
                        checked={editor.syncOnChange}
                        onChange={(v) => updateEditorSettings({ syncOnChange: v })}
                    />
                </div>
            </div>

            {/* Plugins */}
            <div>
                <h3 className="text-lg font-medium text-slate-100 mb-4 border-b border-slate-800 pb-2">Plugins</h3>
                <div className="divide-y divide-slate-800">
                    <Toggle
                        label="Formatting Tooltip"
                        description="Show floating toolbar when selecting text"
                        checked={editor.enableTooltip}
                        onChange={(v) => updateEditorSettings({ enableTooltip: v })}
                    />
                    <Toggle
                        label="Slash Commands"
                        description="Type '/' to insert blocks"
                        checked={editor.enableSlashMenu}
                        onChange={(v) => updateEditorSettings({ enableSlashMenu: v })}
                    />
                </div>
            </div>

            {/* Advanced */}
            <div>
                <h3 className="text-lg font-medium text-slate-100 mb-4 border-b border-slate-800 pb-2">Advanced</h3>
                <div className="divide-y divide-slate-800">
                    <Toggle
                        label="Developer Mode Overrides"
                        description="Show experimental settings"
                        checked={editor.devModeOverrides}
                        onChange={(v) => updateEditorSettings({ devModeOverrides: v })}
                    />
                    {editor.devModeOverrides && (
                        <div className="pl-4 border-l-2 border-red-900/30 ml-1 space-y-1 bg-red-900/10 rounded p-2 mt-2">
                            <Toggle
                                label="CommonMark Core"
                                description="Warning: Disabling may break editor"
                                checked={editor.enableCommonmark}
                                onChange={(v) => updateEditorSettings({ enableCommonmark: v })}
                            />
                            <Toggle
                                label="Collaboration (Experimental)"
                                description="Not fully implemented"
                                checked={editor.enableCollaboration}
                                onChange={(v) => updateEditorSettings({ enableCollaboration: v })}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
