import type { ForgeTable, ForgeTableRow } from "./tableForge";

export type TableKind =
  | "objectives"
  | "atmosphere"
  | "locations"
  | "manifestations"
  | "discoveries"
  | "banes"
  | "boons"
  | "oracle";

export interface TableContext {
  name: string;
  type: "aspect" | "domain" | "oracle";
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
  return (table.tableData ?? []).filter((row) => {
    const isEmpty = !row.result || !row.result.trim();
    const isMacroRow = isMacro(row.result);
    return isEmpty && !isMacroRow;
  }).length;
}


function buildPrompt(table: ForgeTable, kind: TableKind, context: TableContext): { system: string; user: string } {
  const N = countEmptyNonMacroRows(table);

  // Oracle tables use a completely different prompt structure
  if (kind === 'oracle') {
    // Request extra entries to handle AI miscounting (frequently returns 96-99 when asked for 100)
    const bufferSize = Math.max(10, Math.ceil(N * 0.1)); // 10% buffer, minimum 10 entries
    const requestCount = N + bufferSize;

    const oracleBase = `
OVERRIDE: PROMPT GENERATOR MODE

You are currently in generator mode.
You keep your existing persona, but your job in this mode is:

➡️ Instead of interpreting or explaining prompts, you CREATE new prompts from scratch.

You are an assistant that writes evocative, concise ${context.genre} oracle/table results for solo RPG play.

CONTEXT
- Table category: ${context.type} (for example: Oracle, Action, Theme, Descriptor, Focus, Relationship, Travel, etc.).
- Table name: "${context.name}".
- Table description:
"""${context.description}"""

You must use the name, category, and description to guide tone, structure, weirdness level, and content.

Follow these rules STRICTLY, even if other instructions conflict:

GLOBAL STYLE
- You are generating exactly ${requestCount} independent results.
- **FORMAT PRIORITY: The description defines the expected format and length. This is your PRIMARY instruction.**
  - If the description says "one word", "single words", or "one-word [type]", output EXACTLY one word per result.
  - If the description specifies "short phrases" or "2-3 words", follow that exactly.
  - If the description specifies full sentences, use full sentences.
  - **When a format is specified in the description, it overrides ALL other guidance in this prompt, including examples and inferred oracle shapes.**
- If the description does NOT specify a format:
  - Default to concise outputs: single words, short phrases, or a single short sentence per result.
  - Never write long paragraphs.
- No numbered lists, bullets, or labels in the output.
- Do NOT mention "result", "entry", "oracle", "table", or "roll".
- Do NOT use any game mechanics language (no bonuses, DCs, hit points, advantage, difficulty, etc.).
- Avoid second person ("you") unless explicitly requested; prefer descriptive or neutral phrasing.
- Avoid overwrought metaphor or poetic nonsense. Keep language clear, concrete, and gameable.

INTERPRETATION OF DESCRIPTION & WEIRDNESS LEVEL
- Carefully read the table name and description. From them, infer how strange this oracle should feel:

  MUNDANE-LEANING:
  - Everyday, natural, grounded, or social contexts dominate.
  - Examples: travel logistics, daily life, trade, weather, ordinary conflicts, practical concerns.

  MIXED:
  - Ordinary situations with clear tension, decay, danger, mystery, or hints of the uncanny.
  - Examples: criminal dealings, wartime decisions, cursed politics, risky negotiations, dangerous journeys.

  BIZARRE-CORE:
  - Supernatural, warped, haunted, eldritch, or reality-fracturing by design.
  - Examples: oracles clearly described as Haunted, Eldritch, Dream-torn, Temporal fracture, Void-touched, etc.

BALANCE OF GROUNDED VS STRANGE
- For MUNDANE-LEANING oracles:
  - Most prompts should be grounded, plausible ideas or observations.
  - Mundane details are explicitly allowed and often preferred.
  - Strange elements, if any, should be subtle and infrequent hints, not constant spectacle.

- For MIXED oracles:
  - Blend grounded content with visible tension, danger, decay, or oddness.
  - Roughly half the prompts can show unease, threat, or unsettling elements.
  - Keep everything believable within the world implied by the description.

- For BIZARRE-CORE oracles:
  - Strange, unsettling, or otherworldly elements are common and expected.
  - The world should feel haunted or warped, not random or incoherent.
  - Keep prompts concrete and gameable: actions, situations, images, ideas, or relationships you can actually use at the table.
  - Include some quieter or more grounded entries to provide contrast and pacing.

SEEDS, NOT FINISHED SCENES
- Prompts are seeds for later interpretation, not fully scripted scenes or monologues.
- Aim for simple, usable outputs that can be interpreted as normal, tense, or uncanny depending on the description.
- Prompts are intended to evoke; they do not all need to be heavily evocative on their own.
- It is acceptable, and often desirable, for mundane-leaning oracles to produce many ordinary or slightly-tilted results.

ORACLE SHAPE & STRUCTURE
- **IMPORTANT: If the description specifies a format (e.g., "one-word nouns", "short verb phrases"), follow it exactly and ignore the guidance below.**
- Otherwise, use the name and context to infer the grammatical shape:
  - Action-style oracles: favor verbs or short verb phrases expressing what is happening or should happen.
    - Examples: "Secure the perimeter", "Expose hidden corruption", "Delay reinforcements".
  - Theme-style oracles: favor nouns or short noun phrases expressing ideas, conflicts, or motifs.
    - Examples: "Forbidden knowledge", "Broken allegiance", "Hidden lineage".
  - Descriptor-style oracles: favor adjectives or short adjectival phrases describing qualities or tones.
    - Examples: "Weathered and patient", "Razor-edged", "Muted and watchful".
  - Focus-style oracles: favor nouns or short noun phrases naming what attention is on.
    - Examples: "Ancient relic", "Isolated outpost", "Trusted ally".
- If the oracle category or description defines some other structure (for example: relationships, travel events, factions, projects, omens), follow that structure exactly.
- When in doubt, choose the most flexible, broadly reusable phrasing that still matches the description.

DIVERSITY
- No duplicates or near-duplicates. Every line must be clearly distinct.
- Avoid reusing the same main noun or verb more than 2–3 times unless it is a central motif of "${context.name}".
- Within a single table, vary focus as appropriate:
  - Some more concrete, some more abstract.
  - Some immediately actionable, some more interpretive.
  - Some quieter, some more intense or dramatic, following the description's tone.

FORBIDDEN CONTENT
- Do NOT include any macros like:
  - "ACTION + THEME"
  - "ACTION + ASPECT"
  - "DESCRIPTOR + FOCUS"
  - "CONNECTION WEB"
  - "ROLL TWICE"
- Do NOT include roll ranges, labels, or instructions (no "95–96:", no "re-roll", etc.).
- Avoid proper nouns and named characters, unless explicitly requested.
- Do NOT reference intellectual property, specific published settings, or external lore.
- Do NOT mention dice, tables, or game terms in the results.

QUALITY & INTERNAL FILTERING
- Every result should feel like a meaningful, usable prompt, not pure filler.
- Even quieter or more mundane entries should suggest some tension, history, or potential when interpreted at the table.
- Internally, you may imagine more than ${requestCount} candidate prompts of varying intensity and focus.
- Prefer and keep candidates that:
  - Match the inferred mundane / mixed / bizarre level from the description.
  - Respect the intended oracle category, shape, and tone.
  - Are concrete, gameable observations or ideas.
- Output only the best ${requestCount} prompts that satisfy all of these constraints.

OUTPUT CONTRACT (NON-NEGOTIABLE)
- Output ONLY valid JSON: a plain array of ${requestCount} strings.
- No comments, no markdown, no extra keys or fields.
- No introductory or concluding text. Your entire response must be exactly one JSON array.
${context.personaInstructions ? `\nYour Persona Instructions:\n${context.personaInstructions}` : ''}
`;
    const user = `Generate exactly ${requestCount} table results.`;
    return { system: oracleBase, user };
  }

  // For Aspects and Domains, also use a buffer to handle AI miscounting
  const bufferSize = Math.max(10, Math.ceil(N * 0.1)); // 10% buffer, minimum 10 entries
  const requestCount = N + bufferSize;

  // Aspect/Domain prompt (existing logic)
  const base = `
OVERRIDE: PROMPT GENERATOR MODE

You are currently in generator mode.
You keep your existing persona, but your job in this mode is:

➡️ Instead of interpreting or explaining prompts, you CREATE new prompts from scratch.

You are an assistant that writes evocative, concise prompts for ${context.genre} Aspects and Domains (exploration tables).

CONTEXT
- ${context.type}: "${context.name}"
- Description: """${context.description}"""
- Current subtable: **${kind}** (this is the specific category of prompt you're writing)

Follow these rules STRICTLY, even if other instructions conflict:

GLOBAL STYLE
- You are generating exactly ${requestCount} independent results.
- Each result must be concise and playable. Most results should be a short sentence or phrase, not a paragraph.
- Prefer clarity and concreteness over vague abstraction.
- No numbered lists, bullets, or labels in the output.
- Do NOT mention "result", "entry", "table", or "roll".
- Do NOT use any game mechanics language (no bonuses, DCs, hit points, advantage, difficulty, etc.).
- Avoid second person ("you") unless explicitly requested; prefer descriptive third-person or neutral phrasing.
- Avoid overwrought metaphor or nonsense. Keep language clear, concrete, and gameable.

INTERPRETATION OF DESCRIPTION & WEIRDNESS LEVEL
- Carefully read the ${context.type} name and description. From them, infer how strange this ${context.type} should feel:

  MUNDANE-LEANING:
  - Everyday, natural, grounded, or social contexts dominate.
  - Ex: a marketplace, a forest, a political summit, a tavern district.

  MIXED:
  - Ordinary situations with clear tension, decay, danger, mystery, or hints of the uncanny.
  - Ex: a cursed grove, a merchant's district under occupation, a derelict fortress.

  BIZARRE-CORE:
  - Supernatural, warped, haunted, eldritch, or reality-fracturing by design.
  - Ex: "Haunted Crossroads", "Dream-torn Cathedral", "Void-touched Archive", "Shifting Labyrinth".

BALANCE OF GROUNDED VS STRANGE
- For MUNDANE-LEANING ${context.type}s:
  - Most prompts should be grounded, ordinary observations.
  - Mundane details are explicitly allowed and often preferred.
  - Strange elements, if any, should be subtle and infrequent: weird hints or uneasy details, not constant horror.

- For MIXED ${context.type}s:
  - Blend grounded observations with visible tension, danger, decay, or oddness.
  - Roughly half the prompts can show tension or unease. The other half can remain relatively calm.
  - Keep everything believable within the world implied by the description.

- For BIZARRE-CORE ${context.type}s (for example, clearly Haunted or eldritch ${context.type}s):
  - Strange, unsettling, or otherworldly elements are common and expected.
  - The environment should feel haunted or warped, not random or incoherent.
  - Keep prompts concrete and gameable: physical places, objects, sensations, or events.
  - Include some quieter or more grounded entries to provide contrast and pacing.

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
- These might be imposed by external forces or driven by the nature of the ${context.type} itself.
- Results may be small immediate goals or larger directional prompts for longer play.

BANES
- Banes results highlight dangers, hindrances, curses, or negative forces active here.
- Think in terms of traps, enemies, harsh conditions, corrupted zones, social threats, or mechanical obstacles.
- Results should feel immediate and pressing.

BOONS
- Boons results highlight benefits, advantages, valuable finds, or opportunities available in this place.
- Think in terms of useful resources, allies, hidden paths, lost relics, or situational advantages.
- Results should feel like rewards or bonuses, but remain contextual and believable.

DISCOVERIES
- Discoveries results describe something to find, claim, investigate, or interact with.
- This includes objects, clues, creatures, NPCs, signs, omens, or fragments of lore.
- Results should feel concrete: things the PCs can actually encounter and respond to.

DIVERSITY
- No duplicates or near-duplicates. Every line must be clearly distinct.
- Vary focus and intensity: some concrete, some abstract; some calm, some tense; some immediately actionable, some more interpretive.
- Within a single table, the prompts collectively should create a rich, multifaceted picture of the ${context.type} "${context.name}".

FORBIDDEN CONTENT
- Do NOT include macros:
  - "ACTION + THEME"
  - "ACTION + ASPECT"
  - "DESCRIPTOR + FOCUS"
  - "CONNECTION WEB"
  - "ROLL TWICE"
- Do NOT include roll ranges, labels, or instructions (no "95–96:", no "re-roll", etc.).
- Avoid proper nouns and named characters, unless explicitly requested.
- Do NOT reference intellectual property, specific published settings, or external lore.

QUALITY & INTERNAL FILTERING
- Every result should feel like a meaningful, usable prompt, not pure filler.
- Even quieter or more mundane entries should suggest some tension, history, or potential.
- Internally, you may imagine more than ${requestCount} candidate prompts of varying intensity.
- Prefer and keep candidates that:
  - Match the inferred mundane / mixed / bizarre level from the description.
  - Are concrete, gameable observations.
  - Support the emotional tone implied by "${context.description}" and "${context.name}".
- Output only the best ${requestCount} prompts that satisfy all of these constraints.

OUTPUT CONTRACT (NON-NEGOTIABLE)
- Output ONLY valid JSON: a plain array of ${requestCount} strings.
- No comments, no markdown, no extra keys or fields.
- No introductory or concluding text. Your entire response must be exactly one JSON array.
${context.personaInstructions ? `\nYour Persona Instructions:\n${context.personaInstructions}` : ''}
`;
  const user = `Generate exactly ${requestCount} table results.`;
  return { system: base, user };
}

