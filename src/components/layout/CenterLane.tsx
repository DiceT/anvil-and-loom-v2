import { X } from 'lucide-react';
import { useTabStore } from '../../stores/useTabStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { WeaveEditor } from '../weave/WeaveEditor';
import { TapestryEditor } from '../tapestry/TapestryEditor';
import { TableForgePanel } from '../tableforge/TableForgePanel';

export function CenterLane() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();
  const { setActiveEntry } = useEditorStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const renderTabContent = () => {
    if (!activeTab) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400">No tabs open</div>
        </div>
      );
    }

    switch (activeTab.type) {
      case 'weave':
        return <WeaveEditor weaveId={activeTab.id} />;
      case 'entry':
        return <TapestryEditor />;
      case 'tableforge':
        return <TableForgePanel />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-950 h-full flex flex-col">
      {/* Tab Bar - Only show if multiple tabs */}
      {tabs.length > 1 && (
        <div className="flex items-center gap-0 bg-slate-950 border-b border-slate-800 px-2 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b-2 ${
                activeTabId === tab.id
                  ? 'border-b-purple-500 text-slate-200'
                  : 'border-b-transparent text-slate-400 hover:text-slate-200'
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
                className="p-0.5 hover:bg-slate-700 rounded transition-colors ml-1"
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
    </div>
  );
}
