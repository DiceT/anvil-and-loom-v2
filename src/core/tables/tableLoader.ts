/**
 * Table Loader and Registry Builder
 *
 * Loads tables from Electron IPC, validates them, and builds a
 * queryable registry with tag indexing.
 */

import {
  RollTable,
  TableRegistry,
  TablePackMetadata,
  OracleTableMetadata,
  TableSource,
} from './types';
import { buildTableId, normalizeId } from './tableId';

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that a table has the required structure
 */
function validateTable(data: unknown): data is RollTable {
  if (typeof data !== 'object' || data === null) return false;

  const table = data as Record<string, unknown>;

  return (
    typeof table.name === 'string' &&
    Array.isArray(table.tags) &&
    Array.isArray(table.tableData) &&
    typeof table.maxRoll === 'number'
  );
}

/**
 * Get expected subtable order for Aspects
 */
function getAspectSubtableOrder(): string[] {
  return ['Objectives', 'Atmosphere', 'Manifestations', 'Discoveries', 'Banes', 'Boons'];
}

/**
 * Get expected subtable order for Domains
 */
function getDomainSubtableOrder(): string[] {
  return ['Objectives', 'Atmosphere', 'Locations', 'Discoveries', 'Banes', 'Boons'];
}

// ============================================================================
// Table Pack Processing
// ============================================================================

/**
 * Process an Aspect or Domain pack (multi-table JSON)
 */
function processTablePack(
  packData: unknown,
  filename: string,
  source: TableSource,
  category: 'aspect' | 'domain'
): TablePackMetadata | null {
  let tables: RollTable[];
  let description: string | undefined;

  // Check if it's a ForgeFilePayload (object with tables array)
  if (packData && typeof packData === 'object' && 'tables' in packData && Array.isArray((packData as any).tables)) {
    tables = (packData as any).tables as RollTable[];
    description = (packData as any).description;
  } else if (Array.isArray(packData)) {
    // Legacy/Core format: raw array of tables
    tables = packData as RollTable[];
  } else {
    console.error(`Invalid ${category} pack structure: expected array or ForgeFilePayload`);
    return null;
  }

  // Validate the tables array
  if (tables.length !== 6 || !tables.every((table) => validateTable(table))) {
    console.error(`Invalid ${category} pack structure: validation failed`);
    return null;
  }

  // Get pack name from filename (e.g., "haunted" -> "Haunted")
  const packName = filename.charAt(0).toUpperCase() + filename.slice(1);
  const packId = normalizeId(packName);

  // Get the expected subtable order
  const expectedOrder = category === 'aspect' ? getAspectSubtableOrder() : getDomainSubtableOrder();

  // Process each subtable and assign IDs
  const processedTables = tables.map((table, index) => {
    const subtableName = expectedOrder[index] || table.name || `subtable-${index}`;

    return {
      ...table,
      id: buildTableId({
        type: category,
        parent: packId,
        subtable: subtableName,
      }),
    };
  });

  const firstTable = tables[0];
  return {
    source,
    category,
    packId,
    packName,
    description: description || firstTable.description,
    tables: processedTables,
  };
}

/**
 * Process an Oracle table (single-table JSON)
 */
function processOracleTable(
  tableData: unknown,
  _filename: string,
  source: TableSource,
  subCategory: 'core' | 'more'
): OracleTableMetadata | null {
  let tableDataArray: any[];

  // Check if it's a ForgeFilePayload (object with tables array)
  if (tableData && typeof tableData === 'object' && 'tables' in tableData && Array.isArray((tableData as any).tables)) {
    tableDataArray = (tableData as any).tables;
  } else if (Array.isArray(tableData)) {
    tableDataArray = tableData;
  } else {
    console.error('Invalid oracle table structure: expected array or ForgeFilePayload');
    return null;
  }

  if (tableDataArray.length === 0) {
    console.error('Invalid oracle table structure: empty array');
    return null;
  }

  const table = tableDataArray[0];

  if (!validateTable(table)) {
    console.error('Invalid oracle table data');
    return null;
  }

  const oracleName = table.name || 'Unknown';
  const oracleId = normalizeId(oracleName);

  const processedTable: RollTable = {
    ...table,
    id: buildTableId({
      type: 'oracle',
      parent: oracleId,
    }),
  };

  return {
    source,
    subCategory,
    table: processedTable,
  };
}

