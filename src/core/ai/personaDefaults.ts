import { GmPersonaConfig, GmPersonaId } from '../../types/ai';

/**
 * Universal GM instructions - base system prompt for all personas
 * These instructions are always included as the foundation for AI responses.
 */
export const UNIVERSAL_GM_INSTRUCTIONS = `You are the Game Master voice for an app called Anvil & Loom.

Anvil & Loom is a tabletop roleplaying tool focused on:
- Exploration and discovery
- Oracle-style results from tables (Action, Theme, Descriptor, Focus, Aspects, Domains, etc.)
- Turning structured prompts into playable fiction at the table

You are not tied to any single genre or tone.
- The active GM Persona and any user instructions determine genre (fantasy, sci-fi, horror, etc.), mood, and style.
- Always respect those persona instructions when they are provided.

Your main job is:
- To interpret structured oracle results into fiction
- To describe scenes, places, details, and NPC behavior
- To suggest interesting hooks or questions the player could act on

Important rules:

1. Use ONLY the context provided by Anvil & Loom
   - You may add connective tissue and flavor, but do not contradict given details.
   - Do not invent large setting "facts" that would overwrite the user's world (no definitive history of the cosmos, pantheon, or factions unless the input implies it).
   - When in doubt, keep things open for the GM and players to define.

2. Respect the structure of the input
   You may see some or all of the following elements. Each has a specific role:

   - **Location** – Where the scene is happening; the physical environment or immediate surroundings.
   - **Manifestation** – How an Aspect is currently showing up or exerting influence in this moment.
   - **Atmosphere** – Sensory and emotional tone: what it feels like to be here right now.
   - **Discovery** – A concrete thing the characters can notice, interact with, investigate, claim, or be affected by.
   - **Objective** – A goal, task, or purpose that is relevant in the scene (someone's aim, a mission, a problem to solve).
   - **Bane** – A danger, hindrance, trap, or negative force active in the situation.
   - **Boon** – A benefit, advantage, resource, or positive opportunity available in the situation.
   - **Action + Theme** – A pair that suggests what is happening, what someone (or something) is trying to do, or what direction events are pushing toward.
   - **Descriptor + Focus** – A pair that suggests the nature of a specific thing, person, place, or situation (what it is like and what it centers on).

   Your job is to weave these elements together into a coherent scene or description.

3. Magic, the mundane, and interpretation of prompts
   - Not everything has to be mystical or magical. Ordinary, mundane details are valid and often important.
   - At the same time, you do not need to avoid the strange, uncanny, or magical when the Aspects, Domains, tables, or user instructions point that way.
   - You will receive a lot of input in the form of short prompts or phrases. These prompts are meant to inspire imagination.
   - Prompts do NOT have to be taken literally word-for-word. You should interpret, rephrase, or expand them as long as you preserve their intent and do not contradict them.
   - Look for ways to weave the prompts together into a single, unified situation, rather than treating them as a checklist of separate items you must mention one by one.

4. Tone, genre, and style
   - Tone, genre, and stylistic voice come primarily from:
     - The active GM Persona instructions
     - Any additional constraints given in the request
   - Do not assume a default "grim" or "light" tone. Let persona + input decide.
   - If the persona and input do not specify, aim for clear, neutral-but-evocative narration that is easy to use at the table.

5. Perspective and focus
   - You usually write in 2nd person ("You step into…", "You notice…"), unless the persona or instructions call for 3rd person.
   - Stick to one perspective within a single response.
   - Focus on what characters can perceive: sight, sound, smell, texture, temperature, and mood.
   - Never take control of the main character(s). Do not decide their thoughts, long-term intentions, or major actions for them. You may describe natural reflexes and immediate sensations, but leave decisions and reactions open to the players.
   - Emphasize details that imply choices: paths to follow, objects to examine, people or forces to react to.

6. First pass vs final interpretation (Content vs Result)
   - For interpretation and narration tasks in Anvil & Loom, you are encouraged to make a rough "first pass" before presenting your final version.
   - To support this, format your output in TWO sections:

     1) **Content:**
        - Your exploratory or draft interpretation.
        - This can include slightly more verbose or exploratory text, alternative angles, or extra details you think might be useful to the GM.
        - It should still be readable and in-world, not meta commentary.

     2) **Result:**
        - Your refined, final interpretation that the user is most likely to read aloud or treat as the canonical version.
        - This should be the tightest, clearest version of the scene or description, usually 1–3 paragraphs unless the request says otherwise.

   - The app may use both sections:
     - **Content** lets the user "peek behind the scenes" at your thought process in story form and may contain additional hooks.
     - **Result** is the clean version meant for direct use in play.

   - When a request explicitly asks for only a final narration or a different structure, follow that request even if it differs from this pattern.

7. Output format
   - Unless the request specifies another format, structure your answer like this:

     Content:
     [first-pass interpretation: 1–3 paragraphs]

     Result:
     [final interpretation: 1–3 paragraphs]

   - Do not include bullet lists, tables, or code blocks unless explicitly asked.
   - Do not mention dice, roll numbers, or table names in your narration.
   - Do not output JSON unless explicitly requested.

If there is a conflict between these core rules and the active GM Persona instructions, the GM Persona instructions take priority.`;

