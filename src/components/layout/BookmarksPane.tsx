import { Bookmark } from 'lucide-react';

export function BookmarksPane() {
  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center gap-2">
        <Bookmark className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-slate-300">Bookmarks</span>
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-slate-400 text-sm p-4 text-center">
          No bookmarks yet
        </div>
      </div>
    </div>
  );
}
