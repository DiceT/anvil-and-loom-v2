import { useLayoutEffect, useRef, useEffect, useState, useCallback } from 'react';
import { ProsemirrorAdapterProvider, useNodeViewFactory } from '@prosemirror-adapter/react';
import { useEditorStore } from '../../stores/useEditorStore';
import {
    createCrepeEditor,
    CrepeEditorInstance
} from '../../lib/editor/createCrepeEditor';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface MilkdownEditorProps {
    markdown: string;
    onMarkdownChange: (markdown: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner Component (needs ProsemirrorAdapterProvider context)
// ─────────────────────────────────────────────────────────────────────────────

function MilkdownEditorInner({ markdown, onMarkdownChange }: MilkdownEditorProps) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<CrepeEditorInstance | null>(null);
    const { registerInsertThreadCallback, mode } = useEditorStore();
    const [loading, setLoading] = useState(true);
    const nodeViewFactory = useNodeViewFactory();

    // Track the last markdown we emitted to prevent feedback loops
    const lastEmittedMarkdown = useRef(markdown);

    // Track the last markdown we received from props
    const lastPropMarkdown = useRef(markdown);

    // ─────────────────────────────────────────────────────────────────────────
    // Editor Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    useLayoutEffect(() => {
        if (!rootRef.current) return;

        // Cleanup previous instance
        if (editorRef.current) {
            editorRef.current.destroy();
            editorRef.current = null;
        }

        let isMounted = true;
        setLoading(true);

        // Store current markdown for initialization
        const initialMarkdown = lastPropMarkdown.current;

        createCrepeEditor({
            root: rootRef.current,
            defaultValue: initialMarkdown,
            onChange: (md) => {
                if (!isMounted) return;
                lastEmittedMarkdown.current = md;
                onMarkdownChange(md);
            },
            nodeViewFactory,
            mode,
        })
            .then((instance) => {
                if (isMounted) {
                    editorRef.current = instance;
                    setLoading(false);
                } else {
                    instance.destroy();
                }
            })
            .catch((error) => {
                console.error('Failed to create Crepe editor:', error);
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
            if (editorRef.current) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };
    }, [nodeViewFactory, mode]); // Re-create on mode change

    // ─────────────────────────────────────────────────────────────────────────
    // Handle External Markdown Updates
    // ─────────────────────────────────────────────────────────────────────────

    useLayoutEffect(() => {
        lastPropMarkdown.current = markdown;

        if (editorRef.current && !loading) {
            // Only replace if the content differs from what we last emitted
            // This prevents cursor-jumping on every keystroke
            if (markdown !== lastEmittedMarkdown.current) {
                editorRef.current.replaceContent(markdown);
                lastEmittedMarkdown.current = markdown;
            }
        }
    }, [markdown, loading]);

    // ─────────────────────────────────────────────────────────────────────────
    // Thread Insertion Callback
    // ─────────────────────────────────────────────────────────────────────────

    const insertThread = useCallback((thread: any) => {
        if (editorRef.current && !loading) {
            editorRef.current.insertThread(thread);
        }
    }, [loading]);

    useEffect(() => {
        registerInsertThreadCallback(insertThread);
        return () => registerInsertThreadCallback(() => { });
    }, [registerInsertThreadCallback, insertThread]);

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="crepe-editor-wrapper h-full overflow-auto">
            {loading && (
                <div className="flex items-center justify-center h-32 text-slate-500">
                    <span className="animate-pulse">Loading editor...</span>
                </div>
            )}
            <div
                ref={rootRef}
                className={`crepe-editor-container min-h-full ${loading ? 'hidden' : ''}`}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported Component (wraps with ProsemirrorAdapterProvider)
// ─────────────────────────────────────────────────────────────────────────────

export function MilkdownEditor(props: MilkdownEditorProps) {
    return (
        <ProsemirrorAdapterProvider>
            <MilkdownEditorInner {...props} />
        </ProsemirrorAdapterProvider>
    );
}
