import { Editor } from '@milkdown/core';
import { replaceAll, callCommand } from '@milkdown/utils';
import { useLayoutEffect, useRef, useEffect, useState } from 'react';
import { ProsemirrorAdapterProvider, useNodeViewFactory } from '@prosemirror-adapter/react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { createEditor } from '../../lib/editor/createEditor';
import { insertThreadCard } from '../../lib/editor/commands/insertThreadCard';

interface MilkdownEditorProps {
    markdown: string;
    onMarkdownChange: (markdown: string) => void;
}

function MilkdownEditorInner({ markdown, onMarkdownChange }: MilkdownEditorProps) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<Editor | null>(null);
    const { settings } = useSettingsStore();
    const { editor: editorSettings } = settings;
    const { registerInsertThreadCallback, mode } = useEditorStore();
    const [loading, setLoading] = useState(true);
    const nodeViewFactory = useNodeViewFactory();
    const lastEmittedMarkdown = useRef(markdown);

    // Re-create editor when critical settings change
    useLayoutEffect(() => {
        if (!rootRef.current) return;

        // Cleanup previous instance
        if (editorRef.current) {
            editorRef.current.destroy();
        }

        let isMounted = true;
        const editor = createEditor(
            rootRef.current,
            editorSettings,
            markdown,
            (md) => {
                lastEmittedMarkdown.current = md;
                onMarkdownChange(md);
            },
            nodeViewFactory,
            mode // Pass current mode
        );

        editorRef.current = editor;
        setLoading(true);

        editor.create()
            .then(() => {
                if (isMounted) {
                    setLoading(false);
                } else {
                    editor.destroy();
                }
            })
            .catch(console.error);

        return () => {
            isMounted = false;
            editor.destroy();
            editorRef.current = null;
            if (rootRef.current) {
                rootRef.current.innerHTML = '';
            }
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
        nodeViewFactory,
        mode // Re-create on mode change
    ]);

    // Handle external markdown updates
    useLayoutEffect(() => {
        if (editorRef.current && !loading) {
            // Only replace if the content is actually different from what we last emitted
            // This prevents the loop where typing updates state -> triggers prop update -> triggers replaceAll -> resets cursor
            if (markdown !== lastEmittedMarkdown.current) {
                editorRef.current.action(replaceAll(markdown));
                lastEmittedMarkdown.current = markdown;
            }
        }
    }, [markdown, loading]);

    // Register insertion callback
    useEffect(() => {
        registerInsertThreadCallback((thread) => {
            if (editorRef.current && !loading) {
                editorRef.current.action(callCommand(insertThreadCard.key, thread));
            }
        });
        return () => registerInsertThreadCallback(() => { });
    }, [registerInsertThreadCallback, loading]);

    return (
        <div
            ref={rootRef}
            className="milkdown-editor-container p-8 bg-slate-900 min-h-full"
        />
    );
}

export function MilkdownEditor(props: MilkdownEditorProps) {
    return (
        <ProsemirrorAdapterProvider>
            <MilkdownEditorInner {...props} />
        </ProsemirrorAdapterProvider>
    );
}
