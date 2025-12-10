import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Infinity, Dices } from 'lucide-react';
import { useTableStore } from '../../stores/useTableStore';
import { useToolStore } from '../../stores/useToolStore';
import { useWeaveStore } from '../../stores/useWeaveStore';
import { useTabStore } from '../../stores/useTabStore';
import { TablePackMetadata } from '../../core/tables/types';
import { rollOnTable } from '../../core/tables/tableEngine';
import { resolveMacro } from '../../core/tables/macroResolver';
import {
  formatTableRollThread,
  formatComboOracleThread,
  formatRollTwiceThread,
  formatObjectivesThread,
  formatTheWeaveThread,
} from '../../core/tables/threadFormatter';
export function EnvironmentsPane() {
  const { registry, loadTables } = useTableStore();
  const { requestExpandPack, setRequestExpandPack } = useToolStore();
  const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['aspects', 'domains']));

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

  useEffect(() => {
    if (!registry) {
      loadTables();
    }
  }, [registry, loadTables]);

  // Listen for requests to expand a specific pack
  useEffect(() => {
    if (requestExpandPack) {
      setExpandedPacks((prev) => {
        const next = new Set(prev);
        next.add(requestExpandPack);
        return next;
      });
      // Clear the request
      setRequestExpandPack(null);
    }
  }, [requestExpandPack, setRequestExpandPack]);

  if (!registry) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-slate-500">Loading tables...</div>
      </div>
    );
  }

  const aspects = Array.from(registry.aspectPacks.values()).sort((a, b) =>
    a.packName.localeCompare(b.packName)
  );
  const domains = Array.from(registry.domainPacks.values()).sort((a, b) =>
    a.packName.localeCompare(b.packName)
  );

  const togglePack = (packId: string) => {
    setExpandedPacks((prev) => {
      const next = new Set(prev);
      if (next.has(packId)) {
        next.delete(packId);
      } else {
        next.add(packId);
      }
      return next;
    });
  };

  const handleAddToWeave = (type: 'aspect' | 'domain', packId: string) => {
    const { addPackToWeave } = useWeaveStore.getState();
    const { openTab } = useTabStore.getState();

    addPackToWeave(packId, type, (id, title) => {
      openTab({
        id,
        title,
        type: 'weave'
      });
    });
  };

  const handleRollSubtable = async (pack: TablePackMetadata, subtableIndex: number) => {
    const table = pack.tables[subtableIndex];
    const result = await rollOnTable(table);
    const category = pack.category === 'aspect' ? 'ASPECT' : 'DOMAIN';

    // Check if it's a macro
    if (result.isMacro) {
      const macroResult = await resolveMacro(registry, result, table.id);

      if (macroResult) {
        switch (macroResult.type) {
          case 'combo':
            const oracleLabel = result.macroType === 'ACTION_THEME' ? 'Action + Theme' : 'Descriptor + Focus';
            formatComboOracleThread(macroResult, oracleLabel, registry);
            break;
          case 'repeat':
            formatRollTwiceThread(macroResult, table.name, category, pack.packName);
            break;
          case 'reference':
            formatObjectivesThread(macroResult, table.name, category, pack.packName);
            break;
          case 'placeholder':
            formatTheWeaveThread();
            break;
        }
      }
    } else {
      // Normal roll
      formatTableRollThread(result, category, pack.packName, pack.packId);
    }
  };

  const renderPack = (pack: TablePackMetadata) => {
    const isExpanded = expandedPacks.has(pack.packId);
    const subtableNames = pack.category === 'aspect'
      ? ['Objectives', 'Atmosphere', 'Manifestations', 'Discoveries', 'Banes', 'Boons']
      : ['Objectives', 'Atmosphere', 'Locations', 'Discoveries', 'Banes', 'Boons'];

    return (
      <div key={pack.packId} className="border-b border-slate-700 last:border-0">
        {/* Pack Header */}
        <div className="flex items-center justify-between py-2 px-3 hover:bg-slate-800 transition-colors">
          <button
            onClick={() => togglePack(pack.packId)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-sm font-medium text-slate-300">{pack.packName}</span>
          </button>

          <button
            onClick={() => handleAddToWeave(pack.category, pack.packId)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            data-tooltip="Add to Weave"
          >
            <Infinity className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Subtables */}
        {isExpanded && (
          <div className="pl-6 pr-3 pb-2">
            {pack.tables.map((table, index) => (
              <div
                key={table.id}
                className="flex items-center justify-between py-1.5 hover:bg-slate-800 px-2 rounded transition-colors"
              >
                <span className="text-sm text-slate-400">{subtableNames[index]}</span>
                <button
                  onClick={() => handleRollSubtable(pack, index)}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                  data-tooltip={`Roll on ${subtableNames[index]}`}
                >
                  <Dices className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };



  return (
    <div className="px-2 pt-2 pb-2 h-full overflow-y-auto app-scroll">
      {/* Aspects Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('aspects')}
          className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors"
        >
          {expandedSections.has('aspects') ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Aspects
          </h3>
        </button>
        {expandedSections.has('aspects') && (
          <div className="bg-slate-800 rounded-lg overflow-hidden mt-2">
            {aspects.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">No aspects found</div>
            ) : (
              aspects.map(renderPack)
            )}
          </div>
        )}
      </div>

      {/* Domains Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('domains')}
          className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors"
        >
          {expandedSections.has('domains') ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Domains
          </h3>
        </button>
        {expandedSections.has('domains') && (
          <div className="bg-slate-800 rounded-lg overflow-hidden mt-2">
            {domains.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">No domains found</div>
            ) : (
              domains.map(renderPack)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
