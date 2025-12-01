import type { ForgeTable, ForgeTableRow } from "./tableForge";

export type TableKind =
  | "objectives"
  | "atmosphere"
  | "locations"
  | "manifestations"
  | "discoveries"
  | "banes"
  | "boons";

export interface TableContext {
  name: string;
  type: "aspect" | "domain";
  description: string;
  genre: "dark-fantasy" | "fantasy" | "sci-fi" | "starforged";
  model: string;
  uri: string;
  apiKey: string;
  personaInstructions?: string;
}

function isMacro(text: string | undefined | null): boolean {
  const v = (text || "").toUpperCase().trim();
  if (!v) return false;
  return (
    v === "ACTION + THEME" ||
    v === "DESCRIPTOR + FOCUS" ||
    v === "CONNECTION WEB" ||
    v === "ROLL TWICE"
  );
}

function countEmptyNonMacroRows(table: ForgeTable): number {
  return (table.tableData ?? []).filter((row) => !row.result || (!row.result.trim() && !isMacro(row.result))).length;
}

function mapKindDisplay(kind: TableKind): string {
  switch (kind) {
    case "objectives":
      return "Objectives";
    case "atmosphere":
      return "Atmosphere";
    case "locations":
      return "Locations";
    case "manifestations":
      return "Manifestations";
    case "discoveries":
      return "Discoveries";
    case "banes":
      return "Banes";
    case "boons":
      return "Boons";
  }
}

function buildPrompt(table: ForgeTable, kind: TableKind, context: TableContext): { system: string; user: string } {
  const N = countEmptyNonMacroRows(table);
  const base = `
OVERRIDE: PROMPT GENERATOR MODE

You are currently in generator mode.
You keep your existing persona, but your job in this mode is:

➡️ Instead of interpreting or explaining prompts, you CREATE new prompts from scratch.

You are an assistant that writes evocative, concise ${context.genre} oracle/table results for solo RPG play.

CONTEXT
- You are writing results for a ${context.type} table (Aspect or Domain).
- Name: "${context.name}"
- Description:
"""${context.description}"""
- Subtable type: ${kind} (one of: Atmosphere, Locations, Manifestations, Objectives, Discoveries, Banes, Boons)
- You must use the name and description to guide tone, weirdness, and content.

Follow these rules STRICTLY, even if other instructions conflict:

GLOBAL STYLE
- You are generating exactly ${N} independent results.
- Each result is 4–10 words long.
- Use short, punchy phrasing. No trailing period unless it adds clear impact.
- No numbered lists, bullets, or labels in the output.
- Do NOT mention "result", "entry", "oracle", "table", or "roll".
- Do NOT use any game mechanics language (no bonuses, DCs, hit points, advantage, difficulty, etc.).
- Avoid second person ("you") unless explicitly requested; prefer descriptive or neutral phrasing.
- Avoid overwrought metaphor or poetic nonsense. Keep language simple and concrete.

INTERPRETATION OF DESCRIPTION & WEIRDNESS LEVEL
- Carefully read the ${context.type} name and description. From them, infer how strange this table should feel:

  MUNDANE-LEANING:
  - Everyday, natural, grounded, or social contexts dominate.
  - Examples: farmland, village, market, road, ordinary forest, simple temple.

  MIXED:
  - Ordinary space with clear tension, decay, danger, or hints of the uncanny.
  - Examples: ruined castle, besieged city, smuggler tunnels, plague district, cursed battlefield.

  BIZARRE-CORE:
  - Supernatural, warped, haunted, eldritch, or reality-fracturing by design.
  - Examples: Aspects clearly described as "Haunted", "Eldritch", "Warped", "Dream-torn", "Temporal fracture", etc.

BALANCE OF GROUNDED VS STRANGE
- For MUNDANE-LEANING Aspects/Domains:
  - Most prompts should be grounded, plausible observations.
  - Mundane details are explicitly allowed and often preferred.
  - Strange elements, if any, should be subtle and infrequent hints, not constant spectacle.

- For MIXED Aspects/Domains:
  - Blend grounded details with visible tension, decay, or oddness.
  - Roughly half the prompts can show danger, unease, or unsettling elements.
  - Keep events believable within the world implied by the description.

- For BIZARRE-CORE Aspects/Domains (for example, clearly Haunted or eldritch):
  - Strange, unsettling, or otherworldly elements are common and expected.
  - The environment should feel haunted or warped, not random or incoherent.
  - Keep prompts concrete and gameable: physical places, objects, sensations, or events.
  - Include some quieter or more grounded entries to provide contrast and pacing.

SEEDS, NOT FINISHED SCENES
- Prompts are seeds for later interpretation, not fully scripted scenes.
- Aim for simple, concrete observations that can be interpreted as normal, eerie, or overtly supernatural depending on the description.
- Prompts are intended to evoke; they do not all need to be heavily evocative on their own.
- It is acceptable, and often desirable, for mundane-leaning Aspects/Domains to produce many ordinary or slightly-tilted details.

SUBTABLE PURPOSE (READ CAREFULLY)
Depending on the subtable type (${kind}), apply these additional constraints:

ATMOSPHERE
- Atmosphere results focus on sensory impressions and emotional tone.
- Emphasize how the place feels: sound, smell, light, texture, temperature, emotional weight.
- The environment is felt more than used.
- Avoid fully-defined points of interest as the main subject.

LOCATIONS
- Locations results describe distinct places or spaces that can be visited or explored.
- Think in terms of rooms, halls, glades, caverns, bridges, courtyards, streets, towers, terraces, pits, or similar.
- Each result should feel like a point of interest or navigable space, not just a vague mood.

MANIFESTATIONS
- Manifestations results show how the ${context.type} "${context.name}" actively expresses itself.
- Focus on symptoms, phenomena, behaviors, or changes in the environment.
- Results should feel like the Aspect/Domain leaking into reality: signs, effects, or incidents tied to its nature.

OBJECTIVES
- Objectives results provide potential goals, pressures, or tasks relevant to this place.
- These are situation hooks someone might plausibly pursue here.
- Avoid second person and commands like "you must…".
- Describe aims in a neutral voice, such as ongoing efforts or desired outcomes.

DISCOVERIES
- Discoveries results focus on things uncovered: secrets, clues, patterns, or meaningful finds.
- Often about knowledge, significance, or hidden connections rather than random objects.
- Physical finds are acceptable if their meaning or implication is clear.

BANES
- Banes results focus on dangers, traps, curses, hostile forces, or worsening situations.
- Each result should imply some form of risk, harm, loss, or painful complication.
- Do NOT express game mechanics directly; show the danger through fiction.

BOONS
- Boons results focus on opportunities, resources, knowledge, shelter, leverage, or escape.
- Boons may be grim, costly, or precarious, but should still feel potentially useful or advantageous overall.
- Do NOT express game mechanics directly; imply usefulness through fiction.

DIVERSITY
- No duplicates or near-duplicates. Every line must be clearly distinct.
- Avoid reusing the same main noun or verb more than 2–3 times unless it is a central motif of "${context.name}".
- Within a single table, vary focus:
  - Some sensory
  - Some spatial
  - Some hint at history
  - Some hint at imminent change, threat, or opportunity

FORBIDDEN CONTENT
- Do NOT include any macros like:
  - "ACTION + THEME"
  - "DESCRIPTOR + FOCUS"
  - "CONNECTION WEB"
  - "ROLL TWICE"
- Do NOT include roll ranges, labels, or instructions (no "95–96:", no "re-roll", etc.).
- Avoid proper nouns and named characters, unless explicitly requested.
- Do NOT reference intellectual property, specific published settings, or external lore.
- Do NOT mention dice, tables, or game terms in the results.

QUALITY & INTERNAL FILTERING
- Every result should feel like a meaningful, usable prompt, not pure filler.
- Even quieter or more mundane entries should suggest some tension, history, or potential.
- Internally, you may imagine more than ${N} candidate prompts of varying intensity.
- Prefer and keep candidates that:
  - Match the inferred mundane / mixed / bizarre level from the description.
  - Are concrete, gameable observations.
  - Support the emotional tone implied by "${context.description}" and "${context.name}".
- Output only the best ${N} prompts that satisfy all of these constraints.

OUTPUT CONTRACT (NON-NEGOTIABLE)
- Output ONLY valid JSON: a plain array of ${N} strings.
- No comments, no markdown, no extra keys or fields.
- No introductory or concluding text. Your entire response must be exactly one JSON array.
${context.personaInstructions ? `\nYour Persona Instructions:\n${context.personaInstructions}` : ''}
`;
  const user = `Generate exactly ${N} table results.`;
  return { system: base, user };
}

