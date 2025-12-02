import { Editor, rootCtx, defaultValueCtx, editorViewOptionsCtx, prosePluginsCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { nord } from '@milkdown/theme-nord';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { slashFactory } from '@milkdown/plugin-slash';
import { trailing } from '@milkdown/plugin-trailing';
import { gapCursor } from 'prosemirror-gapcursor';
import { $view } from '@milkdown/utils';
import { EditorSettings } from '../../types/settings';
import { threadCardNode } from './nodes/threadCardNode';
import { ThreadCardNodeView } from './views/ThreadCardNodeView';

const slash = slashFactory('slash');

export const createEditor = (
    root: HTMLElement,
    settings: EditorSettings,
    initialMarkdown: string,
    onChange: (markdown: string) => void,
    nodeViewFactory: any, // Type is from @prosemirror-adapter/react
    mode: 'edit' | 'view' | 'source' = 'edit'
) => {
    const editor = Editor.make()
        .config((ctx) => {
            ctx.set(rootCtx, root);
            ctx.set(defaultValueCtx, initialMarkdown);

            // Configure listener
            ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
                if (markdown !== prevMarkdown) {
                    onChange(markdown);
                }
            });

            // Configure editor view options
            ctx.update(editorViewOptionsCtx, (prev) => ({
                ...prev,
                attributes: {
                    class: 'milkdown-editor prose prose-invert max-w-none focus:outline-none',
                    spellcheck: 'false',
                },
            }));

            // Add gap cursor plugin
            ctx.update(prosePluginsCtx, (prev) => [...prev, gapCursor()]);
        })
        .config(nord);

    // Only use custom node if NOT in source mode
    if (mode !== 'source') {
        editor.use(threadCardNode);
    }

    editor
        .use(commonmark)
        .use(gfm)
        .use(history)
        .use(listener)
        .use(trailing);

    // Only use node view if NOT in source mode
    if (mode !== 'source') {
        editor.use($view(threadCardNode, () => nodeViewFactory({ component: ThreadCardNodeView })));
    }

    // Add slash menu if enabled
    if (settings.enableSlashMenu) {
        editor.use(slash);
    }

    return editor;
};
