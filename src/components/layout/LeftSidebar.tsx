import { useState } from 'react';
import { Plus, Settings, BookImage } from 'lucide-react';
import { useTapestryStore } from '../../stores/useTapestryStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useTabStore } from '../../stores/useTabStore';
import { IconButton } from '../ui/IconButton';
import { Dialog } from '../ui/Dialog';
import { SettingsModal } from '../settings/SettingsModal';

export function LeftSidebar() {
  const { tree, loadTree } = useTapestryStore();
  const { openEntry } = useEditorStore();
  const { openTab } = useTabStore();

  const [showNewPlaceDialog, setShowNewPlaceDialog] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleNewPlace = () => {
    setNewPlaceName('New Place');
    setShowNewPlaceDialog(true);
  };

  const confirmNewPlace = async () => {
    if (!newPlaceName.trim() || !tree) return;

    try {
      const result = await window.electron.tapestry.createEntry(tree.path, newPlaceName.trim(), 'place');
      await loadTree();
      setShowNewPlaceDialog(false);

      if (result?.path) {
        // Load entry to get ID for tab
        const entry = await window.electron.tapestry.loadEntry(result.path);
        if (entry) {
          openTab({
            id: entry.id,
            type: 'entry',
            title: entry.title,
            data: { path: result.path },
          });
          await openEntry(result.path);
        }
      }
    } catch (err) {
      console.error('Failed to create place:', err);
    }
  };

  return (
    <div className="w-12 bg-slate-950 border-r border-slate-800 flex flex-col items-center justify-between py-2">
      {/* Top Toolbar - Creation/Templates */}
      <div className="flex flex-col gap-1">
        <IconButton
          icon={Plus}
          size="m"
          tooltip="New Tool/Panel"
          onClick={() => {
            // New tool/panel creation will be handled here
          }}
        />
        <IconButton
          icon={BookImage}
          size="m"
          tooltip="New Place"
          onClick={handleNewPlace}
        />
      </div>

      {/* Bottom Toolbar */}
      <div className="flex flex-col gap-1">
        <IconButton
          icon={Settings}
          size="m"
          tooltip="Settings"
          onClick={() => setShowSettings(true)}
        />
      </div>

      {/* New Place Dialog */}
      {showNewPlaceDialog && (
        <Dialog
          title="New Place"
          onClose={() => setShowNewPlaceDialog(false)}
          onConfirm={confirmNewPlace}
          confirmText="Create"
          confirmDisabled={!newPlaceName.trim()}
        >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Place Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={newPlaceName}
              onChange={(e) => setNewPlaceName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Place name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newPlaceName.trim()) {
                  confirmNewPlace();
                }
              }}
            />
          </div>
        </Dialog>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialCategory="editor"
      />
    </div>
  );
}
