import { $node } from '@milkdown/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Thread Types
// ─────────────────────────────────────────────────────────────────────────────

import { ThreadType } from '../types/threadTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Thread Container Node (Remark Directive Based)
// ─────────────────────────────────────────────────────────────────────────────

export const threadContainerNode = $node('threadContainer', () => ({
    group: 'block',
    content: 'block+',      // Contains block-level content
    isolating: true,
    defining: true,

    attrs: {
        threadType: { default: 'system' },
        threadId: { default: '' },
        timestamp: { default: '' },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // DOM Parsing (HTML String -> Node)
    // Used when pasting HTML or loading from DOM
    // ─────────────────────────────────────────────────────────────────────────

    parseDOM: [{
        tag: 'div[data-thread-container]',
        getAttrs: (dom: HTMLElement) => ({
            threadType: dom.getAttribute('data-thread-type') || 'system',
            threadId: dom.getAttribute('data-thread-id') || '',
            timestamp: dom.getAttribute('data-timestamp') || '',
        }),
    }],

    // ─────────────────────────────────────────────────────────────────────────
    // DOM Serialization (Node -> HTML)
    // Used for rendering in Editor
    // ─────────────────────────────────────────────────────────────────────────

    toDOM: (node) => [
        'div',
        {
            'data-thread-container': '',
            'data-thread-type': node.attrs.threadType,
            'data-thread-id': node.attrs.threadId,
            'data-timestamp': node.attrs.timestamp,
            class: `thread-container thread-${node.attrs.threadType}`,
        },
        0, // Content hole
    ],

    // ─────────────────────────────────────────────────────────────────────────
    // Markdown Parsing (Remark Directives -> Node)
    // ─────────────────────────────────────────────────────────────────────────

    parseMarkdown: {
        match: (node) => {
            if (node.type === 'containerDirective') {
                console.log('[ThreadNode] Saw containerDirective:', node.name);
            }
            return node.type === 'containerDirective' && node.name === 'thread';
        },
        runner: (state, node, type) => {
            console.log('[ThreadNode] Running parser for:', node.name);
            const directiveNode = node as any;
            const attrs = directiveNode.attributes || {};

            const threadType = (attrs.type || 'system') as ThreadType;
            const threadId = (attrs.id || '') as string;
            const timestamp = (attrs.timestamp || '') as string;

            state.openNode(type, { threadType, threadId, timestamp });
            state.next(node.children);
            state.closeNode();
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Markdown Serialization (Node -> Remark Directive)
    // ─────────────────────────────────────────────────────────────────────────

    toMarkdown: {
        match: (node) => node.type.name === 'threadContainer',
        runner: (state, node) => {
            const { threadType, threadId, timestamp } = node.attrs;

            // Output standard remark-directive syntax
            // :::thread{type="xxx" id="xxx" timestamp="xxx"}
            const opener = `:::thread{type="${threadType}" id="${threadId}" timestamp="${timestamp}"}`;

            state.addNode('text', undefined, opener + '\n');
            state.next(node.content);
            state.addNode('text', undefined, ':::\n');
        },
    },
}));
