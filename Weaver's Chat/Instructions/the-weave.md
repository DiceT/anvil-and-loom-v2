The Weave – Dev Instructions (for Weaver)
1. Context
Anvil & Loom already has:


Dice Engine (/src/core/dice/diceEngine.ts)


Table Engine (/src/core/tables/*)


Result Card Engine (/src/core/results/resultCardEngine.ts)


Zustand stores for results & tables (/src/stores/useResultsStore.ts, useTableStore.ts)


Tool registry (/src/components/tools/registry.ts) with the Dice Tool as a reference pattern  


The Weave sits on top of those as a meta-oracle: a rollable table that decides which influence (Aspect, Domain, Oracle, Oracle Combo) is in play next. Long term it’s the front door to the whole exploration engine. 
This doc is how to wire it in cleanly.

2. Design Intent (short version)
Think of The Weave as:

A user-authored, rollable table that mixes Aspects, Domains, and Oracles into a single dX. It doesn’t generate prompts directly; it chooses which influence to use next.

Examples:


“Haunted Frontier Weave” might give a higher chance of Haunted + Forest, with occasional “Action+Theme chaos spikes.”


A dungeon Weave might heavily favor “Cursed” + “Catacombs” with the odd Descriptor+Focus result to shake things up.


v1 behavior:


Roll on the Weave.


Determine which row hit.


Emit a Result Card that says:


“Weave: Haunted Frontier (roll 7/10) → Aspect: Haunted”




No auto-chaining into Aspects/Domains yet; that’s future.


Keep it rollable, resolvable, and easy to extend later.

3. Data Model & Storage
3.1 TypeScript types
Create a new module, e.g. /src/core/weave/weaveTypes.ts:
export type WeaveTargetType = 'oracle' | 'oracleCombo' | 'aspect' | 'domain';

export interface WeaveRow {
  id: string;        // local row UUID for UI
  from: number;      // inclusive
  to: number;        // inclusive
  targetType: WeaveTargetType;
  targetId: string;  // ID resolvable by TableRegistry or known oracle IDs
}

export interface Weave {
  id: string;        // slug / filename-safe
  name: string;
  author: string;
  maxRoll: number;   // die size: 10, 20, 100, etc
  rows: WeaveRow[];
  createdAt: string;
  updatedAt: string;
}

Also a simple registry type:
export interface WeaveRegistry {
  weaves: Map<string, Weave>;
}

3.2 JSON file format
Each Weave = one JSON file. Example:
{
  "id": "haunted_frontier",
  "name": "Haunted Frontier",
  "author": "T",
  "maxRoll": 10,
  "rows": [
    { "id": "r1", "from": 1, "to": 3, "targetType": "aspect", "targetId": "Haunted" },
    { "id": "r2", "from": 4, "to": 6, "targetType": "domain", "targetId": "Forest" },
    { "id": "r3", "from": 7, "to": 8, "targetType": "oracleCombo", "targetId": "Action+Theme" },
    { "id": "r4", "from": 9, "to": 10, "targetType": "aspect", "targetId": "Overgrown" }
  ],
  "createdAt": "2025-11-25T20:00:00.000Z",
  "updatedAt": "2025-11-25T20:05:00.000Z"
}

3.3 File locations
Mirror how tables are handled. From the API doc, tables are loaded from core + user dirs via tables:loadAll. 
Do the same for Weaves:


Core/sample Weaves (bundled, read-only)


resources/data/weaves/*.json (or equivalent app bundled path)




User Weaves (read/write)


<userData>/weaves/*.json




User Weaves can share the same id space as core; if a user Weave has the same id as a core Weave, treat it as override.

4. IPC Layer
Follow the pattern in /electron/ipc/tables.ts and /electron/ipc/storage.ts. 
4.1 Main process
Create /electron/ipc/weaves.ts:


Register handlers:


// Pseudocode signatures
weaves:loadAll   // returns all core + user Weaves
weaves:save      // save a single user Weave
weaves:delete    // delete a user Weave

Rough shape:
export function setupWeaveHandlers(): void {
  ipcMain.handle('weaves:loadAll', async () => { ... });
  ipcMain.handle('weaves:save', async (_event, weave: Weave) => { ... });
  ipcMain.handle('weaves:delete', async (_event, id: string) => { ... });
}

Then call setupWeaveHandlers() in electron/main.ts alongside fileSystem/storage/tables. 
Implementation details:


loadAll:


Read core dir (read-only).


Read user dir (create if missing).


Merge into array, user Weaves overriding core by id.




save:


Always write to <userData>/weaves/<id>.json.


Generate directory if not present.




delete:


Only delete from user dir.


If a core Weave exists with same id, it will still show up.




4.2 Preload
In /electron/preload.ts, extend the ElectronAPI type and contextBridge export:
interface ElectronAPI {
  // existing...
  weaves: {
    loadAll: () => Promise<{ success: boolean; data?: Weave[]; error?: string }>;
    save: (weave: Weave) => Promise<{ success: boolean; error?: string }>;
    delete: (id: string) => Promise<{ success: boolean; error?: string }>;
  };
}

Expose via contextBridge.exposeInMainWorld('electron', { ... weaves: { ... } }). 
Renderer usage:
const response = await window.electron.weaves.loadAll();

Same style as tapestry and tables. 

5. Weave Store (Zustand)
Create /src/stores/useWeaveStore.ts.
import { create } from 'zustand';
import type { Weave, WeaveRegistry } from '../core/weave/weaveTypes';

interface WeaveStore {
  registry: WeaveRegistry | null;
  activeWeaveId: string | null;
  isLoading: boolean;
  error: string | null;

  loadWeaves: () => Promise<void>;
  setActiveWeave: (id: string | null) => void;

  createWeave: (partial?: { name?: string; author?: string }) => Weave;
  updateWeave: (weave: Weave) => void;
  saveWeave: (id: string) => Promise<void>;
  deleteWeave: (id: string) => Promise<void>;
}

5.1 Registry & loading


loadWeaves:


Call window.electron.weaves.loadAll().


Build WeaveRegistry (new Map()).


Set registry and clear error.




5.2 Active Weave


activeWeaveId:


Set when:


User opens a Weave to Edit.


You auto-create a Weave from Aspect/Domain “Add to Weave”.




setActiveWeave(null) when closed or deleted.




5.3 Create/update/save/delete


createWeave:


Create new in-memory Weave with:


id = slug of name or generic "weave-<timestamp>".


name default "New Weave".


author from partial or "Unknown".


maxRoll default 10.


rows = empty array or one initial row if called from Aspect/Domain context.




Insert in registry.


Set activeWeaveId to this new id.


Caller is responsible for adding first row and saving.




updateWeave:


Replace in registry map.




saveWeave:


Look up by id.


Call window.electron.weaves.save(weave).


Update updatedAt.




deleteWeave:


Call window.electron.weaves.delete(id).


Remove from map.


If activeWeaveId === id, set to null.





6. Weave Engine (rolling)
Create /src/core/weave/weaveEngine.ts.
Use existing dice engine’s rollDie(sides) for the core roll. 
import { rollDie } from '../dice/diceEngine';
import type { Weave, WeaveRow } from './weaveTypes';

export function rollWeave(weave: Weave): { roll: number; row: WeaveRow } {
  if (!weave.rows.length) {
    throw new Error(`Weave ${weave.id} has no rows`);
  }

  const roll = rollDie(weave.maxRoll);

  const row = weave.rows.find(r => roll >= r.from && roll <= r.to);
  if (!row) {
    throw new Error(`No row matched roll ${roll} in Weave ${weave.id}`);
  }

  return { roll, row };
}

6.1 Range calculation utility
Keep Weaves always rollable by auto-distributing ranges in order.
In /src/core/weave/weaveUtils.ts:
export function recalculateRanges(rows: WeaveRow[], maxRoll: number): WeaveRow[] {
  if (rows.length === 0) return rows;

  const base = Math.floor(maxRoll / rows.length);
  let remainder = maxRoll % rows.length;

  let current = 1;
  return rows.map(row => {
    const span = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;

    const from = current;
    const to = current + span - 1;
    current = to + 1;

    return { ...row, from, to };
  });
}

Call this from the editor whenever:


maxRoll changes


Rows are added/removed


Row order changes (if you support drag/drop later)



7. Result Cards for Weave Rolls
Use existing logResultCard API. 
Create helper in /src/core/weave/weaveResult.ts:
import { logResultCard } from '../results/resultCardEngine';
import type { Weave, WeaveRow } from './weaveTypes';

export function logWeaveResult(weave: Weave, roll: number, row: WeaveRow): void {
  const targetLabel = getRowLabel(row); // see below

  logResultCard({
    header: `Weave: ${weave.name}`,
    result: `${roll}/${weave.maxRoll} → ${targetLabel}`,
    content: [
      `Weave ID: ${weave.id}`,
      `Target Type: ${row.targetType}`,
      `Target ID: ${row.targetId}`
    ].join('\n'),
    source: 'other', // or 'oracle'/'table' if you add new type later
    meta: {
      type: 'weave',
      weaveId: weave.id,
      rowId: row.id,
      roll,
      maxRoll: weave.maxRoll,
      targetType: row.targetType,
      targetId: row.targetId
    }
  });
}

function getRowLabel(row: WeaveRow): string {
  switch (row.targetType) {
    case 'aspect':
      return `Aspect: ${row.targetId}`;
    case 'domain':
      return `Domain: ${row.targetId}`;
    case 'oracle':
      return `Oracle: ${row.targetId}`;
    case 'oracleCombo':
      return `Oracle Combo: ${row.targetId}`;
    default:
      return row.targetId;
  }
}

v1: This is as far as we go. Future versions can:


Look up the actual Aspect/Domain/Oracle names from TableRegistry.


Auto-roll into those tables.



8. Weave Tool UI (right pane)
8.1 Tool registration
In /src/components/tools/registry.ts, add:
import { InfinityIcon } from 'lucide-react'; // or whatever icon you picked
import { WeaveTool } from './weave/WeaveTool';

export const tools: ToolConfig[] = [
  // existing Dice tool...
  {
    id: 'weave',
    name: 'The Weave',
    icon: InfinityIcon,
    component: WeaveTool,
  },
];

Matches existing ToolConfig structure. 
8.2 <WeaveTool /> component
Location: /src/components/tools/weave/WeaveTool.tsx.
Responsibilities:


Load Weaves (useWeaveStore.loadWeaves()).


Show list:


Name


Die size badge (d<maxRoll>)


Roll button




Top-right: + New Weave button.


Right-click (or more-menu) per Weave:


Open / Edit


Delete... (user Weaves only)




Pseudocode:
export function WeaveTool() {
  const { registry, loadWeaves, setActiveWeave, deleteWeave } = useWeaveStore();
  const [contextMenuTarget, setContextMenuTarget] = useState<string | null>(null);

  useEffect(() => { loadWeaves(); }, [loadWeaves]);

  const weaves = Array.from(registry?.weaves.values() ?? []);

  return (
    <div className="flex flex-col h-full">
      {/* header + New Weave */}

      {/* list of weaves */}
      {weaves.map(w => (
        <WeaveListItem
          key={w.id}
          weave={w}
          onRoll={() => handleRollWeave(w)}
          onOpen={() => openWeaveEditor(w.id)}
          onDelete={() => confirmAndDeleteWeave(w.id)}
        />
      ))}
    </div>
  );
}

