function updateThreadInContent(content, threadId, updates) {
  const blockRegex = /```(thread-card|result-card)\s*([\s\S]*?)\s*```/g;
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    try {
      const jsonStr = match[2];
      const data = JSON.parse(jsonStr);
      if (data.id === threadId || data.timestamp === threadId) {
        const fullMatch = match[0];
        const newData = { ...data };
        if (!newData.payload) newData.payload = {};
        if (updates.clock) {
          newData.payload.clock = { ...newData.payload.clock, ...updates.clock };
          if (newData.summary.startsWith('Clock "')) {
            const c = newData.payload.clock;
            newData.summary = `Clock "${c.name}" (${c.filled}/${c.segments})`;
          }
        }
        if (updates.track) {
          newData.payload.track = { ...newData.payload.track, ...updates.track };
          if (newData.summary.startsWith('Track "')) {
            const t = newData.payload.track;
            newData.summary = `Track "${t.name}" (${t.filled}/${t.segments})`;
          }
        }
        const newJson = JSON.stringify(newData, null, 2);
        const newBlock = `\`\`\`${match[1]}
${newJson}
\`\`\``;
        return content.replace(fullMatch, newBlock);
      }
    } catch (e) {
    }
  }
  return null;
}
export {
  updateThreadInContent
};
