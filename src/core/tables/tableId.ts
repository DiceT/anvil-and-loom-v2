/**
 * Table ID Utilities
 *
 * Provides centralized helpers for building and parsing table IDs.
 * Convention:
 * - Oracles: "oracle:action", "oracle:theme"
 * - Aspect subtables: "aspect:haunted:objectives"
 * - Domain subtables: "domain:forest:locations"
 */

import { TableIdParts } from './types';

/**
 * Normalize a name to a safe ID format (lowercase, no spaces)
 */
export function normalizeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Build a table ID from parts
 */
export function buildTableId(parts: {
  type: 'aspect' | 'domain' | 'oracle';
  parent?: string;   // Aspect/Domain name
  subtable?: string; // Subtable name
}): string {
  const { type, parent, subtable } = parts;

  if (type === 'oracle') {
    // Oracle tables have no parent or subtable
    return `oracle:${normalizeId(parent || 'unknown')}`;
  }

  if (!parent) {
    throw new Error(`Table ID for ${type} requires parent name`);
  }

  if (!subtable) {
    throw new Error(`Table ID for ${type} requires subtable name`);
  }

  return `${type}:${normalizeId(parent)}:${normalizeId(subtable)}`;
}

/**
 * Parse a table ID back into parts
 */
export function parseTableId(tableId: string): TableIdParts {
  const parts = tableId.split(':');

  if (parts.length < 2) {
    throw new Error(`Invalid table ID format: ${tableId}`);
  }

  const type = parts[0] as 'aspect' | 'domain' | 'oracle';

  if (type === 'oracle') {
    return {
      type: 'oracle',
      name: parts[1],
    };
  }

  if (type === 'aspect' || type === 'domain') {
    if (parts.length < 3) {
      throw new Error(`${type} table ID requires parent and subtable: ${tableId}`);
    }

    return {
      type,
      parent: parts[1],
      subtable: parts[2],
      name: `${parts[1]}:${parts[2]}`,
    };
  }

  throw new Error(`Unknown table type in ID: ${tableId}`);
}

/**
 * Get display name from table ID
 */
export function getDisplayName(tableId: string): string {
  try {
    const parts = parseTableId(tableId);

    if (parts.type === 'oracle') {
      return capitalize(parts.name);
    }

    return `${capitalize(parts.parent || '')} - ${capitalize(parts.subtable || '')}`;
  } catch {
    return tableId;
  }
}

/**
 * Helper to capitalize first letter
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

/**
 * Extract parent ID from a subtable ID
 * e.g. "aspect:haunted:objectives" -> "haunted"
 */
export function getParentId(tableId: string): string | null {
  try {
    const parts = parseTableId(tableId);
    return parts.parent || null;
  } catch {
    return null;
  }
}

/**
 * Check if a table ID represents a specific type
 */
export function isAspect(tableId: string): boolean {
  return tableId.startsWith('aspect:');
}

export function isDomain(tableId: string): boolean {
  return tableId.startsWith('domain:');
}

export function isOracle(tableId: string): boolean {
  return tableId.startsWith('oracle:');
}