Rolling from here:
async function handleRollWeave(weave: Weave) {
  const { roll, row } = rollWeave(weave);
  logWeaveResult(weave, roll, row);
}


9. Weave Editor (center pane)
9.1 Location & integration
Location: /src/components/weave/WeaveEditor.tsx.
You’re already doing a “open in main tab” pattern for entries; mirror that:


When user:


Clicks + New Weave in Weave Tool


Or selects Open / Edit from context menu




Create/open a tab for <WeaveEditor weaveId="..." />.


9.2 Layout
Fields:


Name (input)


Author (input)


Die Size / Max Roll (dropdown or numeric with guardrail)


Buttons:


Roll (primary)


Save


Close (or rely on tab close)




Grid:


Columns: From | To | Type | Target | (last-row controls)


Rows: weave.rows from store.


Behavior:


From/To are read-only (calculated).


Type is select: [Aspect, Domain, Oracle, Oracle Combo].


Target is dropdown based on Type:


Aspect → list of Aspects from TableRegistry.


Domain → list of Domains.


Oracle → Action, Theme, Descriptor, Focus, etc.


Oracle Combo → fixed: Action+Theme, Descriptor+Focus.




Row controls:


+ Add Row only visible on last row.


Remove Row only visible on last row and only if rows.length > 1.


