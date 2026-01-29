import { $mark } from '@milkdown/kit/utils';
import { toggleMark } from '@milkdown/kit/prose/commands';
import { MarkType } from '@milkdown/kit/prose/model';

// ─────────────────────────────────────────────────────────────────────────────
// LitM Mark Types
// ─────────────────────────────────────────────────────────────────────────────

export type LitmMarkType = 'lmtag' | 'lmstatus' | 'lmchallenge';

// ─────────────────────────────────────────────────────────────────────────────
// Mark Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const lmtagMark = $mark('lmtag', () => ({
    parseDOM: [{ tag: 'span.lm-tag' }],
    toDOM: () => ['span', { class: 'lm-tag lm-mark' }, 0],
    parseMarkdown: {
        match: (node) => node.type === 'textDirective' && node.name === 'lmtag',
        runner: (state, node, type) => {
            state.openMark(type);
            state.next(node.children);
            state.closeMark(type);
        },
    },
    toMarkdown: {
        match: (mark) => mark.type.name === 'lmtag',
        runner: (state, mark) => {
            state.withMark(mark, 'textDirective', undefined, { name: 'lmtag' });
        },
    },
}));

export const lmstatusMark = $mark('lmstatus', () => ({
    parseDOM: [{ tag: 'span.lm-status' }],
    toDOM: () => ['span', { class: 'lm-status lm-mark' }, 0],
    parseMarkdown: {
        match: (node) => node.type === 'textDirective' && node.name === 'lmstatus',
        runner: (state, node, type) => {
            state.openMark(type);
            state.next(node.children);
            state.closeMark(type);
        },
    },
    toMarkdown: {
        match: (mark) => mark.type.name === 'lmstatus',
        runner: (state, mark) => {
            state.withMark(mark, 'textDirective', undefined, { name: 'lmstatus' });
        },
    },
}));

export const lmchallengeMark = $mark('lmchallenge', () => ({
    parseDOM: [{ tag: 'span.lm-challenge' }],
    toDOM: () => ['span', { class: 'lm-challenge lm-mark' }, 0],
    parseMarkdown: {
        match: (node) => node.type === 'textDirective' && node.name === 'lmchallenge',
        runner: (state, node, type) => {
            state.openMark(type);
            state.next(node.children);
            state.closeMark(type);
        },
    },
    toMarkdown: {
        match: (mark) => mark.type.name === 'lmchallenge',
        runner: (state, mark) => {
            state.withMark(mark, 'textDirective', undefined, { name: 'lmchallenge' });
        },
    },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Toggle Commands
// ─────────────────────────────────────────────────────────────────────────────

export function createToggleLitmMark(markType: MarkType) {
    return toggleMark(markType);
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Feature Bundle
// ─────────────────────────────────────────────────────────────────────────────

export const litmMarksFeature = [
    lmtagMark,
    lmstatusMark,
    lmchallengeMark,
];
