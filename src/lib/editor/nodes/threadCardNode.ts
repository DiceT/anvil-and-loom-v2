import { $node, $nodeAttr } from '@milkdown/utils';

export const threadCardNode = $node('threadCard', () => ({
    group: 'block',
    atom: true, // Cannot be split or edited
    isolating: true,
    attrs: {
        threadId: $nodeAttr(''),
        threadData: $nodeAttr('null'), // Store full Thread object
    },
    parseDOM: [{
        tag: 'div[data-thread-card]',
        getAttrs: (dom: HTMLElement) => ({
            threadId: dom.getAttribute('data-thread-id'),
            threadData: JSON.parse(dom.getAttribute('data-thread-data') || 'null'),
        }),
    }],
    toDOM: (node) => ['div', {
        'data-thread-card': '',
        'data-thread-id': node.attrs.threadId,
        'data-thread-data': JSON.stringify(node.attrs.threadData),
    }],
    parseMarkdown: {
        match: (node) => node.type === 'code' && (node.lang === 'thread-card' || node.lang === 'result-card'),
        runner: (state, node, type) => {
            let threadData;
            try {
                threadData = JSON.parse(node.value as string);
                if (!threadData || typeof threadData !== 'object') {
                    console.warn('Invalid thread data format:', threadData);
                    threadData = null;
                }
            } catch (e) {
                console.error('Failed to parse thread card JSON:', e, node.value);
                threadData = null;
            }
            state.addNode(type, {
                threadId: threadData?.id || '',
                threadData,
            });
        },
    },
    toMarkdown: {
        match: (node) => node.type.name === 'threadCard',
        runner: (state, node) => {
            const thread = node.attrs.threadData;
            const json = JSON.stringify(thread, null, 2);
            state.addNode('code', undefined, json, { lang: 'thread-card' });
        },
    },
}));
