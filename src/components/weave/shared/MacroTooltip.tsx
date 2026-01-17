/**
 * MacroTooltip - Shows tables in a macro on hover
 */

import type { Table } from '../../../types/weave';
import './MacroTooltip.css';

interface MacroTooltipProps {
    slotId: string;
    tables: Table[];
    onClose: () => void;
}

export function MacroTooltip({ slotId, tables }: MacroTooltipProps) {
    return (
        <div className="macro-tooltip">
            <div className="macro-tooltip-header">
                <span className="macro-tooltip-title">Macro {slotId}</span>
            </div>
            <ul className="macro-tooltip-list">
                {tables.map(table => (
                    <li key={table.id} className="macro-tooltip-item">
                        {table.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
