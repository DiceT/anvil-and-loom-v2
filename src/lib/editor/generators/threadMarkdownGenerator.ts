// ─────────────────────────────────────────────────────────────────────────────
// Thread Markdown Generators
// 
// IMPORTANT: Uses space-separated syntax: ::: thread <type> id:<id> timestamp:<ts>
// NOT the curly-brace syntax: :::thread{type="..."}
// ─────────────────────────────────────────────────────────────────────────────

import { ThreadType } from '../types/threadTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ThreadMarkdownOptions {
  id: string;
  type: ThreadType;
  header: string;
  meta?: string;      // Pre-formatted string, NOT an object
  result?: string;
  content?: string;
}

export interface DiceThreadOptions {
  id: string;
  expression: string;
  rolls: number[];
  total: number;
  dc?: number;
  success?: boolean;
}

export interface OracleThreadOptions {
  id: string;
  tableName: string;
  results: Array<{ table: string; roll: number; result: string }>;
  finalResult: string;
}

export interface AiThreadOptions {
  id: string;
  persona?: string;
  interpretation: string;
}

export interface UserThreadOptions {
  id: string;
  input: string;
  source?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateThreadId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateThreadMarkdown(options: ThreadMarkdownOptions): string {
  const {
    id = generateThreadId(),
    type,
    header,
    meta,
    result,
    content
  } = options;
  const timestamp = getTimestamp();

  // Use tid instead of id to avoid #id shorthand in remark-directive
  const directive = `:::thread{type="${type}" tid="${id}" timestamp="${timestamp}"}`;

  // Build body parts
  const parts: string[] = [];

  // Header (h4)
  parts.push(`#### ${header}`);

  // Meta in blockquote (if provided as formatted string)
  if (meta && meta.trim()) {
    const metaLines = meta.split('\n').map(line => `> ${line}`).join('\n');
    parts.push(metaLines);
  }

  // Result in bold
  if (result && result.trim()) {
    parts.push(`**${result}**`);
  }

  // Additional content
  if (content && content.trim()) {
    parts.push(content);
  }

  // Combine with proper spacing
  const body = parts.join('\n\n');

  // Return complete thread block - closing ::: on its own line
  return `\n${directive}\n${body}\n:::`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dice Thread Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateDiceThreadMarkdown(options: DiceThreadOptions): string {
  const { id, expression, rolls, total, dc, success } = options;

  // Build header
  let header = `🎲 Dice: ${expression}`;
  if (dc !== undefined) {
    const icon = success ? '✅' : '❌';
    header += ` | DC ${dc} ${icon}`;
  }

  // Build meta (formatted, not JSON)
  const metaLines: string[] = [];
  metaLines.push(`Expression: ${expression}`);
  metaLines.push(`Rolls: [${rolls.join(', ')}]`);
  const meta = metaLines.join('\n');

  // Build result
  let result: string;
  if (dc !== undefined) {
    const status = success ? 'SUCCESS' : 'FAILURE';
    result = `${total} vs DC ${dc} → ${status}`;
  } else {
    result = `Total: ${total}`;
  }

  return generateThreadMarkdown({
    id,
    type: 'dice',
    header,
    meta,
    result,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Oracle Thread Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateOracleThreadMarkdown(options: OracleThreadOptions): string {
  const { id, tableName, results, finalResult } = options;

  // Build header
  const header = `🎴 Oracle: ${tableName}`;

  // Build meta from results chain
  let meta = '';
  if (results && results.length > 0) {
    const resultLines = results.map(r => `${r.table}: ${r.result} (${r.roll})`);
    meta = resultLines.join('\n');
  }

  return generateThreadMarkdown({
    id,
    type: 'oracle',
    header,
    meta,
    result: finalResult,
  });
}

// Simpler oracle generator for basic table rolls
export function generateSimpleOracleMarkdown(
  id: string,
  tableName: string,
  result: string
): string {
  return generateThreadMarkdown({
    id,
    type: 'oracle',
    header: `🎴 ${tableName}`,
    result,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Thread Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateAiThreadMarkdown(options: AiThreadOptions): string {
  const { id, persona = 'The Guide', interpretation } = options;

  return generateThreadMarkdown({
    id,
    type: 'ai',
    header: `✨ ${persona}`,
    content: interpretation,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// User Thread Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateUserThreadMarkdown(options: UserThreadOptions): string {
  const { id, input, source = 'Player' } = options;

  return generateThreadMarkdown({
    id,
    type: 'user',
    header: `📝 ${source}`,
    content: input,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Clock Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateClockMarkdown(
  id: string,
  name: string,
  segments: number,
  filled: number,
  description?: string
): string {
  const filledChar = '█';
  const emptyChar = '░';
  const visual = filledChar.repeat(filled) + emptyChar.repeat(Math.max(0, segments - filled));

  return generateThreadMarkdown({
    id,
    type: 'clock',
    header: `⏱ Clock: ${name} | ${filled}/${segments}`,
    meta: `[${visual}]`,
    content: description,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Track Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateTrackMarkdown(
  id: string,
  name: string,
  progress: number,
  total: number,
  difficulty?: string,
  description?: string
): string {
  const filledChar = '█';
  const emptyChar = '─';
  const visual = filledChar.repeat(progress) + emptyChar.repeat(Math.max(0, total - progress));

  let header = `📊 Track: ${name} | ${progress}/${total}`;
  if (difficulty) {
    header += ` | ${difficulty}`;
  }

  return generateThreadMarkdown({
    id,
    type: 'track',
    header,
    meta: `[${visual}]`,
    content: description,
  });
}
