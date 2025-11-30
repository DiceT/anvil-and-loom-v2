import { TapestryTree } from '../tapestry/TapestryTree';
import { TagsPane } from './TagsPane';
import { BookmarksPane } from './BookmarksPane';
import { useLeftPaneStore } from '../../stores/useLeftPaneStore';

export function LeftLane() {
  const { leftPaneMode } = useLeftPaneStore();

  const renderContent = () => {
    switch (leftPaneMode) {
      case 'tapestry':
        return <TapestryTree />;
      case 'tags':
        return <TagsPane />;
      case 'bookmarks':
        return <BookmarksPane />;
      default:
        return <TapestryTree />;
    }
  };

  return (
    <div className="h-full bg-slate-900 border-r border-slate-800 overflow-hidden">
      {renderContent()}
    </div>
  );
}
