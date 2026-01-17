/**
 * ContextMenu - Right-click context menu
 */

import { useEffect, useRef } from 'react';
import './ContextMenu.css';

interface MenuItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Adjust position to keep menu on screen
    const adjustedX = Math.min(x, window.innerWidth - 160);
    const adjustedY = Math.min(y, window.innerHeight - (items.length * 36 + 8));

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={{ left: adjustedX, top: adjustedY }}
        >
            {items.map((item, index) => (
                <button
                    key={index}
                    className={`context-menu-item ${item.variant || 'default'}`}
                    onClick={() => {
                        item.onClick();
                        onClose();
                    }}
                >
                    {item.icon && <span className="item-icon">{item.icon}</span>}
                    {item.label}
                </button>
            ))}
        </div>
    );
}
