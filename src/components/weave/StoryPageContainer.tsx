import { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, Edit3, Code } from 'lucide-react';
import { StoryPageView } from './StoryPageView';
import { StoryPageEdit } from './StoryPageEdit';
import { StoryPageRawEditor } from './StoryPageRawEditor';
import type { StoryPage } from '../../core/weave/weaveTypes';
import type { Thread } from '../../core/results/types';

type StoryPageMode = 'view' | 'viewEdit' | 'raw';

interface StoryPageContainerProps {
  storyPage: StoryPage | null;
  threads: Thread[];
  onSave: (storyPage: StoryPage) => Promise<void>;
}

/**
 * Container component that manages StoryPage state and auto-save.
 * Displays three modes: view (read-only), viewEdit (inline editing), raw (JSON).
 */
export function StoryPageContainer({
  storyPage: initialStoryPage,
  threads,
  onSave,
}: StoryPageContainerProps) {
  const [mode, setMode] = useState<StoryPageMode>('view');
  const [storyPage, setStoryPage] = useState<StoryPage | null>(initialStoryPage);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  // Create a map of thread IDs to threads for efficient lookup
  const threadsMap = useRef(new Map(threads.map((t) => [t.id, t])));
  useEffect(() => {
    threadsMap.current = new Map(threads.map((t) => [t.id, t]));
  }, [threads]);

  // Auto-save with debounce (300ms)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSave = useCallback(async (pageToSave: StoryPage) => {
    try {
      setIsSaving(true);
      await onSave(pageToSave);
      setLastSaveTime(new Date());
    } catch (error) {
      console.error('Failed to save StoryPage:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const handleUpdate = useCallback(
    (updated: StoryPage) => {
      setStoryPage(updated);

      // Debounce the save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        performSave(updated);
      }, 300);
    },
    [performSave]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Update internal state when initial prop changes
  useEffect(() => {
    if (initialStoryPage) {
      setStoryPage(initialStoryPage);
    }
  }, [initialStoryPage]);

  if (!storyPage) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950">
        <div className="text-slate-500">No story page loaded</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Mode Toggle Buttons */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('view')}
            className={`px-3 py-2 rounded flex items-center gap-2 transition-colors ${
              mode === 'view'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Eye size={16} /> View
          </button>
          <button
            onClick={() => setMode('viewEdit')}
            className={`px-3 py-2 rounded flex items-center gap-2 transition-colors ${
              mode === 'viewEdit'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Edit3 size={16} /> Edit
          </button>
          <button
            onClick={() => setMode('raw')}
            className={`px-3 py-2 rounded flex items-center gap-2 transition-colors ${
              mode === 'raw'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Code size={16} /> Raw
          </button>
        </div>

        {/* Status Indicator */}
        <div className="text-xs text-slate-400">
          {isSaving ? (
            <span>Saving...</span>
          ) : lastSaveTime ? (
            <span>Saved at {lastSaveTime.toLocaleTimeString()}</span>
          ) : (
            <span>Ready</span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'view' && <StoryPageView storyPage={storyPage} threadsMap={threadsMap.current} />}
        {mode === 'viewEdit' && (
          <StoryPageEdit storyPage={storyPage} threadsMap={threadsMap.current} onUpdate={handleUpdate} />
        )}
        {mode === 'raw' && <StoryPageRawEditor storyPage={storyPage} onUpdate={handleUpdate} />}
      </div>
    </div>
  );
}