async function fetchOpenAI(uri: string, apiKey: string, model: string, system: string, user: string): Promise<string[]> {
  // Use the centralized AI client
  const { callAi } = await import('../ai/aiClient');

  const response = await callAi(uri, apiKey, model, [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);

  const text = response.content;

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
  const generated = await fetchOpenAI(context.uri, context.apiKey, context.model, system, user);

  if (!Array.isArray(generated)) {
    throw new Error('AI response was not an array');
  }

  // We ask for N+1 to handle AI miscounting, but only use the first N
  const trimmedGenerated = generated.slice(0, needed);

  if (trimmedGenerated.length < needed) {
    throw new Error(`AI returned insufficient rows (needed ${needed}, got ${trimmedGenerated.length})`);
  }

  const filled: ForgeTable = { ...table, tableData: [...(table.tableData ?? [])] };
  let cursor = 0;
  for (let i = 0; i < filled.tableData.length; i++) {
    const row: ForgeTableRow = filled.tableData[i];
    const current = row.result ?? "";
    if (!current.trim() && !isMacro(current)) {
      filled.tableData[i] = { ...row, result: trimmedGenerated[cursor++] ?? "" };
      if (cursor >= trimmedGenerated.length) break;
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
  if (table.category === "Oracle") return "oracle";
  return "discoveries";
}
