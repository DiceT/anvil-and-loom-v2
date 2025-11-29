import { useState } from 'react';
import { TentTree, Sparkles } from 'lucide-react';
import { Thread } from '../../core/results/types';
import { useTableStore } from '../../stores/useTableStore';
import { useToolStore } from '../../stores/useToolStore';
import { resolveActionTheme, resolveDescriptorFocus } from '../../core/tables/macroResolver';
import { formatComboOracleThread } from '../../core/tables/threadFormatter';

interface ThreadCardProps {
  card: Thread;
  defaultExpanded?: boolean;
}

const sourceColors: Record<string, string> = {
  dice: '#222244',
  aspect: '#224433',  // Green-ish for Aspects
  domain: '#224433',  // Green-ish for Domains
  table: '#224422',   // General table (legacy)
  oracle: '#332244',  // Purple-ish for Oracles
  interpretation: '#442244',
  weave: '#685431',   // The Weave's gold/brown
  system: '#1e293b',
  other: '#1e293b',
};

export function ThreadCard({ card, defaultExpanded = false }: ThreadCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { registry } = useTableStore();
  const { setRightPaneMode, setRequestExpandPack } = useToolStore();
  const headerBgColor = sourceColors[card.source || 'other'];
  const timestamp = new Date(card.timestamp).toLocaleTimeString();

  const handleRollOracle = (type: 'action' | 'theme' | 'descriptor' | 'focus') => {
    if (!registry) return;

    // Determine which combo this belongs to and roll it
    if (type === 'action' || type === 'theme') {
      const result = resolveActionTheme(registry);
      if (result) {
        formatComboOracleThread(result, 'Action + Theme', registry);
      }
    } else {
      const result = resolveDescriptorFocus(registry);
      if (result) {
        formatComboOracleThread(result, 'Descriptor + Focus', registry);
      }
    }
  };

  const handleOpenEnvironment = (packId: string) => {
    setRightPaneMode('environments');
    setRequestExpandPack(packId);
  };

  const handleWeaveAction = (targetType: string, targetId: string) => {
    if (targetType === 'aspect' || targetType === 'domain') {
      handleOpenEnvironment(targetId);
    } else if (targetType === 'oracleCombo') {
      // Roll the oracle combo (Action+Theme or Descriptor+Focus)
      if (targetId === 'Action+Theme') {
        handleRollOracle('action');
      } else if (targetId === 'Descriptor+Focus') {
        handleRollOracle('descriptor');
      }
    }
    // For single oracles, we'd need to implement individual oracle rolling
  };

  // Check if this is an oracle combo result
  const isOracleCombo = card.source === 'oracle' && card.meta?.oracleType;

  // Check if this is an aspect/domain result
  const isAspectOrDomain = (card.source === 'aspect' || card.source === 'domain') && card.meta?.packId;
  const packId = card.meta?.packId as string;

  // Check if this is a weave result
  const isWeave = card.source === 'weave' && card.meta?.targetType;
  const weaveTargetType = card.meta?.targetType as string;
  const weaveTargetId = card.meta?.targetId as string;

  const renderResultWithButtons = () => {
    // Weave result with action button
    if (isWeave) {
      const icon = (weaveTargetType === 'aspect' || weaveTargetType === 'domain') ? TentTree : Sparkles;
      const IconComponent = icon;
      const tooltipText = (weaveTargetType === 'aspect' || weaveTargetType === 'domain')
        ? 'Open in Environments'
        : 'Roll Oracle';

      return (
        <div className="font-bold text-slate-100 text-base flex items-center justify-between">
          <span>{card.result}</span>
          <button
            onClick={() => handleWeaveAction(weaveTargetType, weaveTargetId)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            title={tooltipText}
          >
            <IconComponent className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      );
    }

    // Aspect/Domain with Environment link
    if (isAspectOrDomain) {
      return (
        <div className="font-bold text-slate-100 text-base flex items-center justify-between">
          <span>{card.result}</span>
          <button
            onClick={() => handleOpenEnvironment(packId)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            title="Open in Environments"
          >
            <TentTree className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      );
    }

    // Oracle combo - just show the result, no buttons needed (it's already a result)
    if (isOracleCombo) {
      return <div className="font-bold text-slate-100 text-base">{card.result}</div>;
    }

    // Default result without buttons
    return <div className={`font-bold text-slate-100 whitespace-pre-line ${card.source === 'dice' ? 'text-2xl' : 'text-base'}`}>
      {card.result}
    </div>;
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
      {/* Header - Clickable Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-2 border-b border-slate-700 text-left transition-opacity hover:opacity-90 focus:outline-none"
        style={{ backgroundColor: headerBgColor }}
      >
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold" style={{ color: '#eeffff' }}>
            {card.header}
          </h4>
          <span
            className="text-xs"
            style={{ color: '#eeffff', opacity: 0.7 }}
          >
            {timestamp}
          </span>
        </div>
      </button>

      {/* Content - Collapsible */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? '500px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div
          className="px-3 py-3 text-sm text-slate-400 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: card.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
          }}
        />
      </div>

      {/* Footer - Always Visible */}
      <div className="px-3 py-3 border-t border-slate-700">
        {renderResultWithButtons()}
      </div>
    </div>
  );
}