When rows or maxRoll change:


Call recalculateRanges(rows, maxRoll) and push result back via updateWeave.


On Roll:


Use current in-memory Weave, call rollWeave + logWeaveResult.


On Save:


Validate:


rows.length >= 1


maxRoll >= rows.length




If OK: call saveWeave(id).



10. Aspect/Domain “Add to Weave” integration
In your Aspects/Environments UI (where you already show “Add to Weave” / Infinity icon next to Aspect/Domain names):
When button clicked:
const { registry, activeWeaveId, createWeave, updateWeave, setActiveWeave } = useWeaveStore.getState();

function handleAddAspectToWeave(aspectId: string) {
  let weave = activeWeaveId ? registry?.weaves.get(activeWeaveId) ?? null : null;

  if (!weave) {
    weave = createWeave({ name: `${aspectId} Weave` });
  }

  const newRow: WeaveRow = {
    id: generateRowId(),
    from: 0,
    to: 0,
    targetType: 'aspect',
    targetId: aspectId,
  };

  const updatedRows = recalculateRanges([...weave.rows, newRow], weave.maxRoll);

  const updatedWeave: Weave = { ...weave, rows: updatedRows };
  updateWeave(updatedWeave);
  setActiveWeave(updatedWeave.id);
}

Same idea for Domains, just switch targetType: 'domain'.
UX-wise:


