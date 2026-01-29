// ─────────────────────────────────────────────────────────────────────────────
// Thread Editor Types
// ─────────────────────────────────────────────────────────────────────────────

export type ThreadType =
    | 'dice'
    | 'oracle'
    | 'ai'
    | 'user'
    | 'system'
    | 'clock'
    | 'track';

export const THREAD_TYPES: ThreadType[] = [
    'dice', 'oracle', 'ai', 'user', 'system', 'clock', 'track'
];
