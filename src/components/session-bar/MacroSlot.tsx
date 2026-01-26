import { useDrop, useDrag } from 'react-dnd'
import { useMacroStore } from '../../stores/useMacroStore'
import { MacroSlot as MacroSlotType, createTableMacro, createPanelMacro } from '../../types/macro'
import { MacroSlotIcon } from './MacroSlotIcon'
import { MacroSlotTooltip } from './MacroSlotTooltip'
import { executeMacro } from '../../lib/macro/executeMacro'
import { useState } from 'react'
import React from 'react'

interface MacroSlotProps {
    slot: MacroSlotType
    visualIndex: number
}

export function MacroSlot({ slot, visualIndex }: MacroSlotProps) {
    const { setSlot, clearSlot, moveSlot } = useMacroStore()
    const [showTooltip, setShowTooltip] = useState(false)

    const isEmpty = slot.type === 'empty'

    // ─── Drop Target ───
    // @ts-ignore
    const [{ isOver, canDrop }, dropRef] = useDrop({
        accept: ['DICE', 'TABLE', 'PANEL', 'ORACLE', 'CLOCK', 'TRACK', 'MACRO_SLOT'],
        drop: (item: any) => {
            if (item.type === 'MACRO_SLOT') {
                // Reordering
                moveSlot(item.index, slot.index)
            } else if (item.type === 'TABLE' && slot.type === 'table' && item.macroData.tableId !== slot.tableId) {
                // Combine into Oracle
                // We need to import createOracleMacro, but since we are in the component, we can construct the object manually or fix imports
                // Let's use the helper if imported, or just constructing the object matching the type.
                // Importing createOracleMacro is cleaner.
                const newOracle: MacroSlotType = {
                    id: `macro_${slot.index}_${Date.now()}`,
                    index: slot.index,
                    type: 'oracle',
                    label: 'Oracle',
                    oracleName: `${slot.tableName} + ${item.macroData.tableName}`,
                    oracleTableIds: [slot.tableId!, item.macroData.tableId],
                    oracleTableNames: [slot.tableName!, item.macroData.tableName],
                }
                setSlot(slot.index, newOracle)
            } else {
                // New macro from drag source (Replace)
                setSlot(slot.index, {
                    ...item.macroData,
                    index: slot.index,
                })
            }
        },
        collect: (monitor: any) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    })

    // ─── Drag Source (for reordering) ───
    // @ts-ignore
    const [{ isDragging }, dragRef] = useDrag({
        type: 'MACRO_SLOT',
        item: { type: 'MACRO_SLOT', index: slot.index, slot },
        canDrag: !isEmpty,
        collect: (monitor: any) => ({
            isDragging: monitor.isDragging(),
        }),
    })

    // ─── Click Handler ───
    const handleClick = () => {
        if (!isEmpty) {
            executeMacro(slot)
        }
    }

    // ─── Context Menu ───
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        if (!isEmpty) {
            // Show context menu with Edit / Clear options
            // For now, just clear
            clearSlot(slot.index)
        }
    }

    // ─── Styles ───
    const baseStyles = `
    relative
    w-16 h-16
    flex flex-col items-center justify-center gap-1
    rounded-lg
    transition-all duration-150
    cursor-pointer
  `

    const stateStyles = isEmpty
        ? 'bg-canvas-surface/50 border border-dashed border-border hover:border-type-tertiary'
        : 'bg-canvas-surface border border-border hover:bg-canvas-surface/80 hover:border-sapphire/50'

    const dropStyles = isOver && canDrop
        ? 'bg-amethyst/20 border-2 border-dashed border-amethyst'
        : ''

    const dragStyles = isDragging
        ? 'opacity-50'
        : ''

    return (
        <div
            ref={(node) => {
                dragRef(dropRef(node))
            }}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onDragStart={(e) => {
                if (isEmpty) return;
                // React-DnD handles the main drag. We validly append data for native targets.
                e.dataTransfer.setData('application/anl+json', JSON.stringify({
                    type: 'macro',
                    id: slot.id,
                    name: slot.label,
                    macro: slot
                }));
                e.dataTransfer.effectAllowed = 'copyMove';
            }}
            onDragOver={(e) => {
                if (e.dataTransfer.types.includes('application/anl+json')) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }
            }}
            onDrop={(e) => {
                const data = e.dataTransfer.getData('application/anl+json');
                if (data) {
                    try {
                        const item = JSON.parse(data);
                        e.preventDefault();
                        if (item.type === 'table') {
                            const newMacro = createTableMacro(slot.index, item.id, item.name);
                            setSlot(slot.index, newMacro);
                        } else if (item.type === 'panel') {
                            // Helper to guess path/title if not fully provided, though logic usually provides it
                            // For now assume item has what we need, or fallback
                            const path = item.path || item.id;
                            const title = item.name;
                            const newMacro = createPanelMacro(slot.index, item.id, path, title);
                            setSlot(slot.index, newMacro);
                        }
                    } catch (err) {
                        console.error('Failed to parse dropped macro data', err);
                    }
                }
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`${baseStyles} ${stateStyles} ${dropStyles} ${dragStyles}`}
            {...((!isEmpty) ? { draggable: true } : {})}
        >
            {/* Keyboard shortcut indicator */}
            <span className="absolute top-1 left-1.5 text-[10px] text-type-tertiary font-mono">
                {visualIndex + 1}
            </span>

            {isEmpty ? (
                <span className="text-type-tertiary text-xs">Drop</span>
            ) : (
                <>
                    <MacroSlotIcon type={slot.type} />
                    <span className="text-[10px] text-type-secondary truncate max-w-[56px] text-center">
                        {slot.label}
                    </span>
                </>
            )}

            {/* Tooltip */}
            {showTooltip && !isEmpty && (
                <MacroSlotTooltip slot={slot} />
            )}
        </div>
    )
}
