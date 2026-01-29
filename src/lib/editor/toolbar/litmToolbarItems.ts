import { EditorView } from '@milkdown/kit/prose/view';
import { toggleMark } from '@milkdown/kit/prose/commands';

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar Item Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolbarItem {
    id: string;
    label: string;
    icon: string;
    command: (view: EditorView) => boolean;
    isActive: (view: EditorView) => boolean;
}

export const litmToolbarItems: ToolbarItem[] = [
    {
        id: 'lmtag',
        label: 'Tag',
        icon: '🏷️',
        command: (view) => {
            const markType = view.state.schema.marks.lmtag;
            if (!markType) return false;
            return toggleMark(markType)(view.state, view.dispatch);
        },
        isActive: (view) => {
            const markType = view.state.schema.marks.lmtag;
            if (!markType) return false;
            const { from, to } = view.state.selection;
            let active = false;
            view.state.doc.nodesBetween(from, to, (node) => {
                if (markType.isInSet(node.marks)) active = true;
            });
            return active;
        },
    },
    {
        id: 'lmstatus',
        label: 'Status',
        icon: '⚡',
        command: (view) => {
            const markType = view.state.schema.marks.lmstatus;
            if (!markType) return false;
            return toggleMark(markType)(view.state, view.dispatch);
        },
        isActive: (view) => {
            const markType = view.state.schema.marks.lmstatus;
            if (!markType) return false;
            const { from, to } = view.state.selection;
            let active = false;
            view.state.doc.nodesBetween(from, to, (node) => {
                if (markType.isInSet(node.marks)) active = true;
            });
            return active;
        },
    },
    {
        id: 'lmchallenge',
        label: 'Challenge',
        icon: '⚔️',
        command: (view) => {
            const markType = view.state.schema.marks.lmchallenge;
            if (!markType) return false;
            return toggleMark(markType)(view.state, view.dispatch);
        },
        isActive: (view) => {
            const markType = view.state.schema.marks.lmchallenge;
            if (!markType) return false;
            const { from, to } = view.state.selection;
            let active = false;
            view.state.doc.nodesBetween(from, to, (node) => {
                if (markType.isInSet(node.marks)) active = true;
            });
            return active;
        },
    },
];
