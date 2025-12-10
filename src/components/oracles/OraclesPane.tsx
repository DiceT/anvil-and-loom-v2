import { useEffect, useState } from 'react';
import { Dices, ChevronRight, ChevronDown } from 'lucide-react';
import { useTableStore } from '../../stores/useTableStore';
import { OracleTableMetadata } from '../../core/tables/types';
import { rollOnTable } from '../../core/tables/tableEngine';
import { resolveActionTheme, resolveDescriptorFocus } from '../../core/tables/macroResolver';
import { formatComboOracleThread, formatTableRollThread } from '../../core/tables/threadFormatter';

export function OraclesPane() {
  const { registry, loadTables } = useTableStore();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['core', 'more']));

  useEffect(() => {
    if (!registry) {
      loadTables();
    }
  }, [registry, loadTables]);

  if (!registry) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-slate-500">Loading oracles...</div>
      </div>
    );
  }

  const handleComboOracle = async (type: 'action-theme' | 'descriptor-focus') => {
    if (type === 'action-theme') {
      const result = await resolveActionTheme(registry);
      if (result) {
        formatComboOracleThread(result, 'Action + Theme', registry);
      }
    } else {
      const result = await resolveDescriptorFocus(registry);
      if (result) {
        formatComboOracleThread(result, 'Descriptor + Focus', registry);
      }
    }
  };

  const handleRollOracle = async (oracle: OracleTableMetadata) => {
    const result = await rollOnTable(oracle.table);
    formatTableRollThread(result, 'ORACLE');
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Separate core and more oracles (both core and user sources)
  const coreOracles = Array.from(registry.oracles.values())
    .filter((o) => o.subCategory === 'core')
    .sort((a, b) => a.table.name.localeCompare(b.table.name));

  const moreOracles = Array.from(registry.oracles.values())
    .filter((o) => o.subCategory === 'more')
    .sort((a, b) => a.table.name.localeCompare(b.table.name));

  const renderOracleList = (oracles: OracleTableMetadata[]) => {
    if (oracles.length === 0) {
      return (
        <div className="p-4 text-sm text-slate-500 text-center">No oracles found</div>
      );
    }

    return oracles.map((oracle) => (
      <div
        key={oracle.table.id}
        className="flex items-center justify-between py-2 px-3 hover:bg-slate-800 transition-colors"
      >
        <span className="text-sm text-slate-300">{oracle.table.name}</span>
        <button
          onClick={() => handleRollOracle(oracle)}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
          data-tooltip={`Roll on ${oracle.table.name}`}
        >
          <Dices className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    ));
  };

  return (
    <div className="px-2 pt-2 pb-2 h-full overflow-y-auto app-scroll">
      {/* Combo Oracle Buttons */}
      <div className="mb-4 px-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Combo Oracles
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleComboOracle('action-theme')}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded transition-colors text-white"
            style={{ backgroundColor: '#332244' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#442255')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#332244')}
          >
            <Dices className="w-4 h-4" />
            <span className="text-sm font-medium">Action + Theme</span>
          </button>
          <button
            onClick={() => handleComboOracle('descriptor-focus')}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded transition-colors text-white"
            style={{ backgroundColor: '#332244' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#442255')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#332244')}
          >
            <Dices className="w-4 h-4" />
            <span className="text-sm font-medium">Descriptor + Focus</span>
          </button>
        </div>
      </div>

      {/* Core Oracles */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('core')}
          className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors"
        >
          {expandedSections.has('core') ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Core Oracles
          </h3>
        </button>
        {expandedSections.has('core') && (
          <div className="bg-slate-800 rounded-lg overflow-hidden mt-2">
            {renderOracleList(coreOracles)}
          </div>
        )}
      </div>

      {/* More Oracles */}
      {moreOracles.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection('more')}
            className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors"
          >
            {expandedSections.has('more') ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              More Oracles
            </h3>
          </button>
          {expandedSections.has('more') && (
            <div className="bg-slate-800 rounded-lg overflow-hidden mt-2">
              {renderOracleList(moreOracles)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