async function fetchOpenAI(model: string, apiKey: string, system: string, user: string): Promise<string[]> {
  // Use the centralized AI client
  const { callModel } = await import('../../core/ai/aiClient');
  
  const text = await callModel({
    system,
    user,
    model,
    apiKey, // Dev Table provides its own API key
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    // Try to extract JSON array from content that may have text around it
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error("Failed to parse AI response as JSON array");
    }
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error("Failed to parse extracted JSON array");
    }
  }
  if (!Array.isArray(parsed)) throw new Error("AI response was not an array");
  const results = (parsed as unknown[]).map((v) => (typeof v === "string" ? v.trim() : String(v)));
  return results;
}

export async function fillTableWithAI(
  table: ForgeTable,
  kind: TableKind,
  context: TableContext
): Promise<ForgeTable> {
  const needed = countEmptyNonMacroRows(table);
  if (needed <= 0) return table;
  const { system, user } = buildPrompt(table, kind, context);
  const generated = await fetchOpenAI(context.model, context.apiKey, system, user);
  if (!Array.isArray(generated) || generated.length < needed) {
    throw new Error(`AI returned insufficient rows (needed ${needed}, got ${generated.length})`);
  }
  const filled: ForgeTable = { ...table, tableData: [...(table.tableData ?? [])] };
  let cursor = 0;
  for (let i = 0; i < filled.tableData.length; i++) {
    const row: ForgeTableRow = filled.tableData[i];
    const current = row.result ?? "";
    if (!current.trim() && !isMacro(current)) {
      filled.tableData[i] = { ...row, result: generated[cursor++] ?? "" };
      if (cursor >= generated.length) break;
    }
  }
  return filled;
}

export async function fillTablesWithAI(
  tables: ForgeTable[],
  context: TableContext
): Promise<ForgeTable[]> {
  const results: ForgeTable[] = [];
  for (const table of tables) {
    const kind = inferKind(table);
    results.push(await fillTableWithAI(table, kind, context));
  }
  return results;
}

function inferKind(table: ForgeTable): TableKind {
  const tag = (table.oracle_type || table.name || "").toLowerCase();
  if (tag.includes("objective")) return "objectives";
  if (tag.includes("atmosphere")) return "atmosphere";
  if (tag.includes("manifestation")) return "manifestations";
  if (tag.includes("location")) return "locations";
  if (tag.includes("discover")) return "discoveries";
  if (tag.includes("bane")) return "banes";
  if (tag.includes("boon")) return "boons";
  return "discoveries";
}
