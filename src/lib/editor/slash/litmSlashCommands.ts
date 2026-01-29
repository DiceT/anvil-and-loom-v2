import { SlashProvider } from '@milkdown/kit/plugin/slash';

// ─────────────────────────────────────────────────────────────────────────────
// LitM Slash Commands
// ─────────────────────────────────────────────────────────────────────────────

export const litmSlashCommands = [
    {
        id: 'lmtag',
        label: 'Tag (LitM)',
        keywords: ['tag', 'lmtag', 'litm'],
        icon: '🏷️',
        action: (ctx: any) => {
            const view = ctx.get('editorViewCtx');
            const { state, dispatch } = view;
            const markType = state.schema.marks.lmtag;

            if (!markType) return;

            const { from, to } = state.selection;

            if (from === to) {
                // No selection - insert placeholder
                const tr = state.tr.insertText(':lmtag[text]');
                dispatch(tr);
            } else {
                // Has selection - wrap it
                const tr = state.tr.addMark(from, to, markType.create());
                dispatch(tr);
            }
        },
    },
    {
        id: 'lmstatus',
        label: 'Status (LitM)',
        keywords: ['status', 'lmstatus', 'litm'],
        icon: '⚡',
        action: (ctx: any) => {
            const view = ctx.get('editorViewCtx');
            const { state, dispatch } = view;
            const markType = state.schema.marks.lmstatus;

            if (!markType) return;

            const { from, to } = state.selection;

            if (from === to) {
                const tr = state.tr.insertText(':lmstatus[text]');
                dispatch(tr);
            } else {
                const tr = state.tr.addMark(from, to, markType.create());
                dispatch(tr);
            }
        },
    },
    {
        id: 'lmchallenge',
        label: 'Challenge (LitM)',
        keywords: ['challenge', 'lmchallenge', 'litm'],
        icon: '⚔️',
        action: (ctx: any) => {
            const view = ctx.get('editorViewCtx');
            const { state, dispatch } = view;
            const markType = state.schema.marks.lmchallenge;

            if (!markType) return;

            const { from, to } = state.selection;

            if (from === to) {
                const tr = state.tr.insertText(':lmchallenge[text]');
                dispatch(tr);
            } else {
                const tr = state.tr.addMark(from, to, markType.create());
                dispatch(tr);
            }
        },
    },
];
