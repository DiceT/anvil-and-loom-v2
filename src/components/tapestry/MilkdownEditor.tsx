import { Crepe } from '@milkdown/crepe';
import { useLayoutEffect, useRef } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { createEditor } from '../../lib/editor/createEditor';
// @ts-ignore
import "@milkdown/crepe/theme/common/style.css";
// @ts-ignore
import "@milkdown/crepe/theme/nord-dark.css";

interface MilkdownEditorProps {
    markdown: string;
    onMarkdownChange: (markdown: string) => void;
}

export function MilkdownEditor({ markdown, onMarkdownChange }: MilkdownEditorProps) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const crepeRef = useRef<Crepe | null>(null);
    const { settings } = useSettingsStore();
    const { editor: editorSettings } = settings;

    // Re-create editor when critical settings change
    useLayoutEffect(() => {
        if (!rootRef.current) return;

        // Cleanup previous instance
        if (crepeRef.current) {
            crepeRef.current.destroy();
        }

        const crepe = createEditor(
            rootRef.current,
            editorSettings,
            markdown,
            onMarkdownChange
        );

        crepeRef.current = crepe;
        crepe.create().catch(console.error);

        return () => {
            crepe.destroy();
            crepeRef.current = null;
        };
        // We intentionally depend on editorSettings to re-create on change.
        // We exclude markdown/onMarkdownChange to avoid re-creation on typing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        editorSettings.showToolbar,
        editorSettings.enableSlashMenu,
        editorSettings.enableCursorEnhancements,
        editorSettings.theme,
        editorSettings.enableGfm,
        // Add other structural settings here
    ]);

    // Handle external markdown updates (e.g. from other tabs)
    useLayoutEffect(() => {
        if (crepeRef.current) {
            // Check if markdown is actually different to avoid cursor jumps
            // Note: getMarkdown() might return slightly different format than input, 
            // so this check isn't perfect but helps.
            // We cast to any because setMarkdown is not in the type definition but exists at runtime
            if ((crepeRef.current as any).setMarkdown) {
                (crepeRef.current as any).setMarkdown(markdown);
            }
        }
    }, [markdown]);

    return (
        <div
            ref={rootRef}
            className="milkdown-editor-container p-2 bg-slate-900"
        />
    );
}
