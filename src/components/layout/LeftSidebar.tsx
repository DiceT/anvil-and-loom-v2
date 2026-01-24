import { useState } from 'react';
import { Plus, Settings, LogOut } from 'lucide-react';
import { useTapestryStore } from '../../stores/useTapestryStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useTabStore } from '../../stores/useTabStore';
import { IconButton } from '../ui/IconButton';
import { Dialog } from '../ui/Dialog';
import { SettingsModal } from '../settings/SettingsModal';
import { TEMPLATES, PanelTemplate } from '../../data/templates';

export function LeftSidebar() {
  const { tree, loadTree, closeTapestry } = useTapestryStore();
  const { openEntry } = useEditorStore();
  const { openTab } = useTabStore();

  const [showDialog, setShowDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PanelTemplate | null>(null);
  const [newName, setNewName] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleNewEntryClick = (template: PanelTemplate) => {
    setSelectedTemplate(template);
    setNewName(template.defaultTitle);
    setShowDialog(true);
  };

  const confirmNewEntry = async () => {
    if (!newName.trim() || !tree || !selectedTemplate) return;

    try {
      // Create generic entry
      const result = await window.electron.tapestry.createEntry(
        tree.path,
        newName.trim(),
        selectedTemplate.type // usually 'entry'
      );

      await loadTree();
      setShowDialog(false);

      if (result?.path) {
        // Load entry to get properties
        const entry = await window.electron.tapestry.loadEntry(result.path);
        if (entry) {
          // TODO: Update frontmatter/tags based on selectedTemplate.subtype here
          // For now, just opening it.

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
      console.error('Failed to create entry:', err);
    }
  };

  return (
    <div className="w-12 bg-canvas-surface border-r border-border flex flex-col items-center justify-between py-2">
      {/* Top Toolbar - Creation/Templates */}
      <div className="flex flex-col gap-1">
        <IconButton
          icon={Plus}
          size="m"
          tooltip="New Blank Panel"
          onClick={() => {
            // Default blank (optional)
          }}
        />
        <div className="h-px w-8 bg-border my-1" /> {/* Divider */}

        {TEMPLATES.map(template => (
          <IconButton
            key={template.id}
            icon={template.icon}
            size="m"
            tooltip={template.label}
            onClick={() => handleNewEntryClick(template)}
          />
        ))}
      </div>

      {/* Bottom Toolbar */}
      <div className="flex flex-col gap-1">
        <IconButton
          icon={Settings}
          size="m"
          tooltip="Settings"
          onClick={() => setShowSettings(true)}
        />
        <IconButton
          icon={LogOut}
          size="m"
          tooltip="Exit Tapestry"
          onClick={() => {
            if (confirm('Are you sure you want to exit to the main menu?')) {
              closeTapestry();
            }
          }}
        />
      </div>

      {/* New Entry Dialog */}
      {showDialog && selectedTemplate && (
        <Dialog
          title={selectedTemplate.label}
          onClose={() => setShowDialog(false)}
          onConfirm={confirmNewEntry}
          confirmText="Create"
          confirmDisabled={!newName.trim()}
        >
          <div>
            <label className="block text-sm font-medium text-type-secondary mb-2">
              Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-border rounded-md text-type-primary focus:outline-none focus:ring-2 focus:ring-ruby"
              placeholder={`${selectedTemplate.subtype} name...`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  confirmNewEntry();
                }
              }}
            />
            <p className="mt-2 text-xs text-type-tertiary">
              {selectedTemplate.description}
            </p>
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
