import { $mark, $inputRule } from '@milkdown/kit/utils';
import { toggleMark } from '@milkdown/kit/prose/commands';
import { MarkType } from '@milkdown/kit/prose/model';
import { InputRule } from '@milkdown/prose/inputrules';

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
// Input Rules (Auto-convert :lmtag[text] syntax on typing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates an input rule that converts :markname[text] to a styled mark
 * Triggers when user types space, newline, or reaches end of input after the pattern
 */
function createLitmInputRule(markName: string) {
    // Match :markname[content] followed by whitespace or end
    const pattern = new RegExp(`:${markName}\\[([^\\]]+)\\](\\s?)$`);

    return $inputRule((ctx) => {
        return new InputRule(pattern, (state, match, start, end) => {
            const markType = state.schema.marks[markName];
            if (!markType) return null;

            const capturedText = match[1]; // Text inside brackets
            const trailingSpace = match[2] || ''; // Preserve trailing space if present

            // Create transaction: delete the raw syntax, insert marked text
            const tr = state.tr.delete(start, end);

            // Create text node with the mark applied
            const markedText = state.schema.text(capturedText, [markType.create()]);

            // Insert the marked text
            tr.insert(start, markedText);

            // If there was a trailing space, add it after (unmarked)
            if (trailingSpace) {
                tr.insert(start + capturedText.length, state.schema.text(trailingSpace));
            }

            return tr;
        });
    });
}

export const lmtagInputRule = createLitmInputRule('lmtag');
export const lmstatusInputRule = createLitmInputRule('lmstatus');
export const lmchallengeInputRule = createLitmInputRule('lmchallenge');

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
    // Marks
    lmtagMark,
    lmstatusMark,
    lmchallengeMark,
    // Input Rules (auto-convert on typing)
    lmtagInputRule,
    lmstatusInputRule,
    lmchallengeInputRule,
];