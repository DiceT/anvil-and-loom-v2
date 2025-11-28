import { useState, useMemo } from 'react';
import { TapestryNode } from '../../types/tapestry';
import { Folder } from 'lucide-react';

// Dialog component (shared with TapestryTree)
interface DialogProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
    confirmText: string;
    confirmDisabled?: boolean;
    confirmDanger?: boolean;
}

function Dialog({ title, children, onClose, onConfirm, confirmText, confirmDisabled, confirmDanger }: DialogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-800 rounded-lg shadow-2xl border border-slate-700 w-full max-w-md mx-4">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                </div>
                <div className="p-6">
                    {children}
                </div>
                <div className="flex gap-3 p-6 border-t border-slate-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={confirmDisabled}
                        className={`flex-1 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmDanger
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface MoveNodeDialogProps {
    nodePath: string;
    nodeName: string;
    tree: TapestryNode;
    onClose: () => void;
    onConfirm: (targetPath: string) => void;
}

export function MoveNodeDialog({
    nodePath,
    nodeName,
    tree,
    onClose,
    onConfirm
}: MoveNodeDialogProps) {
    const [selectedTarget, setSelectedTarget] = useState<string>(tree.path);

    // Flatten folders for the dropdown
    const folders = useMemo(() => {
        const result: { path: string; name: string; depth: number }[] = [];

        // Add root
        result.push({ path: tree.path, name: tree.name, depth: 0 });

        const traverse = (node: TapestryNode, depth: number) => {
            if (node.children) {
                for (const child of node.children) {
                    if (child.type === 'folder') {
                        // Don't allow moving into itself or its children
                        if (child.path === nodePath || child.path.startsWith(nodePath + '\\') || child.path.startsWith(nodePath + '/')) {
                            continue;
                        }

                        result.push({ path: child.path, name: child.name, depth });
                        traverse(child, depth + 1);
                    }
                }
            }
        };

        traverse(tree, 1);
        return result;
    }, [tree, nodePath]);

    return (
        <Dialog
            title="Move Item"
            onClose={onClose}
            onConfirm={() => onConfirm(selectedTarget)}
            confirmText="Move"
        >
            <div className="space-y-4">
                <p className="text-slate-300">
                    Move <span className="font-semibold text-white">{nodeName}</span> to:
                </p>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-400">
                        Destination Folder
                    </label>
                    <div className="relative">
                        <select
                            value={selectedTarget}
                            onChange={(e) => setSelectedTarget(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                        >
                            {folders.map((folder) => (
                                <option key={folder.path} value={folder.path}>
                                    {'\u00A0'.repeat(folder.depth * 4)}{folder.name}
                                </option>
                            ))}
                        </select>
                        <Folder className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
