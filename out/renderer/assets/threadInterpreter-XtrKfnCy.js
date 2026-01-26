import { U as UNIVERSAL_GM_INSTRUCTIONS, u as useSettingsStore, g as getPersonaDefault, c as callAi } from "./index-CTdfhhBW.js";
import "uuid";
function buildInterpretationPrompt(threadContent, threadSummary, persona) {
  const messages = [];
  messages.push({
    role: "system",
    content: UNIVERSAL_GM_INSTRUCTIONS
  });
  messages.push({
    role: "system",
    content: persona.instructions
  });
  const taskPrompt = `# Thread Interpretation

You are interpreting a Thread result from the game world.

**Thread Summary:**
${threadSummary}

**Roll Details:**
${threadContent}

---

Your task:
Interpret this thread result into an evocative, in-world scene description.

- Follow your persona's style and universal GM instructions.
- Provide your interpretation in standard two-section format:
  - **Content:** Your exploratory first pass
  - **Result:** Your final, refined interpretation

Do not include any meta-commentary, dice numbers, or table names in your narration.`;
  messages.push({
    role: "user",
    content: taskPrompt
  });
  return messages;
}
async function interpretThread(thread) {
  const settings = useSettingsStore.getState().settings;
  const aiConfig = settings.ai;
  if (!aiConfig.apiKey) {
    throw new Error("AI API Key not configured");
  }
  const activePersonaId = aiConfig.activePersonaId || "trickster";
  const defaultPersona = getPersonaDefault(activePersonaId);
  const effectivePersona = {
    id: activePersonaId,
    name: defaultPersona.defaultName,
    instructions: defaultPersona.defaultInstructions
    // userInstructions could be merged here
  };
  const messages = buildInterpretationPrompt(
    thread.content || thread.summary,
    thread.summary,
    effectivePersona
  );
  const response = await callAi(
    aiConfig.uri || "https://api.openai.com/v1/chat/completions",
    aiConfig.apiKey,
    aiConfig.model || "gpt-4o-mini",
    messages
  );
  return {
    id: `interp_${Date.now()}`,
    personaId: effectivePersona.id,
    personaName: effectivePersona.name,
    content: response.content,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    status: "pending"
  };
}
export {
  interpretThread
};
