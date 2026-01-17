/**
 * QuickImportModal - Import rows from a pasted list
 */

import { useState } from 'react';
import type { TableRow } from '../../../types/weave';
import './QuickImportModal.css';

interface QuickImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (rows: TableRow[]) => void;
}

/**
 * Parse a text list into table rows.
 * Handles various list formats:
 * - Numbered: "1. Item" or "1) Item" or "1: Item"
 * - Bulleted: "- Item" or "• Item" or "* Item"
 * - Plain: just lines of text
 */
function parseList(text: string): string[] {
    const lines = text.split('\n');
    const results: string[] = [];

    for (const line of lines) {
        // Trim whitespace
        let cleaned = line.trim();

        // Skip empty lines
        if (!cleaned) continue;

        // Remove common list prefixes
        // Numbered: "1.", "1)", "1:", "01.", etc.
        cleaned = cleaned.replace(/^\d+[\.\)\:]\s*/, '');
        // Bulleted: "-", "•", "*", ">"
        cleaned = cleaned.replace(/^[-•\*\>]\s*/, '');
        // Bracketed numbers: "[1]", "(1)"
        cleaned = cleaned.replace(/^[\[\(]\d+[\]\)]\s*/, '');

        // Skip if nothing left after stripping
        if (!cleaned) continue;

        results.push(cleaned);
    }

    return results;
}

export function QuickImportModal({ isOpen, onClose, onImport }: QuickImportModalProps) {
    const [text, setText] = useState('');
    const [preview, setPreview] = useState<string[]>([]);

    const handleTextChange = (value: string) => {
        setText(value);
        setPreview(parseList(value));
    };

    const handleImport = () => {
        const parsed = parseList(text);
        const rows: TableRow[] = parsed.map((result, index) => ({
            id: crypto.randomUUID(),
            floor: index + 1,
            ceiling: index + 1,
            weight: 1,
            resultType: 'text' as const,
            result,
        }));

        onImport(rows);
        setText('');
        setPreview([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="quick-import-modal" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h2>Quick Import</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </header>

                <div className="modal-body">
                    <p className="import-instructions">
                        Paste or type entries, one per line. Numbers and bullets are removed automatically.
                    </p>

                    <textarea
                        className="import-textarea"
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        placeholder={`1. First entry
2. Second entry
3. Third entry
...or just plain lines`}
                        rows={10}
                    />

                    {preview.length > 0 && (
                        <div className="import-preview">
                            <h4>Preview ({preview.length} rows)</h4>
                            <ul>
                                {preview.slice(0, 8).map((item, i) => (
                                    <li key={i}>
                                        <span className="preview-num">{i + 1}.</span>
                                        {item}
                                    </li>
                                ))}
                                {preview.length > 8 && (
                                    <li className="preview-more">...and {preview.length - 8} more</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleImport}
                        disabled={preview.length === 0}
                    >
                        Import {preview.length} Rows
                    </button>
                </div>
            </div>
        </div>
    );
}
