import { useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ThreadCard } from '../results/ThreadCard';
import type { StoryPage, StoryBlock } from '../../core/weave/weaveTypes';
import type { Thread } from '../../core/results/types';
import { v4 as uuidv4 } from 'uuid';

interface StoryPageEditProps {
  storyPage: StoryPage;
  threadsMap: Map<string, Thread>;
  onUpdate: (updated: StoryPage) => void;
}

export function StoryPageEdit({ storyPage, threadsMap, onUpdate }: StoryPageEditProps) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const handleUpdateTextBlock = useCallback((blockId: string, markdown: string) => {
    const updated = {
      ...storyPage,
      blocks: storyPage.blocks.map((block) =>
        block.id === blockId && block.kind === 'text'
          ? { ...block, markdown }
          : block
      ),
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
  }, [storyPage, onUpdate]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    const updated = {
      ...storyPage,
      blocks: storyPage.blocks.filter((block) => block.id !== blockId),
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
  }, [storyPage, onUpdate]);

  const handleAddTextBlock = useCallback((afterBlockId?: string) => {
    const newBlock: StoryBlock = {
      id: uuidv4(),
      kind: 'text',
      markdown: '',
    };

    let newBlocks: StoryBlock[];
    if (afterBlockId) {
      const index = storyPage.blocks.findIndex((b) => b.id === afterBlockId);
      newBlocks = [
        ...storyPage.blocks.slice(0, index + 1),
        newBlock,
        ...storyPage.blocks.slice(index + 1),
      ];
    } else {
      newBlocks = [...storyPage.blocks, newBlock];
    }

    const updated = {
      ...storyPage,
      blocks: newBlocks,
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    setEditingBlockId(newBlock.id);
  }, [storyPage, onUpdate]);

  const renderBlock = (block: StoryBlock) => {
    if (block.kind === 'text') {
      const isEditing = editingBlockId === block.id;

      return (
        <div key={block.id} className="group my-4">
          {isEditing ? (
            <div className="flex gap-2">
              <textarea
                value={block.markdown}
                onChange={(e) => handleUpdateTextBlock(block.id, e.target.value)}
                onBlur={() => setEditingBlockId(null)}
                autoFocus
                className="flex-1 p-3 bg-slate-800 border border-purple-500 rounded text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Enter markdown text..."
                rows={6}
              />
              <button
                onClick={() => handleDeleteBlock(block.id)}
                className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded transition-colors"
                title="Delete text block"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setEditingBlockId(block.id)}
              className="p-3 bg-slate-800/50 border border-slate-700 rounded cursor-pointer hover:bg-slate-800 transition-colors group"
            >
              <p className="text-slate-300 whitespace-pre-wrap break-words">
                {block.markdown || <span className="text-slate-500 italic">Click to add text...</span>}
              </p>
            </div>
          )}

          {/* "Add text block" button between blocks */}
          <div className="flex justify-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleAddTextBlock(block.id)}
              className="px-3 py-1 bg-purple-600/40 hover:bg-purple-600 text-purple-200 rounded text-sm flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> Add text
            </button>
          </div>
        </div>
      );
    } else if (block.kind === 'thread') {
      const thread = threadsMap.get(block.threadId);
      if (!thread) {
        return (
          <div key={block.id} className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-300 my-4">
            Thread not found: {block.threadId}
            <button
              onClick={() => handleDeleteBlock(block.id)}
              className="ml-2 px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-xs"
            >
              Remove
            </button>
          </div>
        );
      }

      return (
        <div key={block.id} className="group my-6 relative">
          <ThreadCard card={thread} defaultExpanded={false} />
          <button
            onClick={() => handleDeleteBlock(block.id)}
            className="absolute top-2 right-2 p-2 bg-red-900/0 hover:bg-red-900/50 text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove thread from story"
          >
            <Trash2 size={16} />
          </button>

          {/* "Add text block" button between blocks */}
          <div className="flex justify-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleAddTextBlock(block.id)}
              className="px-3 py-1 bg-purple-600/40 hover:bg-purple-600 text-purple-200 rounded text-sm flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> Add text
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-full overflow-auto bg-slate-950">
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">{storyPage.title}</h1>
        <p className="text-slate-400 text-sm mb-8">Click text blocks to edit. Click + to add new text.</p>

        <div className="space-y-0">
          {storyPage.blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-slate-400 mb-4">No story blocks yet</p>
              <button
                onClick={() => handleAddTextBlock()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded flex items-center gap-2 transition-colors"
              >
                <Plus size={18} /> Add first text block
              </button>
            </div>
          ) : (
            storyPage.blocks.map(renderBlock)
          )}
        </div>

        {/* Final "Add text block" button at bottom */}
        {storyPage.blocks.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => handleAddTextBlock()}
              className="px-4 py-2 bg-purple-600/40 hover:bg-purple-600 text-purple-200 rounded flex items-center gap-2 transition-colors"
            >
              <Plus size={16} /> Add text block
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
