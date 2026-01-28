import { U as UNIVERSAL_GM_INSTRUCTIONS, a as useAiStore, g as getPersonaDefault, c as callAi } from "./index-B67ULY0K.js";
import "uuid";
function buildInterpretationPrompt(threadContent, threadSummary, persona, previousInterpretation) {
  const messages = [];
  messages.push({
    role: "system",
    content: UNIVERSAL_GM_INSTRUCTIONS
  });
  messages.push({
    role: "system",
    content: persona.instructions
  });
  let taskPrompt = `# Thread Interpretation

You are interpreting a Thread result from the game world.

**Thread Summary:**
${threadSummary}

**Roll Details (Header | Result):**
${threadContent}
`;
  if (previousInterpretation) {
    taskPrompt += `
**Previous Interpretation (Latest Development):**
${previousInterpretation}

**Instruction:**
Interpret this result as a continuation or evolution of the previous development.
`;
  }
  taskPrompt += `
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
  const aiConfig = useAiStore.getState().settings;
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
  const latestInterpretation = thread.aiInterpretations?.filter((i) => i.status === "accepted").sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  const messages = buildInterpretationPrompt(
    thread.content || thread.summary,
    thread.summary,
    effectivePersona,
    latestInterpretation?.content
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
