/**
 * MarkdownExporter - Utility for exporting tables as formatted markdown
 */

import type { Table, ResultValue } from '../../../types/weave';

/**
 * Converts a table to markdown format
 */
export function exportTableToMarkdown(table: Table): string {
    const lines: string[] = [];

    // Header section
    lines.push(`# ${table.name}`);
    lines.push('');

    // Metadata section
    const metadata: string[] = [];

    if (table.category) {
        metadata.push(`**Category:** ${table.category}`);
    }

    if (table.tags && table.tags.length > 0) {
        metadata.push(`**Tags:** ${table.tags.join(', ')}`);
    }

    metadata.push(`**Roll Range:** 1-${table.maxRoll}`);

    if (table.tableType) {
        metadata.push(`**Type:** ${table.tableType}`);
    }

    if (metadata.length > 0) {
        lines.push(metadata.join('  \n'));
        lines.push('');
    }

    // Description section
    if (table.description && table.description.trim()) {
        lines.push(table.description.trim());
        lines.push('');
    }

    // Table section
    const headers = table.headers && table.headers.length > 0 ? table.headers : ['ROLL', 'RESULT'];

    // Create markdown table header
    lines.push(`| ${headers.join(' | ')} |`);
    lines.push(`| ${headers.map(() => '---').join(' | ')} |`);

    // Add table rows
    for (const row of table.tableData) {
        const rollRange = formatRollRange(row.floor, row.ceiling);
        const result = formatResult(row.result, row.resultType);
        lines.push(`| ${rollRange} | ${result} |`);
    }

    return lines.join('\n');
}

/**
 * Formats roll range as a string
 */
function formatRollRange(floor: number, ceiling: number): string {
    if (floor === ceiling) {
        return floor.toString();
    }
    return `${floor}-${ceiling}`;
}

/**
 * Formats result value based on type
 */
function formatResult(result: ResultValue, resultType: string): string {
    if (resultType === 'object' && typeof result === 'object' && result !== null) {
        // Format object as JSON code block
        const json = JSON.stringify(result, null, 2);
        // Escape pipe characters in JSON to avoid breaking markdown table
        const escaped = json.replace(/\|/g, '\\|');
        return `\`\`\`json\n${escaped}\n\`\`\``;
    }

    // For text and table reference types, convert to string
    const resultStr = String(result);
    // Escape pipe characters to avoid breaking markdown table
    return resultStr.replace(/\|/g, '\\|');
}

/**
 * Sanitizes a table name for use as a filename
 */
function sanitizeFilename(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

/**
 * Triggers a download of the table as a markdown file
 */
export function downloadMarkdown(table: Table, filename?: string): void {
    const markdown = exportTableToMarkdown(table);
    const safeFilename = filename || `${sanitizeFilename(table.name)}.md`;

    // Create a blob with the markdown content
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });

    // Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