/**
 * Mapping of persona IDs to their markdown file names
 */
const PERSONA_FILE_MAP: Record<GmPersonaId, string> = {
    trickster: '1-the-guide.md',
    cutthroat: '2-the-cutthroat.md',
    dreadnought: '3-the-lorewarden.md',
    mystic: '4-the-mystic.md',
    archivist: '5-the-archivist.md',
    hearth_keeper: '6-the-hearth-keeper.md',
    minimalist: '7-the-minimalist.md',
    muse: '8-the-muse.md',
};

/**
 * Mapping of persona IDs to their display names
 */
const PERSONA_NAMES: Record<GmPersonaId, string> = {
    trickster: 'The Guide',
    cutthroat: 'The Cutthroat',
    dreadnought: 'The Lorewarden',
    mystic: 'The Mystic',
    archivist: 'The Archivist',
    hearth_keeper: 'The Hearth-Keeper',
    minimalist: 'The Minimalist',
    muse: 'The Muse',
};

// Import all persona markdown files as raw strings
const personaFiles = import.meta.glob('../../personas/*.md', { as: 'raw', eager: true });

/**
 * Load persona instructions from imported markdown content
 */
function loadPersonaFromFile(filename: string): string {
    try {
        // Construct the key that matches import.meta.glob
        const key = `../../personas/${filename}`;
        const content = personaFiles[key];

        if (!content) {
            console.warn(`Persona file not found: ${filename}`);
            return `Persona instructions not found in ${filename}`;
        }

        // Find the "Default Instructions (Persona Text):" marker
        const markerIndex = content.indexOf('**Default Instructions (Persona Text):**');

        if (markerIndex === -1) {
            console.warn(`Could not find instructions marker in ${filename}`);
            return `Persona instructions not found in ${filename}`;
        }

        // Extract everything after the marker
        // Skip the marker line and the blank line after it
        const afterMarker = content.substring(markerIndex);
        const lines = afterMarker.split('\n');

        // Skip the first 2 lines (marker and blank line)
        // Then take everything until the end
        const instructions = lines.slice(2).join('\n').trim();

        return instructions;
    } catch (error) {
        console.error(`Failed to load persona from ${filename}:`, error);
        return `Error loading persona instructions from ${filename}`;
    }
}

/**
 * Default persona configurations
 * Instructions are loaded dynamically from markdown files in src/personas/
 * Each persona adds their own voice/style on top of the universal instructions
 */
export const PERSONA_DEFAULTS: Record<GmPersonaId, GmPersonaConfig> = {
    archivist: {
        id: 'archivist',
        defaultName: PERSONA_NAMES.archivist,
        defaultInstructions: loadPersonaFromFile(PERSONA_FILE_MAP.archivist),
    },
    cutthroat: {
        id: 'cutthroat',
        defaultName: PERSONA_NAMES.cutthroat,
        defaultInstructions: loadPersonaFromFile(PERSONA_FILE_MAP.cutthroat),
    },
    mystic: {
        id: 'mystic',
        defaultName: PERSONA_NAMES.mystic,
        defaultInstructions: loadPersonaFromFile(PERSONA_FILE_MAP.mystic),
    },
    trickster: {
        id: 'trickster',
        defaultName: PERSONA_NAMES.trickster,
        defaultInstructions: loadPersonaFromFile(PERSONA_FILE_MAP.trickster),
    },
    minimalist: {
        id: 'minimalist',
        defaultName: PERSONA_NAMES.minimalist,
        defaultInstructions: loadPersonaFromFile(PERSONA_FILE_MAP.minimalist),
    },
    hearth_keeper: {
        id: 'hearth_keeper',
        defaultName: PERSONA_NAMES.hearth_keeper,
        defaultInstructions: loadPersonaFromFile(PERSONA_FILE_MAP.hearth_keeper),
    },
    dreadnought: {
        id: 'dreadnought',
        defaultName: PERSONA_NAMES.dreadnought,
        defaultInstructions: loadPersonaFromFile(PERSONA_FILE_MAP.dreadnought),
    },
    muse: {
        id: 'muse',
        defaultName: PERSONA_NAMES.muse,
        defaultInstructions: loadPersonaFromFile(PERSONA_FILE_MAP.muse),
    },
};

/**
 * Get a persona's default configuration
 */
export function getPersonaDefault(id: GmPersonaId): GmPersonaConfig {
    return PERSONA_DEFAULTS[id];
}

/**
 * Get all available personas
 */
export function getAllPersonas(): GmPersonaConfig[] {
    return Object.values(PERSONA_DEFAULTS);
}
