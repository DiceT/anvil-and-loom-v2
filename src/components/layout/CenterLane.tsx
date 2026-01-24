import React from 'react';
import { X } from 'lucide-react';
import { useTabStore } from '../../stores/useTabStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { TapestryEditor } from '../tapestry/TapestryEditor';
import { WeaveTableEditor } from '../weave/WeaveTableEditor';
import { SessionBar } from '../session-bar/SessionBar';

export function CenterLane() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();
  const { setActiveEntry } = useEditorStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const renderTabContent = () => {
    if (!activeTab) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-type-secondary">No tabs open</div>
        </div>
      );
    }

    switch (activeTab.type) {
      case 'entry':
        return <TapestryEditor />;
      case 'weave':
        return activeTab.weaveTableId ? <WeaveTableEditor tableId={activeTab.weaveTableId} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="bg-canvas h-full flex flex-col">
      {/* Tab Bar - Always show if tabs exist */}
      {tabs.length > 0 && (
        <div className="flex items-center gap-0 bg-canvas-panel border-b border-border px-2 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b-2 ${activeTabId === tab.id
                ? 'border-b-amethyst text-type-primary'
                : 'border-b-transparent text-type-secondary hover:text-type-primary'
                }`}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.type === 'entry') {
                  setActiveEntry(tab.id);
                }
              }}
            >
              <span className="text-sm whitespace-nowrap">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="p-0.5 hover:bg-canvas-surface rounded transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {renderTabContent()}
      </div>

      {/* Session Bar - Always at bottom */}
      <SessionBar />
    </div>
  );
}
