/**
 * WeavePanel - Container component for Weave UI in right pane
 *
 * Displays WeaveFileTree which includes the MacroBar, presets, search, and table list.
 * Matches the-weave's left sidebar layout exactly.
 */

import { WeaveFileTree } from './WeaveFileTree';

export function WeavePanel() {
  return (
    <div className="flex flex-col h-full">
      <WeaveFileTree />
    </div>
  );
}
