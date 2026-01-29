import { $command } from '@milkdown/utils';
import { TextSelection } from '@milkdown/prose/state';
import { DOMParser as ProseMirrorDOMParser } from '@milkdown/prose/model';

// ─────────────────────────────────────────────────────────────────────────────
// Insert Thread Markdown Command
// 
// Inserts preprocessed thread HTML at the end of the document
// ─────────────────────────────────────────────────────────────────────────────

export const insertThreadMarkdown = $command('insertThreadMarkdown', (_ctx) => {
    return (threadHtml: string) => {
        return (state, dispatch) => {
            if (!dispatch) return false;

            const { tr, schema } = state;

            // Find the end of the document
            const endPos = state.doc.content.size;

            // Parse the HTML string into a document fragment
            // We need to use the browser's DOMParser to create a DOM node first
            const parser = new DOMParser();
            const doc = parser.parseFromString(
                `<div>${threadHtml}</div>`,
                'text/html'
            );
            const container = doc.body.firstChild;

            if (container) {
                // Use ProseMirror's DOMParser to parse the DOM node into a Slice/Fragment
                const pmParser = ProseMirrorDOMParser.fromSchema(schema);
                const slice = pmParser.parseSlice(container, { preserveWhitespace: true });

                // Insert at the end
                tr.insert(endPos, slice.content);

                // Move selection to after the inserted content
                const newPos = tr.doc.content.size;
                tr.setSelection(TextSelection.create(tr.doc, newPos));
            }

            dispatch(tr);
            return true;
        };
    };
});
