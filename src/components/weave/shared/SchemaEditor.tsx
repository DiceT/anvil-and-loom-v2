/**
 * SchemaEditor - JSON schema definition tool for object results
 */

import { useState } from 'react';
import type { TableSchema, SchemaField } from '../../../types/weave';
import './SchemaEditor.css';

interface SchemaEditorProps {
    schema: TableSchema | undefined;
    onSave: (schema: TableSchema | undefined) => void;
}

export function SchemaEditor({ schema, onSave }: SchemaEditorProps) {
    const [editingSchema, setEditingSchema] = useState<TableSchema | null>(null);

    const createNewSchema = () => {
        const newSchema: TableSchema = {
            name: 'New Schema',
            description: '',
            fields: [],
        };
        setEditingSchema(newSchema);
    };

    const editExistingSchema = () => {
        if (schema) {
            setEditingSchema({ ...schema });
        }
    };

    const saveSchema = () => {
        if (!editingSchema) return;
        onSave(editingSchema);
        setEditingSchema(null);
    };

    const deleteSchema = () => {
        onSave(undefined);
        setEditingSchema(null);
    };

    const addField = () => {
        if (!editingSchema) return;
        setEditingSchema({
            ...editingSchema,
            fields: [...editingSchema.fields, { name: '', type: 'string', required: false }],
        });
    };

    const updateField = (index: number, updates: Partial<SchemaField>) => {
        if (!editingSchema) return;
        const newFields = [...editingSchema.fields];
        newFields[index] = { ...newFields[index], ...updates };
        setEditingSchema({ ...editingSchema, fields: newFields });
    };

    const removeField = (index: number) => {
        if (!editingSchema) return;
        setEditingSchema({
            ...editingSchema,
            fields: editingSchema.fields.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="schema-editor">
            <header className="schema-editor-header">
                <h3>Object Schema</h3>
                {!editingSchema && (
                    <>
                        {schema ? (
                            <button className="btn-sm btn-primary" onClick={editExistingSchema}>
                                Edit Schema
                            </button>
                        ) : (
                            <button className="btn-sm btn-primary" onClick={createNewSchema}>
                                New Schema
                            </button>
                        )}
                    </>
                )}
            </header>

            {!editingSchema && (
                <div className="schema-info">
                    {schema ? (
                        <div className="schema-summary">
                            <p><strong>{schema.name}</strong></p>
                            <p className="text-muted">{schema.description || 'No description'}</p>
                            <p className="field-count">{schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''} defined</p>
                        </div>
                    ) : (
                        <p className="text-muted empty-message">No schema defined. Create a schema to define structured object results.</p>
                    )}
                </div>
            )}

            {editingSchema && (
                <div className="schema-form">
                    <div className="form-group">
                        <label>Schema Name</label>
                        <input
                            type="text"
                            value={editingSchema.name}
                            onChange={(e) => setEditingSchema({ ...editingSchema, name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={editingSchema.description}
                            onChange={(e) => setEditingSchema({ ...editingSchema, description: e.target.value })}
                            rows={2}
                        />
                    </div>

                    <div className="fields-section">
                        <div className="fields-header">
                            <label>Fields</label>
                            <button className="btn-sm" onClick={addField}>Add Field</button>
                        </div>

                        {editingSchema.fields.map((field, i) => (
                            <div key={i} className="field-row">
                                <input
                                    type="text"
                                    placeholder="Field name"
                                    value={field.name}
                                    onChange={(e) => updateField(i, { name: e.target.value })}
                                />
                                <select
                                    value={field.type}
                                    onChange={(e) => updateField(i, { type: e.target.value as SchemaField['type'] })}
                                >
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="array">Array</option>
                                    <option value="object">Object</option>
                                </select>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateField(i, { required: e.target.checked })}
                                    />
                                    Required
                                </label>
                                <button className="btn-delete-field" onClick={() => removeField(i)}>×</button>
                            </div>
                        ))}

                        {editingSchema.fields.length === 0 && (
                            <p className="text-muted">No fields defined. Add fields to structure your object results.</p>
                        )}
                    </div>

                    <div className="form-actions">
                        <button className="btn btn-secondary" onClick={() => setEditingSchema(null)}>
                            Cancel
                        </button>
                        <button className="btn btn-delete" onClick={deleteSchema}>
                            Delete Schema
                        </button>
                        <button className="btn btn-primary" onClick={saveSchema}>
                            Save Schema
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
