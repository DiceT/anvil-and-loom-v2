import { Crepe } from '@milkdown/crepe';
import { useLayoutEffect, useRef } from 'react';
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/nord-dark.css";

interface MilkdownEditorProps {
    markdown: string;
    onMarkdownChange: (markdown: string) => void;
}

export function MilkdownEditor({ markdown, onMarkdownChange }: MilkdownEditorProps) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const crepeRef = useRef<Crepe | null>(null);

    useLayoutEffect(() => {
        if (!rootRef.current) return;

        const crepe = new Crepe({
            root: rootRef.current,
            defaultValue: markdown,
            features: {
                [Crepe.Feature.Placeholder]: true,
            },
        });

        crepe.on((listener) => {
            listener.markdownUpdated((_ctx, updatedMarkdown) => {
                onMarkdownChange(updatedMarkdown);
            });
        });

        crepeRef.current = crepe;
        crepe.create();

        return () => {
            crepe.destroy();
            crepeRef.current = null;
        };
    }, []);

    return (
        <div
            ref={rootRef}
            className="milkdown-editor-container p-8 bg-slate-900"
        />
    );
}
