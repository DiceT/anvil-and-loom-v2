import { useState } from 'react';
import { Search, Tag } from 'lucide-react';
import { useTagStore } from '../../stores/useTagStore';
import { useTapestryStore } from '../../stores/useTapestryStore';
import { useLeftPaneStore } from '../../stores/useLeftPaneStore';

export function TagsPane() {
  const [searchQuery, setSearchQuery] = useState('');
  const { getAllTags, getTagUsage } = useTagStore();
  const { setTagFilter } = useTapestryStore();
  const { setLeftPaneMode } = useLeftPaneStore();

  const allTags = getAllTags();
  const filteredTags = searchQuery
    ? allTags.filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    : allTags;

  // Sort by usage (descending), then alphabetically
  const sortedTags = [...filteredTags].sort((a, b) => {
    const usageA = getTagUsage(a);
    const usageB = getTagUsage(b);
    if (usageA !== usageB) {
      return usageB - usageA;
    }
    return a.localeCompare(b);
  });

  const handleTagClick = (tag: string) => {
    setTagFilter(tag);
    setLeftPaneMode('tapestry');
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center gap-2 bg-slate-800 rounded px-2 py-1 border border-slate-700 focus-within:border-purple-500 transition-colors">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1"
            autoFocus
          />
        </div>
      </div>

      {/* Tags List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedTags.length === 0 ? (
          <div className="text-slate-400 text-sm p-4 text-center">
            {searchQuery ? 'No matching tags' : 'No tags yet'}
          </div>
        ) : (
          <div className="space-y-1">
            {sortedTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-slate-500 group-hover:text-purple-400 transition-colors" />
                  <span className="text-sm">#{tag}</span>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-400">
                  {getTagUsage(tag)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
