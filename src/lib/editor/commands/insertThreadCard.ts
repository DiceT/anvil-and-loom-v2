import { $command } from '@milkdown/utils';
import { editorViewCtx } from '@milkdown/core';
import { Thread } from '../../../types/thread';
import { threadCardNode } from '../nodes/threadCardNode';

export const insertThreadCard = $command('InsertThreadCard', (ctx) => {
    return (thread?: Thread) => () => {
        if (!thread) return false;
        const view = ctx.get(editorViewCtx);
        const { state, dispatch } = view;
        const { tr } = state;

        // Create the node using the schema type from our custom node definition
        // Note: threadCardNode.type(ctx) gives the NodeType
        const nodeType = threadCardNode.type(ctx);

        const node = nodeType.create({
            threadId: thread.id,
            threadData: thread,
        });

        dispatch(tr.replaceSelectionWith(node).scrollIntoView());
        return true;
    };
});
