/**
 * CreateTableModal - Modal for creating a new table
 */

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Table } from '../../../types/weave';
import './CreateTableModal.css';

// Constants that match the-weave
const CURRENT_SCHEMA_VERSION = 1;
const DEFAULT_HEADERS = ['Roll', 'Result'];

interface CreateTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (table: Table) => void;
}

export function CreateTableModal({ isOpen, onClose, onSubmit }: CreateTableModalProps) {
    const [name, setName] = useState('');
    const [tags, setTags] = useState('');
    const [description, setDescription] = useState('');
    const [maxRoll, setMaxRoll] = useState(100);
    const [category, setCategory] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newTable: Table = {
            id: uuidv4(),
            schemaVersion: CURRENT_SCHEMA_VERSION,
            sourcePath: `data/tables/${name.toLowerCase().replace(/\s+/g, '_')}.json`,
            name: name.trim(),
            tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
            description: description.trim(),
            maxRoll,
            headers: DEFAULT_HEADERS,
            category: category.trim() || undefined,
            tableData: [],
        };

        onSubmit(newTable);

        // Reset form
        setName('');
        setTags('');
        setDescription('');
        setMaxRoll(100);
        setCategory('');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h2>Create New Table</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </header>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label htmlFor="name">Table Name *</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Treasure Hoard"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="tags">Tags (comma-separated)</label>
                        <input
                            id="tags"
                            type="text"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            placeholder="e.g., loot, treasure, gold"
                        />
                        <span className="form-hint">Used for [[ TAG ]] references</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <input
                            id="category"
                            type="text"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            placeholder="e.g., Treasure, Encounters"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="maxRoll">Max Roll</label>
                        <select
                            id="maxRoll"
                            value={maxRoll}
                            onChange={e => setMaxRoll(Number(e.target.value))}
                        >
                            <option value={6}>d6</option>
                            <option value={8}>d8</option>
                            <option value={10}>d10</option>
                            <option value={12}>d12</option>
                            <option value={20}>d20</option>
                            <option value={66}>d66</option>
                            <option value={88}>d88</option>
                            <option value={100}>d100</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe what this table is for..."
                            rows={3}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
                            Create Table
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
