import { useEffect, useState } from 'react';
import { Plus, Dices, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useWeaveStore } from '../../../stores/useWeaveStore';
import { useTabStore } from '../../../stores/useTabStore';
import { rollWeave } from '../../../core/weave/weaveEngine';
import { logWeaveResult } from '../../../core/weave/weaveResult';
import type { Weave } from '../../../core/weave/weaveTypes';

export function WeaveTool() {
  const { registry, loadWeaves, createWeave, deleteWeave } = useWeaveStore();
  const openTab = useTabStore((state) => state.openTab);
  const [contextMenuTarget, setContextMenuTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!registry) {
      loadWeaves();
    }
  }, [registry, loadWeaves]);

  const weaves = Array.from(registry?.weaves.values() ?? []).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const handleRollWeave = async (weave: Weave) => {
    try {
      const { roll, row } = await rollWeave(weave);
      logWeaveResult(weave, roll, row);
    } catch (error) {
      console.error('Failed to roll weave:', error);
    }
  };

  const handleNewWeave = () => {
    const newWeave = createWeave({ name: 'New Weave', author: 'T' });
    openTab({
      id: newWeave.id,
      type: 'weave',
      title: newWeave.name,
    });
  };

  const handleOpenWeave = (weaveId: string) => {
    const weave = registry?.weaves.get(weaveId);
    if (weave) {
      openTab({
        id: weave.id,
        type: 'weave',
        title: weave.name,
      });
    }
  };

  const handleDeleteWeave = async (weaveId: string) => {
    if (confirm('Are you sure you want to delete this Weave?')) {
      try {
        await deleteWeave(weaveId);
      } catch (error) {
        console.error('Failed to delete weave:', error);
        alert('Failed to delete weave');
      }
    }
    setContextMenuTarget(null);
  };

  if (!registry) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-slate-500">Loading weaves...</div>
      </div>
    );
  }

  return (
    <div className="px-2 pt-2 pb-2 h-full overflow-y-auto app-scroll">
      {/* Header with New Button */}
      <div className="flex justify-between items-center mb-3 px-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          The Weave
        </h3>
        <button
          onClick={handleNewWeave}
          className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          <Plus className="w-3 h-3 text-slate-300" />
          <span className="text-xs text-slate-300">New</span>
        </button>
      </div>

      {/* Weave List */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        {weaves.length === 0 ? (
          <div className="p-4 text-sm text-slate-500 text-center">
            No weaves found. Create one to get started!
          </div>
        ) : (
          weaves.map((weave) => (
            <div
              key={weave.id}
              className="flex items-center justify-between py-2 px-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-slate-300">{weave.name}</span>
                <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-900 rounded">
                  d{weave.maxRoll}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRollWeave(weave)}
                  className="p-1 hover:bg-slate-600 rounded transition-colors"
                  data-tooltip={`Roll ${weave.name}`}
                >
                  <Dices className="w-4 h-4 text-slate-400" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setContextMenuTarget(contextMenuTarget === weave.id ? null : weave.id)}
                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>

                  {contextMenuTarget === weave.id && (
                    <div className="absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded shadow-lg z-10 min-w-[120px]">
                      <button
                        onClick={() => {
                          handleOpenWeave(weave.id);
                          setContextMenuTarget(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 transition-colors text-left"
                      >
                        <Edit className="w-3 h-3 text-slate-400" />
                        <span className="text-sm text-slate-300">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteWeave(weave.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 transition-colors text-left"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span className="text-sm text-red-400">Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
