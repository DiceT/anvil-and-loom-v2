/**
 * CreateTableModal - Modal for creating new Weave tables
 * 
 * Allows users to create new tables with:
 * - Name, description, and category
 * - Initial rows setup (d6, d10, d20, or custom)
 * - Validation for required fields
 */

import React, { useState } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { useWeaveStore } from '../../stores/useWeaveStore';
import { DEFAULT_HEADERS, CURRENT_SCHEMA_VERSION, type Table } from '../../types/weave';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (table: Table) => void;
}

export function CreateTableModal({ isOpen, onClose, onCreate }: CreateTableModalProps) {
  const { createTable, isLoading, error } = useWeaveStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setValidationError('Table name is required');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      // Create table with NO initial rows - user will add rows manually
      const newTable = await createTable(category, {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        tableType: category,
        category,
        name: name.trim(),
        tags,
        description: description.trim(),
        maxRoll: 20, // Default value, will be recalculated on save
        headers: DEFAULT_HEADERS,
        tableData: [], // Empty - no rows initially
      });

      if (onCreate) {
        onCreate(newTable);
      }
      
      // Reset form
      setName('');
      setDescription('');
      setCategory('Uncategorized');
      setTags([]);
      setTagInput('');
      setValidationError('');
      
      onClose();
    } catch (err) {
      console.error('Failed to create table:', err);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setCategory('Uncategorized');
    setTags([]);
    setTagInput('');
    setValidationError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200">Create New Table</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Table Name */}
          <div>
            <label htmlFor="tableName" className="block text-sm font-medium text-slate-300 mb-1">
              Table Name <span className="text-red-400">*</span>
            </label>
            <input
              id="tableName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., NPC Names"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="tableDescription" className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              id="tableDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this table used for?"
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="tableCategory" className="block text-sm font-medium text-slate-300 mb-1">
              Category
            </label>
            <input
              id="tableCategory"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Oracle, Encounter, Location"
              list="categorySuggestions"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              disabled={isLoading}
            />
            <datalist id="categorySuggestions">
              <option value="Oracle" />
              <option value="Encounter" />
              <option value="Location" />
              <option value="NPC" />
              <option value="Item" />
              <option value="Event" />
              <option value="Aspect" />
              <option value="Domain" />
            </datalist>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tableTags" className="block text-sm font-medium text-slate-300 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="tableTags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add a tag and press Enter"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                disabled={isLoading}
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 text-slate-300" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-900/30 border border-purple-700/50 rounded text-xs text-purple-200"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-purple-100 transition-colors"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
              <p className="text-sm text-red-400">{validationError}</p>
            </div>
          )}

          {/* Error from store */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Table
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
