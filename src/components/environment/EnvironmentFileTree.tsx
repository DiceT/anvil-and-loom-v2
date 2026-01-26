/**
 * EnvironmentFileTree
 * 
 * Hierarchy:
 * - Environment (Tables)
 * - Aspects (Folders -> Tables)
 * - Domains (Folders -> Tables)
 */

import { useState, useMemo, useEffect } from 'react';
import { useEnvironmentStore } from '../../stores/useEnvironmentStore';
import { useTabStore } from '../../stores/useTabStore';
import { Table } from '../../types/weave';
import { Plus, Dices, FileJson, ChevronRight, ChevronDown } from 'lucide-react';
import { WeaveService } from '../../core/weave/WeaveService';
import { ContextMenu } from '../weave/shared/ContextMenu';

interface EnvironmentFileTreeProps { }

type GroupedTables = {
    environment: Table[];
    aspects: Record<string, Table[]>;
    domains: Record<string, Table[]>;
};

interface MenuState {
    isOpen: boolean;
    x: number;
    y: number;
    table: Table | null;
}

function FolderItem({ name, tables, type, onQuickRoll, onContextMenu, onTableClick, isOpen, onToggle }: {
    name: string;
    tables: Table[];
    type: 'aspect' | 'domain';
    onQuickRoll: (e: React.MouseEvent, t: Table) => Promise<void>;
    onContextMenu: (e: React.MouseEvent, t: Table) => void;
    onTableClick: (t: Table) => void;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="mb-1">
            <div
                className="flex items-center gap-1.5 px-2 py-1 hover:bg-canvas-hover cursor-pointer text-sm font-medium text-type-secondary select-none"
                onClick={onToggle}
                draggable="true"
                onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', name);
                    e.dataTransfer.setData('application/anl+json', JSON.stringify({
                        type: type || 'panel',
                        name: name,
                        isFolder: true
                    }));
                    e.dataTransfer.effectAllowed = 'copy';
                }}
            >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="truncate flex-1">{name}</span>
                <span className="text-xs text-type-tertiary">{tables.length}</span>
            </div>

            {isOpen && (
                <ul className="ml-4 border-l border-border/50 pl-2 space-y-0.5 mt-0.5">
                    {tables.map(table => (
                        <li
                            key={table.id}
                            draggable="true"
                            onDragStart={(e) => {
                                const type = table.category?.startsWith('Aspect') ? 'aspect' :
                                    table.category?.startsWith('Domain') ? 'domain' : 'table';
                                e.dataTransfer.setData('application/anl+json', JSON.stringify({
                                    type,
                                    id: table.id,
                                    name: table.name,
                                    category: table.category
                                }));
                                e.dataTransfer.effectAllowed = 'copy';
                            }}
                            className="flex items-center justify-between group px-2 py-1.5 rounded hover:bg-canvas-hover cursor-pointer text-sm"
                            onClick={() => onTableClick(table)}
                            onContextMenu={(e) => onContextMenu(e, table)}
                        >
                            <span className="truncate">{table.name}</span>
                            <button
                                onClick={(e) => onQuickRoll(e, table)}
                                className="opacity-0 group-hover:opacity-100 text-gold hover:text-amber-300 p-0.5"
                                title="Quick Roll"
                            >
                                <Dices size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export function EnvironmentFileTree({ }: EnvironmentFileTreeProps) {
    const { tables, loadTables, createTable, createAspect, createDomain, deleteTable, openFolders, toggleFolder, expandFolder } = useEnvironmentStore();
    const { openTab } = useTabStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [creatingType, setCreatingType] = useState<'Aspect' | 'Domain' | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [menu, setMenu] = useState<MenuState>({
        isOpen: false,
        x: 0,
        y: 0,
        table: null,
    });

    useEffect(() => {
        loadTables();
    }, [loadTables]);

    const grouped = useMemo(() => {
        const acc: GroupedTables = {
            environment: [],
            aspects: {},
            domains: {}
        };
        tables.forEach(table => {
            const cat = table.category || 'Environment';
            const matchesSearch = !searchQuery || table.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return;

            if (cat === 'Environment') {
                acc.environment.push(table);
            } else if (cat.startsWith('Aspect - ')) {
                const folderName = cat.replace('Aspect - ', '');
                if (!acc.aspects[folderName]) acc.aspects[folderName] = [];
                acc.aspects[folderName].push(table);
            } else if (cat.startsWith('Domain - ')) {
                const folderName = cat.replace('Domain - ', '');
                if (!acc.domains[folderName]) acc.domains[folderName] = [];
                acc.domains[folderName].push(table);
            } else {
                acc.environment.push(table);
            }
        });
        acc.environment.sort((a, b) => a.name.localeCompare(b.name));
        return acc;
    }, [tables, searchQuery]);

    const handleStartCreate = (type: 'Aspect' | 'Domain') => {
        setCreatingType(type);
        setNewItemName('');
    }

    const handleCancelCreate = () => {
        setCreatingType(null);
        setNewItemName('');
    }

    const handleConfirmCreate = async () => {
        if (!newItemName.trim() || !creatingType) return;
        const name = newItemName.trim();
        if (creatingType === 'Aspect') {
            await createAspect(name);
            expandFolder(`aspect-${name}`);
        } else {
            await createDomain(name);
            expandFolder(`domain-${name}`);
        }
        setCreatingType(null);
        setNewItemName('');
    };

    const handleCreateEnvTable = async () => {
        const table = await createTable('Environment');
        openTab({ id: `weave-${table.id}`, type: 'weave', title: table.name, weaveTableId: table.id });
    };

    const handleTableClick = (table: Table) => {
        openTab({ id: `weave-${table.id}`, type: 'weave', title: table.name, weaveTableId: table.id });
    };

    const handleQuickRoll = async (e: React.MouseEvent, table: Table) => {
        e.stopPropagation();
        try {
            await WeaveService.roll(table.id);
        } catch (err) {
            console.error('Failed to roll table:', err);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, table: Table) => {
        e.preventDefault();
        e.stopPropagation();
        setMenu({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            table: table,
        });
    };

    const handleDeleteFromMenu = async () => {
        if (menu.table) {
            if (window.confirm(`Delete ${menu.table.name}?`)) {
                await deleteTable(menu.table.id);
            }
        }
        setMenu({ ...menu, isOpen: false });
    };

    return (
        <aside className="flex flex-col h-full bg-canvas-sidebar border-r border-border text-type-primary select-none">
            {/* Header */}
            <div className="p-2 border-b border-border">
                <input
                    type="text"
                    placeholder="Search environment..."
                    className="w-full px-2 py-1 bg-canvas-input border border-border rounded text-sm focus:outline-none focus:border-amethyst"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {/* ENVIRONMENT SECTION */}
                <div className="folder-group">
                    <div className="flex items-center justify-between mb-1 px-1 group text-type-secondary hover:text-type-primary">
                        <span className="font-bold text-xs uppercase tracking-wider">Environment</span>
                        <button
                            onClick={handleCreateEnvTable}
                            className="p-1 hover:bg-canvas-hover rounded text-amethyst transition-opacity"
                            title="New Generic Table"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <ul className="ml-2 border-l border-border/50 pl-2 space-y-0.5">
                        {grouped.environment.map(table => (
                            <li
                                key={table.id}
                                className="flex items-center justify-between group px-2 py-1.5 rounded hover:bg-canvas-hover cursor-pointer text-sm"
                                onClick={() => handleTableClick(table)}
                                onContextMenu={(e) => handleContextMenu(e, table)}
                                draggable="true"
                                onDragStart={(e) => {
                                    e.stopPropagation();
                                    e.dataTransfer.setData('text/plain', table.name);
                                    e.dataTransfer.setData('application/anl+json', JSON.stringify({
                                        type: 'table',
                                        id: table.id,
                                        name: table.name,
                                        category: 'Environment'
                                    }));
                                    e.dataTransfer.effectAllowed = 'copy';
                                }}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <FileJson size={14} className="text-type-tertiary" />
                                    <span className="truncate">{table.name}</span>
                                </div>
                                <button
                                    onClick={(e) => handleQuickRoll(e, table)}
                                    className="opacity-0 group-hover:opacity-100 text-gold hover:text-amber-300 p-0.5"
                                    title="Quick Roll"
                                >
                                    <Dices size={14} />
                                </button>
                            </li>
                        ))}
                        {grouped.environment.length === 0 && <li className="text-xs text-type-tertiary italic px-2">Empty</li>}
                    </ul>
                </div>

                {/* ASPECTS SECTION */}
                <div className="folder-group">
                    <div className="flex items-center justify-between mb-1 px-1 group text-type-secondary hover:text-type-primary">
                        <span className="font-bold text-xs uppercase tracking-wider text-teal-400">Aspects</span>
                        <button
                            onClick={() => handleStartCreate('Aspect')}
                            className="p-1 hover:bg-canvas-hover rounded text-teal-400 transition-opacity"
                            title="New Aspect"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {creatingType === 'Aspect' && (
                        <div className="mx-2 mb-2 p-2 bg-canvas-surface rounded border border-border">
                            <input
                                autoFocus
                                type="text"
                                className="w-full bg-canvas-input border border-border rounded px-1 text-sm mb-2"
                                placeholder="Aspect Name"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreate()}
                            />
                            <div className="flex justify-end gap-2 text-xs">
                                <button onClick={handleCancelCreate} className="text-type-tertiary hover:text-type-primary">Cancel</button>
                                <button onClick={handleConfirmCreate} className="text-teal-400 hover:text-teal-300 font-medium">Create</button>
                            </div>
                        </div>
                    )}

                    {Object.entries(grouped.aspects).map(([name, tables]) => (
                        <FolderItem
                            key={name}
                            name={name}
                            tables={tables}
                            type="aspect"
                            onQuickRoll={handleQuickRoll}
                            onContextMenu={handleContextMenu}
                            onTableClick={handleTableClick}
                            isOpen={!!openFolders[`aspect-${name}`]}
                            onToggle={() => toggleFolder(`aspect-${name}`)}
                        />
                    ))}
                    {Object.keys(grouped.aspects).length === 0 && !creatingType && <span className="text-xs text-type-tertiary italic px-3">No Aspects</span>}
                </div>

                {/* DOMAINS SECTION */}
                <div className="folder-group">
                    <div className="flex items-center justify-between mb-1 px-1 group text-type-secondary hover:text-type-primary">
                        <span className="font-bold text-xs uppercase tracking-wider text-amber-400">Domains</span>
                        <button
                            onClick={() => handleStartCreate('Domain')}
                            className="p-1 hover:bg-canvas-hover rounded text-amber-400 transition-opacity"
                            title="New Domain"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {creatingType === 'Domain' && (
                        <div className="mx-2 mb-2 p-2 bg-canvas-surface rounded border border-border">
                            <input
                                autoFocus
                                type="text"
                                className="w-full bg-canvas-input border border-border rounded px-1 text-sm mb-2"
                                placeholder="Domain Name"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreate()}
                            />
                            <div className="flex justify-end gap-2 text-xs">
                                <button onClick={handleCancelCreate} className="text-type-tertiary hover:text-type-primary">Cancel</button>
                                <button onClick={handleConfirmCreate} className="text-amber-400 hover:text-amber-300 font-medium">Create</button>
                            </div>
                        </div>
                    )}

                    {Object.entries(grouped.domains).map(([name, tables]) => (
                        <FolderItem
                            key={name}
                            name={name}
                            tables={tables}
                            type="domain"
                            onQuickRoll={handleQuickRoll}
                            onContextMenu={handleContextMenu}
                            onTableClick={handleTableClick}
                            isOpen={!!openFolders[`domain-${name}`]}
                            onToggle={() => toggleFolder(`domain-${name}`)}
                        />
                    ))}
                    {Object.keys(grouped.domains).length === 0 && !creatingType && <span className="text-xs text-type-tertiary italic px-3">No Domains</span>}
                </div>
            </div>

            <div className="p-2 border-t border-border text-xs text-center text-type-tertiary">
                Stored in .environment
            </div>

            {menu.isOpen && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    onClose={() => setMenu({ ...menu, isOpen: false })}
                    items={[
                        {
                            label: 'Delete',
                            variant: 'danger',
                            onClick: handleDeleteFromMenu
                        }
                    ]}
                />
            )}
        </aside>
    );
}
