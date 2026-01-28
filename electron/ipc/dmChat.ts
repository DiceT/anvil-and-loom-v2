import { ipcMain } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'
import { Chat } from '../../src/types/dmChat'
import { readRegistry } from './tapestry'

export function registerDmChatHandlers() {

    // ─────────────────────────────────────────────────────────────────────────
    // Load all chats for a tapestry
    // ─────────────────────────────────────────────────────────────────────────

    ipcMain.handle('dmChat:loadChats', async (event, tapestryId: string) => {
        const tapestryPath = await getTapestryPath(tapestryId)
        if (!tapestryPath) return []

        const chatsDir = path.join(tapestryPath, '.ai-history')

        try {
            await fs.mkdir(chatsDir, { recursive: true })
            const files = await fs.readdir(chatsDir)
            const chatFiles = files.filter(f => f.endsWith('.json'))

            const chats: Chat[] = []
            for (const file of chatFiles) {
                const content = await fs.readFile(path.join(chatsDir, file), 'utf-8')
                chats.push(JSON.parse(content))
            }

            // Sort by updatedAt descending
            chats.sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )

            return chats
        } catch (error) {
            console.error('Failed to load chats:', error)
            return []
        }
    })

    // ─────────────────────────────────────────────────────────────────────────
    // Save a chat
    // ─────────────────────────────────────────────────────────────────────────

    ipcMain.handle('dmChat:saveChat', async (event, tapestryId: string, chat: Chat) => {
        console.log('[IPC] dmChat:saveChat called', { tapestryId, chatId: chat.id })
        const tapestryPath = await getTapestryPath(tapestryId)
        if (!tapestryPath) {
            console.error('[IPC] dmChat:saveChat: Tapestry path not found for ID:', tapestryId)
            return false
        }

        const chatsDir = path.join(tapestryPath, '.ai-history')

        try {
            await fs.mkdir(chatsDir, { recursive: true })
            const filePath = path.join(chatsDir, `${chat.id}.json`)
            await fs.writeFile(filePath, JSON.stringify(chat, null, 2))
            console.log('[IPC] dmChat:saveChat: Saved to', filePath)
            return true
        } catch (error) {
            console.error('[IPC] Failed to save chat:', error)
            return false
        }
    })

    // ─────────────────────────────────────────────────────────────────────────
    // Delete a chat
    // ─────────────────────────────────────────────────────────────────────────

    ipcMain.handle('dmChat:deleteChat', async (event, tapestryId: string, chatId: string) => {
        const tapestryPath = await getTapestryPath(tapestryId)
        if (!tapestryPath) return false

        const filePath = path.join(tapestryPath, '.ai-history', `${chatId}.json`)

        try {
            await fs.unlink(filePath)
            return true
        } catch (error) {
            console.error('Failed to delete chat:', error)
            return false
        }
    })
}

// Helper to get tapestry path from ID
async function getTapestryPath(tapestryId: string): Promise<string | null> {
    const registry = await readRegistry()
    const tapestry = registry.tapestries.find(t => t.id === tapestryId)
    return tapestry ? tapestry.path : null
}
