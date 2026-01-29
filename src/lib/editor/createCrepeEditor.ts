import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { $view } from '@milkdown/utils';
import { threadCardNode } from './nodes/threadCardNode';
import { ThreadCardNodeView } from './views/ThreadCardNodeView';
import { insertThreadCard } from './commands/insertThreadCard';

// Import Crepe base styles
import '@milkdown/crepe/theme/common/style.css';
// Our custom theme overrides Crepe defaults
import '../../styles/crepe-anvil.css';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CrepeEditorConfig {
    root: HTMLElement;
    defaultValue: string;
    onChange: (markdown: string) => void;
    nodeViewFactory: any; // From @prosemirror-adapter/react
    mode: 'edit' | 'view' | 'source';
    placeholder?: string;
}

export interface CrepeEditorInstance {
    crepe: Crepe;
    destroy: () => void;
    replaceContent: (markdown: string) => void;
    insertThread: (thread: any) => void;
    getMarkdown: () => string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor Factory
// ─────────────────────────────────────────────────────────────────────────────

export async function createCrepeEditor(
    config: CrepeEditorConfig
): Promise<CrepeEditorInstance> {
    const {
        root,
        defaultValue,
        onChange,
        nodeViewFactory,
        mode,
        placeholder = 'Start writing, or type / for commands...',
    } = config;

    // Determine feature flags based on mode
    const isEditable = mode === 'edit';
    const isSourceMode = mode === 'source';

    // ─────────────────────────────────────────────────────────────────────────
    // Create Crepe Instance
    // ─────────────────────────────────────────────────────────────────────────

    const crepe = new Crepe({
        root,
        defaultValue,
        features: {
            // Editing features — only in edit mode
            [CrepeFeature.BlockEdit]: isEditable,
            [CrepeFeature.Toolbar]: isEditable,

            // Always-on features
            [CrepeFeature.LinkTooltip]: true,
            [CrepeFeature.ListItem]: true,
            [CrepeFeature.Table]: true,
            [CrepeFeature.Cursor]: true,

            // Optional features
            [CrepeFeature.ImageBlock]: isEditable,
            [CrepeFeature.Placeholder]: isEditable,

            // Disabled features (heavy or not needed)
            [CrepeFeature.CodeMirror]: false, // Use basic code blocks
            [CrepeFeature.Latex]: false,       // No math support needed
        },
        featureConfigs: {
            [CrepeFeature.Placeholder]: {
                text: placeholder,
            },
            [CrepeFeature.Toolbar]: {
                // Toolbar items to show
                // Default includes: bold, italic, strikethrough, code, link
            },
            [CrepeFeature.LinkTooltip]: {
                onCopyLink: () => {
                    // Could show toast notification here
                    console.log('Link copied to clipboard');
                },
            },
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Add Listener Plugin for Change Events
    // ─────────────────────────────────────────────────────────────────────────

    crepe.editor.use(listener);

    crepe.editor.config((ctx) => {
        const listenerInstance = ctx.get(listenerCtx);

        listenerInstance.markdownUpdated((ctx, markdown, prevMarkdown) => {
            if (markdown !== prevMarkdown) {
                onChange(markdown);
            }
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Add Custom Thread Card Node (except in source mode)
    // ─────────────────────────────────────────────────────────────────────────

    if (!isSourceMode) {
        // Register the custom node schema
        crepe.editor.use(threadCardNode);

        // Register the React view for rendering
        crepe.editor.use(
            $view(threadCardNode, () =>
                nodeViewFactory({ component: ThreadCardNodeView })
            )
        );

        // Register the insert command
        crepe.editor.use(insertThreadCard);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create the Editor
    // ─────────────────────────────────────────────────────────────────────────

    await crepe.create();

    // ─────────────────────────────────────────────────────────────────────────
    // Return Instance with Helper Methods
    // ─────────────────────────────────────────────────────────────────────────

    return {
        crepe,

        destroy: () => {
            crepe.destroy();
        },

        replaceContent: (markdown: string) => {
            const { replaceAll } = require('@milkdown/utils');
            crepe.editor.action(replaceAll(markdown));
        },

        insertThread: (thread: any) => {
            const { callCommand } = require('@milkdown/utils');
            crepe.editor.action(callCommand(insertThreadCard.key, thread));
        },

        getMarkdown: () => {
            const { getMarkdown } = require('@milkdown/utils');
            return crepe.editor.action(getMarkdown());
        },
    };
}
