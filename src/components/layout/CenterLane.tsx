import { X } from 'lucide-react';
import { useTabStore } from '../../stores/useTabStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { WeaveEditor } from '../weave/WeaveEditor';
import { TapestryEditor } from '../tapestry/TapestryEditor';

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
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 h-full flex flex-col">
      {/* Tab Bar */}
      {tabs.length > 0 && (
        <div className="flex items-center gap-1 bg-slate-800 border-b border-slate-700 px-2 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-2 border-r border-slate-700 cursor-pointer transition-colors ${activeTabId === tab.id
                ? 'bg-slate-900 text-slate-200'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
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
                className="p-0.5 hover:bg-slate-700 rounded transition-colors"
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
