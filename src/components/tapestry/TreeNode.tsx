import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import { TapestryNode } from '../../types/tapestry';
import { CategoryBadge } from './CategoryBadge';
import { TreeContextMenu } from './TreeContextMenu';

interface TreeNodeProps {
    node: TapestryNode;
    parentPath: string;
    depth: number;
    activeEntryId?: string;
    onEntryClick: (path: string) => void;
    onNewEntry: (parentPath: string) => void;
    onNewFolder: (parentPath: string) => void;
    onRename: (path: string, currentName: string) => void;
    onDelete: (path: string, name: string) => void;
    onMove: (path: string, name: string) => void;
}

export function TreeNode({
    node,
    parentPath,
    depth,
    activeEntryId,
    onEntryClick,
    onNewEntry,
    onNewFolder,
    onRename,
    onDelete,
    onMove
}: TreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

    const isFolder = node.type === 'folder';
    const isActive = !isFolder && activeEntryId === node.id;
    const paddingLeft = depth * 16;

    const handleClick = () => {
        if (isFolder) {
            setIsExpanded(!isExpanded);
        } else {
            onEntryClick(node.path);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    // For folders, new items go inside. For files, they go in the parent folder (siblings).
    const creationPath = isFolder ? node.path : parentPath;

    return (
        <>
            <div
                className={`
                    group flex items-center gap-2 h-8 cursor-pointer transition-colors
                    ${isActive ? 'bg-slate-700 border-l-2 border-purple-500' : 'hover:bg-slate-800'}
                `}
                style={{ paddingLeft: `${paddingLeft}px` }}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
            >
                {/* Icon */}
                {isFolder ? (
                    isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )
                ) : (
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 ml-4" />
                )}

                {isFolder && <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />}

                {/* Name */}
                <span className={`text-sm flex-1 truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {node.name}
                </span>

                {/* Category Badge for Entries */}
                {!isFolder && node.category && (
                    <CategoryBadge category={node.category} />
                )}
            </div>

            {/* Children */}
            {isFolder && isExpanded && node.children && (
                <div>
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            parentPath={node.path}
                            depth={depth + 1}
                            activeEntryId={activeEntryId}
                            onEntryClick={onEntryClick}
                            onNewEntry={onNewEntry}
                            onNewFolder={onNewFolder}
                            onRename={onRename}
                            onDelete={onDelete}
                            onMove={onMove}
                        />
                    ))}
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <TreeContextMenu
                    node={node}
                    position={contextMenu}
                    onClose={() => setContextMenu(null)}
                    onNewEntry={() => onNewEntry(creationPath)}
                    onNewFolder={() => onNewFolder(creationPath)}
                    onRename={() => onRename(node.path, node.name)}
                    onDelete={() => onDelete(node.path, node.name)}
                    onMove={() => onMove(node.path, node.name)}
                />
            )}
        </>
    );
}