If there was no active Weave, auto-open the new Weave editor tab.


If there is one, just update it; user can open the editor later.



11. Validation & Edge Cases


Empty Weave:


Don’t allow Roll if rows.length === 0; show a small inline error.




Broken ranges:


Shouldn’t happen if you always use recalculateRanges.




Unknown targets:


Ok in v1; we’re just logging the IDs.


In future, when resolving against TableRegistry, treat missing IDs as a soft error and show a warning in the Result Card content.




Deleting a Weave that’s active:


Clear activeWeaveId if it matches.





12. How this ties to the Feature Backlog
This Weave implementation is the spine for:


AI & Oracles / Local oracle & table roller (P0) – Weave becomes the “what do we roll on next?” switch. 


Future Play Mode / Session Entry – Every “environment tick” in play would be a Weave roll, feeding Result Cards into the active Session Entry. 


Eventually, Connection Web & Reverberation – Weave results are natural hooks for named nodes and queued echoes.


So keep the implementation clean and boring: TS types, IPC, store, tool, editor, roll → Result Card. The clever stuff comes later.

13. Checklist for Weaver
You can literally check these off:


Types & Core


 Add weaveTypes.ts (Weave, WeaveRow, WeaveRegistry).


 Add weaveEngine.ts with rollWeave.


 Add weaveUtils.ts with recalculateRanges.


 Add weaveResult.ts with logWeaveResult.




IPC & Storage


 Implement /electron/ipc/weaves.ts with weaves:loadAll/save/delete.


 Wire setupWeaveHandlers() into main.ts.


 Extend ElectronAPI in preload.ts and expose window.electron.weaves.




State


 Create useWeaveStore.ts with full API.


 Ensure it handles activeWeaveId and registry updates.




UI


 Register Weave tool in tools/registry.ts with Infinity icon.


 Implement WeaveTool.tsx (list + New + Roll + context menu).


 Implement WeaveEditor.tsx (fields, grid, Roll, Save).


 Confirm ranges auto-update and From/To never overlap or leave gaps.




Aspect/Domain integration


 Wire “Add to Weave” buttons to useWeaveStore:


Create new Weave if none active.


Append row + recalc ranges.


Set active Weave & optionally open editor.






Result Cards


 Confirm rolling a Weave creates a Result Card via logWeaveResult.


 Confirm Last Result dock and All Results pane show it correctly (same pipeline as Dice). 




Once this is in, T can finally roll “Haunted Frontier” instead of juggling Aspects and Domains manually, and the rest of the engine can grow around that.
