import { useMemo, useState } from 'react';
import type { ForgeTable } from '../../core/tables/tableForge';
import { createEmptyAspectTables, createEmptyDomainTables, createEmptyOracleTable, buildForgeFile } from '../../core/tables/tableForge';
import { fillTablesWithAI, fillTableWithAI } from '../../core/tables/aiTableFiller';
import { useAiStore } from '../../stores/useAiStore';

type ForgeType = 'Aspect' | 'Domain' | 'Oracle';

export function TableForgePanel() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState<ForgeType>('Aspect');
  const [tables, setTables] = useState<ForgeTable[] | null>(null);
  const [selected, setSelected] = useState<string>('Objectives');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFilling, setIsFilling] = useState(false);
  const [showTableViewer, setShowTableViewer] = useState(false);

  const { settings, getEffectivePersona } = useAiStore();
  const model = settings.model;
  const apiKey = settings.apiKey;
  const activePersonaId = settings.activePersonaId;

  const tableNames = useMemo(() => {
    if (type === 'Oracle') return [name || 'Oracle'];
    return type === 'Aspect'
      ? ['Objectives', 'Atmosphere', 'Manifestations', 'Discoveries', 'Banes', 'Boons']
      : ['Objectives', 'Atmosphere', 'Locations', 'Discoveries', 'Banes', 'Boons'];
  }, [type, name]);

  const generate = () => {
    setError(null);
    setStatus(null);
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    if (!trimmedName) {
      setError('Enter a Name before generating.');
      return;
    }
    const customTags = tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    let next;
    if (type === 'Oracle') {
      next = createEmptyOracleTable(trimmedName, trimmedDesc, customTags);
    } else {
      next = type === 'Aspect'
        ? createEmptyAspectTables(trimmedName, trimmedDesc, customTags)
        : createEmptyDomainTables(trimmedName, trimmedDesc, customTags);
    }
    setTables(next);
    setSelected(tableNames[0]);
    setStatus('Generated empty tables.');
  };

  const currentTable = useMemo(() => {
    if (!tables) return null;
    return tables.find((t) => t.name === selected) ?? tables[0] ?? null;
  }, [tables, selected]);

  const jsonPreview = useMemo(() => {
    if (!currentTable) return '';
    return JSON.stringify(currentTable, null, 2);
  }, [currentTable]);

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Table Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-4 py-2 rounded transition-colors ${type === 'Aspect'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                onClick={() => setType('Aspect')}
              >
                Aspect
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded transition-colors ${type === 'Domain'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                onClick={() => setType('Domain')}
              >
                Domain
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded transition-colors ${type === 'Oracle'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                onClick={() => setType('Oracle')}
              >
                Oracle
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Haunted, Overgrown, Forest"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="2–3 sentence descriptor"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., dark, supernatural, wilderness"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
              onClick={generate}
            >
              Generate Empty Tables
            </button>
            <button
              type="button"
              disabled={!currentTable}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 transition-colors"
              onClick={() => currentTable && navigator.clipboard?.writeText(jsonPreview)}
            >
              Copy JSON
            </button>
            <button
              type="button"
              disabled={!tables}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 transition-colors"
              onClick={async () => {
                if (!tables) return;
                try {
                  setStatus('Saving...');
                  setError(null);

                  // Use buildForgeFile to format data correctly based on category
                  // (Oracle tables export as plain array, Aspect/Domain with wrapper)
                  const payload = buildForgeFile(
                    type as 'Aspect' | 'Domain' | 'Oracle',
                    name.trim(),
                    description.trim(),
                    tables
                  );

                  const result = await window.electron.tables.saveForgeFile(
                    type,
                    name.trim().toLowerCase().replace(/\s+/g, '-'),
                    payload
                  );

                  if (result.success) {
                    setStatus(`Saved to ${result.path}`);
                  } else if (result.error === 'Save cancelled') {
                    setStatus(null); // User cancelled, don't show error
                  } else {
                    setError(result.error || 'Failed to save');
                    setStatus(null);
                  }
                } catch (e: any) {
                  setError(e?.message || 'Failed to save');
                  setStatus(null);
                }
              }}
            >
              Save to File
            </button>
            <button
              type="button"
              disabled={!currentTable}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 transition-colors"
              onClick={() => setShowTableViewer(true)}
            >
              View Table
            </button>
          </div>

          {tables && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Preview</label>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {tableNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <pre className="p-4 bg-slate-900 border border-slate-700 rounded text-xs overflow-auto max-h-64 text-slate-300">
                  {jsonPreview}
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!tables || isFilling || !model || !apiKey}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 transition-colors"
                  onClick={async () => {
                    try {
                      setError(null);
                      setStatus(null);

                      if (!model || !apiKey) {
                        setError('Please configure AI settings first.');
                        return;
                      }

                      if (!tables || !currentTable) return;

                      setIsFilling(true);
                      const persona = getEffectivePersona(activePersonaId);
                      setStatus(`${persona.name} is filling the table…`);

                      const tag = (currentTable.oracle_type || currentTable.name || '').toLowerCase();
                      const kind = tag.includes('objective')
                        ? 'objectives'
                        : tag.includes('atmosphere')
                          ? 'atmosphere'
                          : tag.includes('manifestation')
                            ? 'manifestations'
                            : tag.includes('location')
                              ? 'locations'
                              : tag.includes('discover')
                                ? 'discoveries'
                                : tag.includes('bane')
                                  ? 'banes'
                                  : 'boons';

                      const updated = await fillTableWithAI(currentTable, kind as any, {
                        name: name.trim(),
                        type: type === 'Aspect' ? 'aspect' : type === 'Domain' ? 'domain' : 'oracle',
                        description: description.trim(),
                        genre: 'dark-fantasy',
                        model,
                        uri: settings.uri,
                        apiKey,
                        personaInstructions: persona.instructions,
                      });

                      const next = tables.map((t) => (t.name === currentTable.name ? updated : t));
                      setTables(next);
                      setStatus('Table filled.');
                    } catch (e: any) {
                      setError(e?.message ?? 'AI generation failed');
                      setStatus(null);
                    } finally {
                      setIsFilling(false);
                    }
                  }}
                >
                  {isFilling ? 'Filling…' : 'Fill this table with AI'}
                </button>

                <button
                  type="button"
                  disabled={!tables || isFilling || !model || !apiKey}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 transition-colors"
                  onClick={async () => {
                    try {
                      setError(null);
                      setStatus(null);

                      if (!model || !apiKey) {
                        setError('Please configure AI settings first.');
                        return;
                      }

                      if (!tables) return;

                      setIsFilling(true);
                      const persona = getEffectivePersona(activePersonaId);
                      setStatus(`${persona.name} is filling the tables…`);

                      const filled = await fillTablesWithAI(tables, {
                        name: name.trim(),
                        type: type === 'Aspect' ? 'aspect' : type === 'Domain' ? 'domain' : 'oracle',
                        description: description.trim(),
                        genre: 'dark-fantasy',
                        model,
                        uri: settings.uri,
                        apiKey,
                        personaInstructions: persona.instructions,
                      });

                      setTables(filled);
                      setStatus('Tables filled.');
                    } catch (e: any) {
                      setError(e?.message ?? 'AI generation failed');
                      setStatus(null);
                    } finally {
                      setIsFilling(false);
                    }
                  }}
                >
                  {isFilling ? 'Filling…' : 'Fill all tables with AI'}
                </button>
              </div>
            </div>
          )}

          {status && <div className="p-3 bg-blue-900 text-blue-200 rounded text-sm">{status}</div>}
          {error && <div className="p-3 bg-red-900 text-red-200 rounded text-sm">{error}</div>}
        </div>
      </div>

      {/* Table Viewer Modal */}
      {showTableViewer && currentTable && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowTableViewer(false)}>
          <div className="bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-slate-200">{currentTable.name}</h2>
              <button
                onClick={() => setShowTableViewer(false)}
                className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-2 text-slate-300 font-medium">Floor</th>
                    <th className="text-left p-2 text-slate-300 font-medium">Ceiling</th>
                    <th className="text-left p-2 text-slate-300 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTable.tableData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="p-2 text-slate-400">{row.floor}</td>
                      <td className="p-2 text-slate-400">{row.ceiling}</td>
                      <td className="p-2 text-slate-200">{row.result || <span className="text-slate-600 italic">empty</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
