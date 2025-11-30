/**
 * Tag utility functions for the tagging system.
 * 
 * Tags are stored internally without the # prefix, but displayed with it.
 * Tags are case-insensitive and support hierarchical paths with /.
 */

/**
 * Normalizes a tag for storage and comparison.
 * - Removes # prefix if present
 * - Converts to lowercase
 * - Trims whitespace
 */
export function normalizeTag(tag: string): string {
    return tag.replace(/^#/, '').toLowerCase().trim();
}

/**
 * Formats a tag for display by adding # prefix.
 */
export function formatTag(tag: string): string {
    const normalized = normalizeTag(tag);
    return `#${normalized}`;
}

/**
 * Extracts inline tags from markdown content.
 * Matches patterns like: #simple, #nested/tag, #session/01
 * 
 * @param markdown - The markdown content to search
 * @returns Array of normalized tag strings (without # prefix)
 */
export function extractInlineTags(markdown: string): string[] {
    // Match #tag patterns
    // Supports: letters, numbers, underscores, hyphens, forward slashes
    const regex = /#([a-zA-Z0-9_/-]+)/g;
    const matches = [...markdown.matchAll(regex)];
    return matches.map(m => normalizeTag(m[0]));
}

/**
 * Deduplicates and normalizes an array of tags.
 * 
 * @param tags - Array of tags (may contain duplicates, mixed case, with/without #)
 * @returns Deduplicated array of normalized tags
 */
export function deduplicateTags(tags: string[]): string[] {
    const normalized = tags.map(normalizeTag);
    return [...new Set(normalized)];
}

/**
 * Validates a tag string.
 * Tags must contain only letters, numbers, underscores, hyphens, and forward slashes.
 * 
 * @param tag - The tag to validate
 * @returns True if valid, false otherwise
 */
export function isValidTag(tag: string): boolean {
    const normalized = normalizeTag(tag);
    if (normalized.length === 0) return false;
    return /^[a-z0-9_/-]+$/.test(normalized);
}

/**
 * Gets the prefix (parent) of a hierarchical tag.
 * For example: "faction/ravens" -> "faction"
 * Returns null if no prefix exists.
 */
export function getTagPrefix(tag: string): string | null {
    const normalized = normalizeTag(tag);
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === -1) return null;
    return normalized.substring(0, lastSlash);
}

/**
 * Gets all prefixes of a hierarchical tag.
 * For example: "faction/ravens/leader" -> ["faction", "faction/ravens"]
 */
export function getTagPrefixes(tag: string): string[] {
    const normalized = normalizeTag(tag);
    const parts = normalized.split('/');
    const prefixes: string[] = [];

    for (let i = 1; i < parts.length; i++) {
        prefixes.push(parts.slice(0, i).join('/'));
    }

    return prefixes;
}

/**
 * Checks if a tag matches a prefix pattern.
 * For example: matchesPrefix("faction/ravens", "faction") -> true
 */
export function matchesPrefix(tag: string, prefix: string): boolean {
    const normalizedTag = normalizeTag(tag);
    const normalizedPrefix = normalizeTag(prefix);

    return normalizedTag === normalizedPrefix ||
        normalizedTag.startsWith(normalizedPrefix + '/');
}
