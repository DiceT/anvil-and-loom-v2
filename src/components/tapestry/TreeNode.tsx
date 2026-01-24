import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ChevronRight, ChevronDown, Folder, FileText, MapPin } from 'lucide-react';
import { TapestryNode } from '../../types/tapestry';
import { CategoryBadge } from './CategoryBadge';
import { TreeContextMenu } from './TreeContextMenu';
import { createPanelMacro } from '../../types/macro';

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
    onChangeBadge?: (path: string, currentCategory: string) => void;
    onDropNode?: (draggedPath: string, targetPath: string) => void;
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
    onMove,
    onChangeBadge,
    onDropNode
}: TreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

    const isFolder = node.type === 'folder';
    const isActive = !isFolder && activeEntryId === node.id;
    const paddingLeft = depth * 16;

    // React-DnD hook for dragging panels
    // @ts-ignore
    const [{ isDragging }, dragRef] = useDrag({
        type: 'PANEL',
        item: {
            type: 'PANEL',
            macroData: createPanelMacro(0, node.id, node.path, node.name),
        },
        canDrag: !isFolder, // Only drag files for now? Or folders too? User said folders too maybe. Let's allowing dragging folders later if backend supports it. For now files.
        collect: (monitor: any) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    // React-DnD hook for dropping
    // @ts-ignore
    const [{ isOver }, dropRef] = useDrop({
        accept: 'PANEL',
        canDrop: (item: any) => {
            // Don't drop on self
            if (item.macroData.path === node.path) return false;
            return true;
        },
        drop: (item: any, monitor) => {
            if (monitor.didDrop()) return;
            if (onDropNode) {
                const target = isFolder ? node.path : parentPath;
                onDropNode(item.macroData.panelPath, target);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
        }),
    });

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
                ref={(el) => { dragRef(el); dropRef(el); }}
                className={`
                    group flex items-center gap-2 h-8 cursor-pointer transition-colors
                    ${isActive ? 'bg-slate-700 border-l-2 border-purple-500' : 'hover:bg-slate-800'}
                    ${isDragging ? 'opacity-50' : ''}
                    ${isOver ? 'bg-purple-900/50 ring-1 ring-purple-500' : ''}
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
                    node.category === 'map' ? (
                        <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0 ml-4" />
                    ) : (
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 ml-4" />
                    )
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
                            onChangeBadge={onChangeBadge}
                            onDropNode={onDropNode}
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
                    onChangeBadge={node.type === 'entry' && onChangeBadge ? () => onChangeBadge(node.path, node.category || '') : undefined}
                />
            )}
        </>
    );
}
