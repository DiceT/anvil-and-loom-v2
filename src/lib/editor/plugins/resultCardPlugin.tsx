import { $node, $view } from '@milkdown/utils';
import { createRoot } from 'react-dom/client';
import { ResultCard } from '../../../components/tapestry/ResultCard';
import { ResultCardModel } from '../../../types/tapestry';
import { Node } from '@milkdown/prose/model';
import { EditorView, NodeView } from '@milkdown/prose/view';

// Define the node schema
export const resultCardNode = $node('result_card', () => ({
    group: 'block',
    atom: true,
    attrs: {
        json: { default: '{}' }
    },
    parseDOM: [{
        tag: 'div[data-type="result-card"]',
        getAttrs: (dom) => ({ json: (dom as HTMLElement).getAttribute('data-json') })
    }],
    toDOM: (node) => ['div', { 'data-type': 'result-card', 'data-json': node.attrs.json }],
    parseMarkdown: {
        match: (node) => node.type === 'code' && node.lang === 'result-card',
        runner: (state, node, type) => {
            state.addNode(type, { json: node.value });
        }
    },
    toMarkdown: {
        match: node => node.type.name === 'result_card',
        runner: (state, node) => {
            state.addNode('code', undefined, node.attrs.json, { lang: 'result-card' });
        }
    }
}));

// Define the node view
export const resultCardView = $view(resultCardNode, () => (node: Node, view: EditorView, getPos: () => number | undefined) => {
    const dom = document.createElement('div');
    dom.classList.add('result-card-container');

    const root = createRoot(dom);

    try {
        const card = JSON.parse(node.attrs.json) as ResultCardModel;
        root.render(<ResultCard card={card} />);
    } catch (e) {
        console.error('Failed to parse result card JSON', e);
        root.render(
            <div className="p-4 text-red-500 bg-red-900/20 rounded border border-red-900/50">
                Invalid Result Card Data
            </div>
        );
    }

    return {
        dom,
        ignoreMutation: () => true,
        destroy: () => {
            root.unmount();
        }
    };
});
