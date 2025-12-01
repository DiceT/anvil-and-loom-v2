export type ForgeCategory = "Aspect" | "Domain" | "Oracle";

export interface ForgeTableRow {
  floor: number;
  ceiling: number;
  result: string;
}

export interface ForgeTable {
  sourcePath: string;
  category: ForgeCategory;
  name: string; // table name (e.g., Objectives, Atmosphere, Manifestations/Locations, etc.)
  tags: string[];
  summary?: string;
  description?: string;
  headers: string[]; // ["Roll", "Result"]
  tableData: ForgeTableRow[];
  maxRoll: number; // 100
  oracle_type?: string;
  icon?: string;
  source?: { title: string; page?: number };
}

export interface ForgeFilePayload {
  category: ForgeCategory;
  name: string; // Aspect or Domain name (e.g., Haunted, Forest)
  description: string;
  tables: ForgeTable[];
}

function makeRangeRows(): ForgeTableRow[] {
  const rows: ForgeTableRow[] = [];
  for (let i = 1; i <= 100; i += 2) {
    rows.push({ floor: i, ceiling: i + 1, result: "" });
  }
  return rows;
}

function makeOracleRows(): ForgeTableRow[] {
  const rows: ForgeTableRow[] = [];
  for (let i = 1; i <= 100; i++) {
    rows.push({ floor: i, ceiling: i, result: "" });
  }
  return rows;
}

function applyMacroRows(
  rows: ForgeTableRow[],
  macros: Array<{ range: [number, number]; text: string }>
) {
  const byStart: Record<number, string> = {};
  macros.forEach((m) => {
    byStart[m.range[0]] = m.text;
  });
  return rows.map((r) => {
    const macro = byStart[r.floor];
    return macro ? { ...r, result: macro } : r;
  });
}

function baseTable(
  category: ForgeCategory,
  tableName: string,
  tags: string[],
  description?: string,
  oracleType?: string
): ForgeTable {
  return {
    sourcePath: "forge",
    category,
    name: tableName,
    tags,
    description,
    headers: ["Roll", "Result"],
    tableData: makeRangeRows(),
    maxRoll: 100,
    oracle_type: oracleType,
  };
}

function withActionAspectMacros(rows: ForgeTableRow[], includeConnectionWeb = false) {
  const macros: Array<{ range: [number, number]; text: string }> = [
    ...(includeConnectionWeb ? [{ range: [95, 96] as [number, number], text: "CONNECTION WEB" }] : []),
    { range: [97, 98] as [number, number], text: "ACTION + THEME" },
    { range: [99, 100] as [number, number], text: "ROLL TWICE" },
  ];
  return applyMacroRows(rows, macros);
}

function withDescriptorFocusMacros(rows: ForgeTableRow[], includeConnectionWeb = false) {
  const macros: Array<{ range: [number, number]; text: string }> = [
    ...(includeConnectionWeb ? [{ range: [95, 96] as [number, number], text: "CONNECTION WEB" }] : []),
    { range: [97, 98] as [number, number], text: "DESCRIPTOR + FOCUS" },
    { range: [99, 100] as [number, number], text: "ROLL TWICE" },
  ];
  return applyMacroRows(rows, macros);
}

export function createEmptyAspectTables(name: string, description: string, customTags: string[] = []): ForgeTable[] {
  const category: ForgeCategory = "Aspect";
  const tagsBase = ["aspect", ...customTags];

  const objectives: ForgeTable = baseTable(category, "Objectives", [...tagsBase, "objective"], undefined, "Objectives");
  objectives.tableData = withActionAspectMacros(objectives.tableData);

  const atmosphere: ForgeTable = baseTable(category, "Atmosphere", tagsBase, undefined, "Atmosphere");
  atmosphere.tableData = withActionAspectMacros(atmosphere.tableData);

  const manifestations: ForgeTable = baseTable(category, "Manifestations", tagsBase, undefined, "Manifestations");
  manifestations.tableData = withActionAspectMacros(manifestations.tableData, true);

  const discoveries: ForgeTable = baseTable(category, "Discoveries", tagsBase, undefined, "Discoveries");
  discoveries.tableData = withDescriptorFocusMacros(discoveries.tableData, true);

  const banes: ForgeTable = baseTable(category, "Banes", tagsBase, undefined, "Banes");
  banes.tableData = withDescriptorFocusMacros(banes.tableData);

  const boons: ForgeTable = baseTable(category, "Boons", tagsBase, undefined, "Boons");
  boons.tableData = withDescriptorFocusMacros(boons.tableData);

  // Optionally carry the parent description onto each table for context
  [objectives, atmosphere, manifestations, discoveries, banes, boons].forEach((t) => {
    t.summary = `${name} — ${t.name}`;
    t.description = description;
  });

  return [objectives, atmosphere, manifestations, discoveries, banes, boons];
}

export function createEmptyDomainTables(name: string, description: string, customTags: string[] = []): ForgeTable[] {
  const category: ForgeCategory = "Domain";
  const tagsBase = ["domain", ...customTags];

  const objectives: ForgeTable = baseTable(category, "Objectives", [...tagsBase, "objective"], undefined, "Objectives");
  objectives.tableData = withActionAspectMacros(objectives.tableData);

  const atmosphere: ForgeTable = baseTable(category, "Atmosphere", tagsBase, undefined, "Atmosphere");
  atmosphere.tableData = withActionAspectMacros(atmosphere.tableData);

  const locations: ForgeTable = baseTable(category, "Locations", tagsBase, undefined, "Locations");
  locations.tableData = withActionAspectMacros(locations.tableData, true);

  const discoveries: ForgeTable = baseTable(category, "Discoveries", tagsBase, undefined, "Discoveries");
  discoveries.tableData = withDescriptorFocusMacros(discoveries.tableData, true);

  const banes: ForgeTable = baseTable(category, "Banes", tagsBase, undefined, "Banes");
  banes.tableData = withDescriptorFocusMacros(banes.tableData);

  const boons: ForgeTable = baseTable(category, "Boons", tagsBase, undefined, "Boons");
  boons.tableData = withDescriptorFocusMacros(boons.tableData);

  [objectives, atmosphere, locations, discoveries, banes, boons].forEach((t) => {
    t.summary = `${name} — ${t.name}`;
    t.description = description;
  });

  return [objectives, atmosphere, locations, discoveries, banes, boons];
}

export function createEmptyOracleTable(name: string, description: string, customTags: string[] = []): ForgeTable[] {
  const category: ForgeCategory = "Oracle";
  const tagsBase = ["oracle", ...customTags];

  const table: ForgeTable = {
    sourcePath: "forge",
    category,
    name,
    tags: tagsBase,
    description,
    headers: ["Roll", "Result"],
    tableData: makeOracleRows(), // Use Oracle-specific rows (100 entries with floor==ceiling)
    maxRoll: 100,
    oracle_type: "Oracle",
  };
  table.summary = name;

  // Oracles have 100 individual rows (floor==ceiling), no macros by default
  // We return it as an array of 1 for consistency with the other types
  return [table];
}

export function buildForgeFile(
  category: ForgeCategory,
  name: string,
  description: string,
  tables: ForgeTable[]
): ForgeFilePayload {
  return { category, name, description, tables };
}
