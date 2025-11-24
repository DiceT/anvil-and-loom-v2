import { ipcMain } from 'electron';

// Stubbed in-memory Tapestry with fake entries
const stubbedTapestry = {
  name: 'My Campaign',
  children: [
    {
      name: 'session-01.md',
      type: 'file',
      path: '/session-01.md',
    },
    {
      name: 'session-02.md',
      type: 'file',
      path: '/session-02.md',
    },
    {
      name: 'lair.canvas.json',
      type: 'file',
      path: '/lair.canvas.json',
    },
    {
      name: 'notes',
      type: 'folder',
      path: '/notes',
      children: [
        {
          name: 'npc-ideas.md',
          type: 'file',
          path: '/notes/npc-ideas.md',
        },
      ],
    },
  ],
};

const stubbedEntries: Record<string, string> = {
  '/session-01.md': '# Session 1\n\nOur adventure begins...',
  '/session-02.md': '# Session 2\n\nThe party continues...',
  '/lair.canvas.json':
    '{"version":"1.0.0","nodes":[{"id":"1","type":"text","x":100,"y":100,"text":"Entrance"}]}',
  '/notes/npc-ideas.md': '# NPC Ideas\n\n- A mysterious wanderer\n- The innkeeper',
};

export function setupFileSystemHandlers() {
  ipcMain.handle('tapestry:getTree', async () => {
    return stubbedTapestry;
  });

  ipcMain.handle('tapestry:readEntry', async (_event, path: string) => {
    return stubbedEntries[path] || '';
  });

  ipcMain.handle(
    'tapestry:writeEntry',
    async (_event, path: string, content: string) => {
      stubbedEntries[path] = content;
      return { success: true };
    }
  );
}
