// ─────────────────────────────────────────────────────────────────────────────
// Thread Card Component
// 
// Renders a Thread Card in the Live Session UI.
// Supports collapsible content, action buttons, and type-specific styling.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import type { ThreadCard as ThreadCardType, ActionButton } from '../../types/threadCard';
import { getActionsForCard, getCommonActions } from '../../utils/threadCardActions';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ThreadCardProps {
  card: ThreadCardType;
  onAction?: (action: string, params?: Record<string, unknown>) => void;
  onTagClick?: (tag: string) => void;
  showTimestamp?: boolean;
  showActions?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styling Maps
// ─────────────────────────────────────────────────────────────────────────────

const typeStyles: Record<string, { header: string; border: string; bg: string }> = {
  dice: {
    header: 'bg-amber-600 text-amber-950',
    border: 'border-amber-600/40',
    bg: 'bg-amber-600/10',
  },
  oracle: {
    header: 'bg-violet-500 text-violet-950',
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/10',
  },
  ai: {
    header: 'bg-fuchsia-500 text-fuchsia-950',
    border: 'border-fuchsia-500/40',
    bg: 'bg-fuchsia-500/10',
  },
  user: {
    header: 'bg-slate-300 text-slate-900',
    border: 'border-slate-300/40',
    bg: 'bg-slate-300/10',
  },
  clock: {
    header: 'bg-amber-800 text-amber-100',
    border: 'border-amber-800/40',
    bg: 'bg-amber-800/10',
  },
  track: {
    header: 'bg-emerald-600 text-emerald-950',
    border: 'border-emerald-600/40',
    bg: 'bg-emerald-600/10',
  },
  system: {
    header: 'bg-sky-600 text-sky-950',
    border: 'border-sky-600/40',
    bg: 'bg-sky-600/10',
  },
};

const defaultStyle = {
  header: 'bg-slate-600 text-slate-100',
  border: 'border-slate-600/40',
  bg: 'bg-slate-600/10',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────────────────────

interface ActionButtonGroupProps {
  actions: ActionButton[];
  onAction?: (action: string, params?: Record<string, unknown>) => void;
}

const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({ actions, onAction }) => {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/10">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction?.(action.action, action.params)}
          disabled={action.disabled}
          className={`
            px-2 py-1 text-xs font-medium rounded
            transition-colors duration-150
            ${action.disabled
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 text-slate-200 hover:bg-slate-600 active:bg-slate-500'
            }
          `}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

interface TagListProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
}

const TagList: React.FC<TagListProps> = ({ tags, onTagClick }) => {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tags.map((tag) => (
        <span
          key={tag}
          onClick={() => onTagClick?.(tag)}
          className={`
            px-1.5 py-0.5 text-xs rounded
            bg-slate-700 text-slate-300
            ${onTagClick ? 'cursor-pointer hover:bg-slate-600' : ''}
          `}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const ThreadCard: React.FC<ThreadCardProps> = ({
  card,
  onAction,
  onTagClick,
  showTimestamp = false,
  showActions = true,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const style = typeStyles[card.type] || defaultStyle;
  const actions = showActions ? getActionsForCard(card) : [];
  const hasContent = card.content && card.content.length > 0;

  const toggleExpanded = useCallback(() => {
    if (hasContent) {
      setIsExpanded((prev) => !prev);
    }
  }, [hasContent]);

  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`
        rounded-lg border overflow-hidden
        ${style.border} ${style.bg}
        ${className}
      `}
    >
      {/* Header */}
      <div
        onClick={toggleExpanded}
        className={`
          px-3 py-1.5 flex items-center justify-between
          ${style.header}
          ${hasContent ? 'cursor-pointer' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          {hasContent && (
            <span className="text-xs opacity-70">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="text-sm font-semibold">{card.header}</span>
        </div>
        {showTimestamp && (
          <span className="text-xs opacity-70">
            {formatTimestamp(card.timestamp)}
          </span>
        )}
      </div>

      {/* Content (Collapsible) */}
      {hasContent && isExpanded && (
        <div className="px-3 py-2 bg-black/20 border-b border-white/5">
          <div className="text-xs font-mono text-slate-400 space-y-0.5">
            {card.content.map((block, index) => (
              <div key={index}>
                {block.label ? (
                  <>
                    <span className="text-slate-500">{block.label}:</span>{' '}
                    <span className="text-slate-300">{block.value}</span>
                  </>
                ) : (
                  <span className="text-slate-300">{block.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      <div className="px-3 py-2">
        <div className="text-sm text-slate-100 whitespace-pre-wrap">
          {card.result}
        </div>

        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <TagList tags={card.tags} onTagClick={onTagClick} />
        )}

        {/* Actions */}
        {showActions && actions.length > 0 && (
          <ActionButtonGroup actions={actions} onAction={onAction} />
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Compact Variant (for sidebars, previews)
// ─────────────────────────────────────────────────────────────────────────────

interface CompactThreadCardProps {
  card: ThreadCardType;
  onClick?: () => void;
  className?: string;
}

export const CompactThreadCard: React.FC<CompactThreadCardProps> = ({
  card,
  onClick,
  className = '',
}) => {
  const style = typeStyles[card.type] || defaultStyle;

  return (
    <div
      onClick={onClick}
      className={`
        rounded border overflow-hidden
        ${style.border} ${style.bg}
        ${onClick ? 'cursor-pointer hover:brightness-110' : ''}
        ${className}
      `}
    >
      <div className={`px-2 py-1 text-xs font-semibold ${style.header}`}>
        {card.header}
      </div>
      <div className="px-2 py-1.5 text-xs text-slate-300 line-clamp-2">
        {card.result}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export default ThreadCard;
