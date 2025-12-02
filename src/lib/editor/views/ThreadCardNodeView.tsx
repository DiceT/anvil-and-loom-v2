import { useNodeViewContext } from '@prosemirror-adapter/react';
import { PanelThreadCard } from '../../../components/tapestry/PanelThreadCard';
import { ThreadModel } from '../../../types/tapestry';

export const ThreadCardNodeView = () => {
    const { node } = useNodeViewContext();
    const threadData = node.attrs.threadData as ThreadModel;



    if (!threadData) {
        return (
            <div className="p-4 border border-red-500 rounded bg-red-900/20 text-red-200">
                Invalid Thread Data
            </div>
        );
    }

    return (
        <div contentEditable={false} className="select-none not-prose text-slate-200">
            <PanelThreadCard card={threadData} defaultExpanded={false} />
        </div>
    );
};
