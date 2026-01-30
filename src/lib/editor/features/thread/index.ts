import { $node, $remark } from '@milkdown/kit/utils';
import directive from 'remark-directive';
import { expectDomTypeError } from '@milkdown/exception';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Define the Node Schema (ProseMirror)
// ─────────────────────────────────────────────────────────────────────────────

console.log('[ThreadFeature] Module Loaded. Registering nodes...');

export const threadNode = $node('thread_container', () => ({
    group: 'block',
    content: 'block+', // Threads contain other blocks (headers, paragraphs, lists)
    atom: false,      // It is a container, not an atom
    isolating: true,  // Important for keeping cursor valid
    attrs: {
        type: { default: 'note' },
        tid: { default: '' },        // ← Changed from 'id' to 'tid'
        timestamp: { default: '' },
    },
    parseDOM: [
        {
            tag: 'div.thread-container',
            getAttrs: (dom) => {
                if (!(dom instanceof HTMLElement)) {
                    throw expectDomTypeError(dom);
                }
                return {
                    type: dom.getAttribute('data-thread-type') || 'note',
                    tid: dom.getAttribute('data-thread-tid') || '',
                    timestamp: dom.getAttribute('data-timestamp') || '',
                };
            },
        },
    ],
    toDOM: (node) => [
        'div',
        {
            class: `thread-container thread-${node.attrs.type}`,
            'data-thread-type': node.attrs.type,
            'data-thread-tid': node.attrs.tid,
            'data-timestamp': node.attrs.timestamp,
        },
        0, // Slot for content
    ],
    parseMarkdown: {

        match: (node) => node.type === 'containerDirective' && node.name === 'thread',
        runner: (state, node, type) => {
            console.log('[ThreadFeature] Parsing Directive:', node.name, node.attributes);
            // Attributes from remark-directive are usually in node.attributes
            const typeAttr = (node.attributes as any)?.type || 'note';
            // Fallback for ID and Timestamp if passed as attributes
            const tidAttr = (node.attributes as any)?.tid || '';
            const tsAttr = (node.attributes as any)?.timestamp || '';

            state.openNode(type, { type: typeAttr, tid: tidAttr, timestamp: tsAttr });
            state.next(node.children);
            state.closeNode();
        },
    },
    toMarkdown: {
        match: (node) => node.type.name === 'thread_container',
        runner: (state, node) => {
            console.log('[ThreadFeature] Serializing Thread:', node.attrs);
            state.openNode('containerDirective', undefined, {
                name: 'thread',
                attributes: {
                    type: node.attrs.type,
                    tid: node.attrs.tid,
                    timestamp: node.attrs.timestamp,
                },
            });
            state.next(node.content);
            state.closeNode();
        },
    },
}));

// ─────────────────────────────────────────────────────────────────────────────
// 2. Define Safety Nodes (Prevent Crash on other Directives)
// ─────────────────────────────────────────────────────────────────────────────

// Handle text directives (e.g. :emoji) by rendering as text
export const textDirectiveNode = $node('text_directive', () => ({
    group: 'inline',
    inline: true,
    content: 'text*', // Allow text content
    parseMarkdown: {
        match: (node) => {
            if (node.type === 'textDirective') {
                // Don't catch LitM directives - let the mark handlers deal with them
                const litmDirectives = ['lmtag', 'lmstatus', 'lmchallenge'];
                if (litmDirectives.includes(node.name)) {
                    return false;
                }
                console.log('[ThreadFeature] Matched textDirective:', node);
                return true;
            }
            return false;
        },
        runner: (state, node, type) => {
            // Just render the children/text
            state.openNode(type);
            state.next(node.children);
            state.closeNode();
        },
    },
    toDOM: (_node) => ['span', { class: 'directive-text' }, 0],
    toMarkdown: {
        match: (node) => node.type.name === 'text_directive',
        runner: (state, node) => {
            state.next(node.content);
        },
    },
}));

// Handle leaf directives (e.g. ::youtube) by rendering as paragraph
export const leafDirectiveNode = $node('leaf_directive', () => ({
    group: 'block',
    content: 'inline*',
    parseMarkdown: {
        match: (node) => node.type === 'leafDirective',
        runner: (state, node, type) => {
            state.openNode(type);
            state.next(node.children);
            state.closeNode();
        },
    },
    toDOM: (_node) => ['div', { class: 'directive-leaf' }, 0],
    toMarkdown: {
        match: (node) => node.type.name === 'leaf_directive',
        runner: (state, node) => {
            state.next(node.content);
        },
    },
}));

// ─────────────────────────────────────────────────────────────────────────────
// 3. Define the Remark Plugin (Bridge to Markdown)
// ─────────────────────────────────────────────────────────────────────────────

// We use $remark helper for cleaner registration
export const remarkDirectivePlugin = $remark('remark-directive', () => directive);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Define the Feature Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export const threadFeature = [
    remarkDirectivePlugin,
    threadNode,
    textDirectiveNode,
    leafDirectiveNode
].flat();