// ============================================================================
// Registry Building
// ============================================================================

/**
 * Build a complete table registry from loaded data
 */
export function buildTableRegistry(loadedData: {
  aspects: {
    core: Array<{ filename: string; data: unknown }>;
    user: Array<{ filename: string; data: unknown }>;
  };
  domains: {
    core: Array<{ filename: string; data: unknown }>;
    user: Array<{ filename: string; data: unknown }>;
  };
  oracles: {
    core: Array<{ filename: string; data: unknown }>;
    coreMore: Array<{ filename: string; data: unknown }>;
    user: Array<{ filename: string; data: unknown }>;
    userMore: Array<{ filename: string; data: unknown }>;
  };
}): TableRegistry {
  const registry: TableRegistry = {
    aspectPacks: new Map(),
    domainPacks: new Map(),
    oracles: new Map(),
    tablesById: new Map(),
    oraclesByTag: new Map(),
  };

  // Process Aspects (core + user)
  [...loadedData.aspects.core, ...loadedData.aspects.user].forEach((item, index) => {
    const source: TableSource = index < loadedData.aspects.core.length ? 'core' : 'user';
    const pack = processTablePack(item.data, item.filename, source, 'aspect');

    if (pack) {
      registry.aspectPacks.set(pack.packId, pack);

      // Add subtables to tablesById
      pack.tables.forEach((table) => {
        registry.tablesById.set(table.id, table);
      });
    }
  });

  // Process Domains (core + user)
  [...loadedData.domains.core, ...loadedData.domains.user].forEach((item, index) => {
    const source: TableSource = index < loadedData.domains.core.length ? 'core' : 'user';
    const pack = processTablePack(item.data, item.filename, source, 'domain');

    if (pack) {
      registry.domainPacks.set(pack.packId, pack);

      // Add subtables to tablesById
      pack.tables.forEach((table) => {
        registry.tablesById.set(table.id, table);
      });
    }
  });

  // Process Oracles (core, coreMore, user, userMore)
  const allOracles = [
    ...loadedData.oracles.core.map((item) => ({ ...item, source: 'core' as TableSource, subCategory: 'core' as const })),
    ...loadedData.oracles.coreMore.map((item) => ({ ...item, source: 'core' as TableSource, subCategory: 'more' as const })),
    ...loadedData.oracles.user.map((item) => ({ ...item, source: 'user' as TableSource, subCategory: 'core' as const })),
    ...loadedData.oracles.userMore.map((item) => ({ ...item, source: 'user' as TableSource, subCategory: 'more' as const })),
  ];

  allOracles.forEach((item) => {
    const oracle = processOracleTable(item.data, item.filename, item.source, item.subCategory);

    if (oracle) {
      const oracleId = oracle.table.id.replace('oracle:', '');
      registry.oracles.set(oracleId, oracle);

      // Add to tablesById
      registry.tablesById.set(oracle.table.id, oracle.table);

      // Build tag index (for combo oracle resolution)
      oracle.table.tags.forEach((tag) => {
        if (!registry.oraclesByTag.has(tag)) {
          registry.oraclesByTag.set(tag, []);
        }
        registry.oraclesByTag.get(tag)!.push(oracle.table.id);
      });
    }
  });

  return registry;
}

/**
 * Load tables from Electron and build registry
 */
export async function loadAndBuildRegistry(): Promise<TableRegistry> {
  const response = await window.electron.tables.loadAll();

  if (!response.success || !response.data) {
    throw new Error(`Failed to load tables: ${response.error}`);
  }

  return buildTableRegistry(response.data);
}

/**
 * Get a table by ID from the registry
 */
export function getTableById(registry: TableRegistry, tableId: string): RollTable | null {
  return registry.tablesById.get(tableId) || null;
}

/**
 * Get all oracle tables with a specific tag
 */
export function getOraclesByTag(registry: TableRegistry, tag: string): RollTable[] {
  const tableIds = registry.oraclesByTag.get(tag) || [];
  return tableIds
    .map((id) => registry.tablesById.get(id))
    .filter((table): table is RollTable => table !== undefined);
}

/**
 * Select a random oracle table from those with a specific tag
 */
export function selectRandomOracleByTag(registry: TableRegistry, tag: string): RollTable | null {
  const oracles = getOraclesByTag(registry, tag);

  if (oracles.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * oracles.length);
  return oracles[randomIndex];
}
