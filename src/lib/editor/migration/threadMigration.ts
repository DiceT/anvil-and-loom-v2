import { ThreadModel } from '../../../types/tapestry';
import { threadToMarkdown } from '../generators/threadMarkdownGenerator';

// ─────────────────────────────────────────────────────────────────────────────
// Regex to match old JSON thread cards
// ─────────────────────────────────────────────────────────────────────────────

// Matches: ```thread-card or ```result-card ... content ... ```
const OLD_THREAD_REGEX = /```(?:thread-card|result-card)\n([\s\S]*?)\n```/g;

// ─────────────────────────────────────────────────────────────────────────────
// Migrate Old Thread Format to New
// ─────────────────────────────────────────────────────────────────────────────

export function migrateThreadsInMarkdown(markdown: string): string {
    if (!markdown) return '';

    return markdown.replace(OLD_THREAD_REGEX, (match, jsonContent) => {
        try {
            const threadData = JSON.parse(jsonContent) as ThreadModel;

            // Convert to new Thread format used by generator
            const thread = {
                id: threadData.id,
                timestamp: threadData.timestamp,
                header: threadData.source || 'Thread',
                result: threadData.summary || '',
                content: threadData.content || '',
                source: threadData.type,
                meta: threadData.payload,
            };

            return threadToMarkdown(thread);
        } catch (e) {
            console.error('Failed to migrate thread:', e);
            // Return original if migration fails
            return match;
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Check if Markdown Contains Old Threads
// ─────────────────────────────────────────────────────────────────────────────

export function hasOldThreadFormat(markdown: string): boolean {
    return OLD_THREAD_REGEX.test(markdown);
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch Migration Helper (can be used by a script or UI action)
// ─────────────────────────────────────────────────────────────────────────────

export async function migrateTapestryThreads(
    tapestryPath: string,
    readFile: (path: string) => Promise<string>,
    writeFile: (path: string, content: string) => Promise<void>,
    listFiles: (dir: string) => Promise<string[]>
): Promise<{ migrated: number; failed: string[] }> {
    const files = await listFiles(tapestryPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    let migrated = 0;
    const failed: string[] = [];

    for (const file of mdFiles) {
        try {
            const content = await readFile(file);

            if (hasOldThreadFormat(content)) {
                const migratedContent = migrateThreadsInMarkdown(content);
                await writeFile(file, migratedContent);
                migrated++;
            }
        } catch (e) {
            console.error(`Failed to migrate ${file}:`, e);
            failed.push(file);
        }
    }

    return { migrated, failed };
}
