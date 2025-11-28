import { c as createLucideIcon, b as create } from "./index-ChM8alZf.js";
const __iconNode$1 = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
];
const Plus = createLucideIcon("plus", __iconNode$1);
const __iconNode = [
  ["path", { d: "M10 11v6", key: "nco0om" }],
  ["path", { d: "M14 11v6", key: "outv1u" }],
  ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }]
];
const Trash2 = createLucideIcon("trash-2", __iconNode);
const useTabStore = create((set, get) => ({
  tabs: [],
  activeTabId: null,
  openTab: (tab) => {
    const { tabs } = get();
    const existingTab = tabs.find((t) => t.id === tab.id);
    if (existingTab) {
      set({ activeTabId: tab.id });
      return;
    }
    set({
      tabs: [...tabs, tab],
      activeTabId: tab.id
    });
  },
  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const newTabs = tabs.filter((t) => t.id !== tabId);
    let newActiveTabId = activeTabId;
    if (activeTabId === tabId) {
      newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
    }
    set({
      tabs: newTabs,
      activeTabId: newActiveTabId
    });
  },
  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
  },
  updateTabTitle: (tabId, title) => {
    const { tabs } = get();
    const updatedTabs = tabs.map(
      (t) => t.id === tabId ? { ...t, title } : t
    );
    set({ tabs: updatedTabs });
  }
}));
function recalculateRanges(rows, maxRoll) {
  if (rows.length === 0) return rows;
  const base = Math.floor(maxRoll / rows.length);
  let remainder = maxRoll % rows.length;
  let current = 1;
  return rows.map((row) => {
    const span = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    const from = current;
    const to = current + span - 1;
    current = to + 1;
    return { ...row, from, to };
  });
}
function generateRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
const useWeaveStore = create((set, get) => ({
  registry: null,
  activeWeaveId: null,
  isLoading: false,
  error: null,
  loadWeaves: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electron.weaves.loadAll();
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to load weaves");
      }
      const weaveMap = /* @__PURE__ */ new Map();
      response.data.forEach((weave) => {
        weaveMap.set(weave.id, weave);
      });
      set({
        registry: { weaves: weaveMap },
        isLoading: false
      });
    } catch (error) {
      console.error("Failed to load weaves:", error);
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false
      });
    }
  },
  setActiveWeave: (id) => {
    set({ activeWeaveId: id });
  },
  createWeave: (partial = {}) => {
    const name = partial.name || "New Weave";
    const author = partial.author || "Unknown";
    const baseId = slugify(name) || "weave";
    const timestamp = Date.now();
    const id = `${baseId}-${timestamp}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newWeave = {
      id,
      name,
      author,
      maxRoll: 10,
      rows: [],
      createdAt: now,
      updatedAt: now
    };
    const { registry } = get();
    if (registry) {
      registry.weaves.set(id, newWeave);
      set({ registry: { ...registry }, activeWeaveId: id });
    }
    return newWeave;
  },
  updateWeave: (weave) => {
    const { registry } = get();
    if (registry) {
      weave.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      registry.weaves.set(weave.id, weave);
      set({ registry: { ...registry } });
    }
  },
  saveWeave: async (id) => {
    const { registry } = get();
    if (!registry) {
      throw new Error("Registry not loaded");
    }
    const weave = registry.weaves.get(id);
    if (!weave) {
      throw new Error(`Weave ${id} not found`);
    }
    try {
      const response = await window.electron.weaves.save(weave);
      if (!response.success) {
        throw new Error(response.error || "Failed to save weave");
      }
    } catch (error) {
      console.error("Failed to save weave:", error);
      throw error;
    }
  },
  deleteWeave: async (id) => {
    try {
      const response = await window.electron.weaves.delete(id);
      if (!response.success) {
        throw new Error(response.error || "Failed to delete weave");
      }
      const { registry, activeWeaveId } = get();
      if (registry) {
        registry.weaves.delete(id);
        set({
          registry: { ...registry },
          activeWeaveId: activeWeaveId === id ? null : activeWeaveId
        });
      }
    } catch (error) {
      console.error("Failed to delete weave:", error);
      throw error;
    }
  }
}));
function normalizeId(name) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
function buildTableId(parts) {
  const { type, parent, subtable } = parts;
  if (type === "oracle") {
    return `oracle:${normalizeId(parent || "unknown")}`;
  }
  if (!parent) {
    throw new Error(`Table ID for ${type} requires parent name`);
  }
  if (!subtable) {
    throw new Error(`Table ID for ${type} requires subtable name`);
  }
  return `${type}:${normalizeId(parent)}:${normalizeId(subtable)}`;
}
function parseTableId(tableId) {
  const parts = tableId.split(":");
  if (parts.length < 2) {
    throw new Error(`Invalid table ID format: ${tableId}`);
  }
  const type = parts[0];
  if (type === "oracle") {
    return {
      type: "oracle",
      name: parts[1]
    };
  }
  if (type === "aspect" || type === "domain") {
    if (parts.length < 3) {
      throw new Error(`${type} table ID requires parent and subtable: ${tableId}`);
    }
    return {
      type,
      parent: parts[1],
      subtable: parts[2],
      name: `${parts[1]}:${parts[2]}`
    };
  }
  throw new Error(`Unknown table type in ID: ${tableId}`);
}
function getParentId(tableId) {
  try {
    const parts = parseTableId(tableId);
    return parts.parent || null;
  } catch {
    return null;
  }
}
function validateTable(data) {
  if (typeof data !== "object" || data === null) return false;
  const table = data;
  return typeof table.name === "string" && Array.isArray(table.tags) && Array.isArray(table.tableData) && typeof table.maxRoll === "number";
}
function validateTablePack(data) {
  if (!Array.isArray(data)) return false;
  if (data.length !== 6) return false;
  return data.every((table) => validateTable(table));
}
function getAspectSubtableOrder() {
  return ["Objectives", "Atmosphere", "Manifestations", "Discoveries", "Banes", "Boons"];
}
function getDomainSubtableOrder() {
  return ["Objectives", "Atmosphere", "Locations", "Discoveries", "Banes", "Boons"];
}
function processTablePack(packData, filename, source, category) {
  if (!validateTablePack(packData)) {
    console.error(`Invalid ${category} pack structure`);
    return null;
  }
  const tables = packData;
  const packName = filename.charAt(0).toUpperCase() + filename.slice(1);
  const packId = normalizeId(packName);
  const expectedOrder = category === "aspect" ? getAspectSubtableOrder() : getDomainSubtableOrder();
  const processedTables = tables.map((table, index) => {
    const subtableName = expectedOrder[index] || table.name || `subtable-${index}`;
    return {
      ...table,
      id: buildTableId({
        type: category,
        parent: packId,
        subtable: subtableName
      })
    };
  });
  const firstTable = tables[0];
  return {
    source,
    category,
    packId,
    packName,
    description: firstTable.description,
    tables: processedTables
  };
}
function processOracleTable(tableData, _filename, source) {
  if (!Array.isArray(tableData) || tableData.length === 0) {
    console.error("Invalid oracle table structure: expected array");
    return null;
  }
  const table = tableData[0];
  if (!validateTable(table)) {
    console.error("Invalid oracle table data");
    return null;
  }
  const oracleName = table.name || "Unknown";
  const oracleId = normalizeId(oracleName);
  const processedTable = {
    ...table,
    id: buildTableId({
      type: "oracle",
      parent: oracleId
    })
  };
  return {
    source,
    table: processedTable
  };
}
function buildTableRegistry(loadedData) {
  const registry = {
    aspectPacks: /* @__PURE__ */ new Map(),
    domainPacks: /* @__PURE__ */ new Map(),
    oracles: /* @__PURE__ */ new Map(),
    tablesById: /* @__PURE__ */ new Map(),
    oraclesByTag: /* @__PURE__ */ new Map()
  };
  [...loadedData.aspects.core, ...loadedData.aspects.user].forEach((item, index) => {
    const source = index < loadedData.aspects.core.length ? "core" : "user";
    const pack = processTablePack(item.data, item.filename, source, "aspect");
    if (pack) {
      registry.aspectPacks.set(pack.packId, pack);
      pack.tables.forEach((table) => {
        registry.tablesById.set(table.id, table);
      });
    }
  });
  [...loadedData.domains.core, ...loadedData.domains.user].forEach((item, index) => {
    const source = index < loadedData.domains.core.length ? "core" : "user";
    const pack = processTablePack(item.data, item.filename, source, "domain");
    if (pack) {
      registry.domainPacks.set(pack.packId, pack);
      pack.tables.forEach((table) => {
        registry.tablesById.set(table.id, table);
      });
    }
  });
  [...loadedData.oracles.core, ...loadedData.oracles.user].forEach((item, index) => {
    const source = index < loadedData.oracles.core.length ? "core" : "user";
    const oracle = processOracleTable(item.data, item.filename, source);
    if (oracle) {
      const oracleId = oracle.table.id.replace("oracle:", "");
      registry.oracles.set(oracleId, oracle);
      registry.tablesById.set(oracle.table.id, oracle.table);
      oracle.table.tags.forEach((tag) => {
        if (!registry.oraclesByTag.has(tag)) {
          registry.oraclesByTag.set(tag, []);
        }
        registry.oraclesByTag.get(tag).push(oracle.table.id);
      });
    }
  });
  return registry;
}
async function loadAndBuildRegistry() {
  const response = await window.electron.tables.loadAll();
  if (!response.success || !response.data) {
    throw new Error(`Failed to load tables: ${response.error}`);
  }
  return buildTableRegistry(response.data);
}
function getTableById(registry, tableId) {
  return registry.tablesById.get(tableId) || null;
}
function getOraclesByTag(registry, tag) {
  const tableIds = registry.oraclesByTag.get(tag) || [];
  return tableIds.map((id) => registry.tablesById.get(id)).filter((table) => table !== void 0);
}
function selectRandomOracleByTag(registry, tag) {
  const oracles = getOraclesByTag(registry, tag);
  if (oracles.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * oracles.length);
  return oracles[randomIndex];
}
const useTableStore = create((set) => ({
  registry: null,
  isLoading: false,
  error: null,
  loadTables: async () => {
    set({ isLoading: true, error: null });
    try {
      const registry = await loadAndBuildRegistry();
      set({ registry, isLoading: false });
    } catch (error) {
      console.error("Failed to load tables:", error);
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false
      });
    }
  }
}));
function parseDiceExpression(expression) {
  let normalized = expression.toLowerCase().replace(/\s/g, "");
  normalized = normalized.replace(/[+\-]+$/, "");
  const dice = [];
  let modifier = 0;
  const diceRegex = /(\d*)d(\d+)(kh|kl)?(\d*)/g;
  let match;
  while ((match = diceRegex.exec(normalized)) !== null) {
    const count = match[1] ? parseInt(match[1], 10) : 1;
    const sides = parseInt(match[2], 10);
    const keepModifier = match[3];
    const keepCount = match[4] ? parseInt(match[4], 10) : void 0;
    dice.push({ count, sides, keepModifier, keepCount });
  }
  const modifierMatch = normalized.match(/([+\-]\d+)$/);
  if (modifierMatch) {
    modifier = parseInt(modifierMatch[1], 10);
  }
  return { dice, modifier };
}
function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}
async function rollDiceExpression(expression, options) {
  if (!expression || !expression.trim()) {
    throw new Error("Dice expression cannot be empty");
  }
  const parsed = parseDiceExpression(expression);
  if (parsed.dice.length === 0) {
    throw new Error(
      `Invalid dice expression: "${expression}". Expected format: XdY, dY, or XdY+Z`
    );
  }
  for (const diceGroup of parsed.dice) {
    if (diceGroup.sides < 1) {
      throw new Error(`Invalid die: d${diceGroup.sides}. Dice must have at least 1 side.`);
    }
    if (diceGroup.count < 1) {
      throw new Error(`Invalid die count: ${diceGroup.count}. Must roll at least 1 die.`);
    }
  }
  const rolls = [];
  for (const diceGroup of parsed.dice) {
    const groupRolls = [];
    for (let i = 0; i < diceGroup.count; i++) {
      groupRolls.push({
        value: rollDie(diceGroup.sides),
        sides: diceGroup.sides,
        kept: false
      });
    }
    if (diceGroup.keepModifier) {
      const keepCount = diceGroup.keepCount ?? 1;
      if (diceGroup.keepModifier === "kh") {
        const sortedIndices = groupRolls.map((roll, idx) => ({ roll, idx })).sort((a, b) => b.roll.value - a.roll.value).slice(0, keepCount).map((item) => item.idx);
        sortedIndices.forEach((idx) => {
          groupRolls[idx].kept = true;
        });
      } else if (diceGroup.keepModifier === "kl") {
        const sortedIndices = groupRolls.map((roll, idx) => ({ roll, idx })).sort((a, b) => a.roll.value - b.roll.value).slice(0, keepCount).map((item) => item.idx);
        sortedIndices.forEach((idx) => {
          groupRolls[idx].kept = true;
        });
      }
    } else {
      groupRolls.forEach((roll) => roll.kept = true);
    }
    rolls.push(...groupRolls);
  }
  const diceTotal = rolls.filter((roll) => roll.kept).reduce((sum, roll) => sum + roll.value, 0);
  const total = diceTotal + parsed.modifier;
  return {
    expression,
    total,
    rolls,
    modifier: parsed.modifier !== 0 ? parsed.modifier : void 0,
    meta: options?.meta
  };
}
function rollWeave(weave) {
  if (!weave.rows.length) {
    throw new Error(`Weave ${weave.id} has no rows`);
  }
  const roll = rollDie(weave.maxRoll);
  const row = weave.rows.find((r) => roll >= r.from && roll <= r.to);
  if (!row) {
    throw new Error(`No row matched roll ${roll} in Weave ${weave.id}`);
  }
  return { roll, row };
}
const useResultsStore = create((set) => ({
  cards: [],
  addCard: (card) => set((state) => ({
    cards: [...state.cards, card]
  })),
  clearCards: () => set({ cards: [] }),
  loadCards: (cards) => set({ cards })
}));
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function logResultCard(input) {
  const card = {
    id: generateId(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    header: input.header,
    result: input.result,
    content: input.content,
    source: input.source || "other",
    meta: input.meta
  };
  useResultsStore.getState().addCard(card);
  const allCards = useResultsStore.getState().cards;
  if (window.electron) {
    window.electron.tapestry.saveResults(allCards).catch((error) => {
      console.error("Failed to save results:", error);
    });
  }
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function getRowLabel(row) {
  switch (row.targetType) {
    case "aspect":
      return `Aspect: ${capitalize(row.targetId)}`;
    case "domain":
      return `Domain: ${capitalize(row.targetId)}`;
    case "oracle":
      return `Oracle: ${row.targetId}`;
    case "oracleCombo":
      return row.targetId;
    default:
      return row.targetId;
  }
}
function logWeaveResult(weave, roll, row) {
  const targetLabel = getRowLabel(row);
  logResultCard({
    header: `Weave: ${weave.name}`,
    result: targetLabel,
    content: `Roll: ${roll}`,
    source: "weave",
    meta: {
      type: "weave",
      weaveId: weave.id,
      rowId: row.id,
      roll,
      maxRoll: weave.maxRoll,
      targetType: row.targetType,
      targetId: row.targetId
    }
  });
}
export {
  Plus as P,
  Trash2 as T,
  useTableStore as a,
  useTabStore as b,
  rollWeave as c,
  rollDiceExpression as d,
  logResultCard as e,
  getParentId as f,
  generateRowId as g,
  getTableById as h,
  getOraclesByTag as i,
  useResultsStore as j,
  logWeaveResult as l,
  parseTableId as p,
  recalculateRanges as r,
  selectRandomOracleByTag as s,
  useWeaveStore as u
};
