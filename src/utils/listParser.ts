/**
 * List Parser Utilities
 * 
 * Provides flexible parsing of various list formats for table import.
 * Supports: numbered lists (1., 2., 3.), bullet lists (-, *), plain text
 */

import type { TableRow } from '../types/weave';

/**
 * Parse various list formats into array of strings
 * Supports: numbered lists (1., 2., 3.), bullet lists (-, *), plain text
 * 
 * @param text - The text to parse
 * @returns Array of parsed list items
 */
export function parseList(text: string): string[] {
  // Trim and normalize line endings
  const normalizedText = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Always return an array to prevent runtime errors
  if (lines.length === 0) {
    return [];
  }

  // Try numbered list format first (e.g., "1. Item", "2. Item", etc.)
  const numberedItems: string[] = [];
  const numberedPattern = /^\d+\.\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(numberedPattern);
    if (match) {
      numberedItems.push(match[1].trim());
    }
  }

  // If most lines match numbered pattern, use numbered items
  if (numberedItems.length >= lines.length * 0.8) {
    return numberedItems;
  }

  // Try bullet list format (e.g., "- Item", "* Item", "• Item")
  const bulletItems: string[] = [];
  const bulletPattern = /^[-*•]\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(bulletPattern);
    if (match) {
      bulletItems.push(match[1].trim());
    }
  }

  // If most lines match bullet pattern, use bullet items
  if (bulletItems.length >= lines.length * 0.8) {
    return bulletItems;
  }

  // Fallback: treat all non-empty lines as items (always return array)
  return lines;
}

/**
 * Convert list items to table rows with auto-numbering
 * 
 * @param items - Array of list item strings
 * @param maxRoll - Maximum roll value for the table (optional, defaults to item count)
 * @returns Array of TableRows with auto-numbered ranges
 */
export function listToTableRows(
  items: string[],
  maxRoll?: number
): TableRow[] {
  if (items.length === 0) {
    return [];
  }

  const effectiveMaxRoll = maxRoll ?? items.length;
  const rows: TableRow[] = [];

  // Calculate range size for each item
  const rangeSize = Math.floor(effectiveMaxRoll / items.length);
  const remainder = effectiveMaxRoll % items.length;

  let currentFloor = 1;

  for (let i = 0; i < items.length; i++) {
    // Distribute remainder across first few items
    const extra = i < remainder ? 1 : 0;
    const currentCeiling = currentFloor + rangeSize - 1 + extra;

    rows.push({
      floor: currentFloor,
      ceiling: currentCeiling,
      resultType: 'text',
      result: items[i],
      weight: 1,
    });

    currentFloor = currentCeiling + 1;
  }

  return rows;
}

/**
 * Detect the format of a list text
 * 
 * @param text - The text to analyze
 * @returns The detected format: 'numbered', 'bullet', or 'plain'
 */
export function detectListFormat(text: string): 'numbered' | 'bullet' | 'plain' {
  const lines = text.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);

  if (lines.length === 0) {
    return 'plain';
  }

  let numberedCount = 0;
  let bulletCount = 0;

  const numberedPattern = /^\d+\.\s/;
  const bulletPattern = /^[-*•]\s/;

  for (const line of lines) {
    if (numberedPattern.test(line)) numberedCount++;
    if (bulletPattern.test(line)) bulletCount++;
  }

  if (numberedCount >= lines.length * 0.8) return 'numbered';
  if (bulletCount >= lines.length * 0.8) return 'bullet';
  return 'plain';
}

/**
 * Convert list items to d66 table rows
 * d66 = 2d6 (first die is 10s, second die is 1s)
 * Creates 6 rows: 11-16, 21-26, 31-36, 41-46, 51-56, 61-66
 * 
 * @param items - Array of list item strings
 * @returns Array of TableRows with d66 roll ranges
 */
export function listToD66Rows(items: string[]): TableRow[] {
  const rows: TableRow[] = [];
  const maxTens = Math.min(6, items.length);
  
  for (let tens = 1; tens <= maxTens; tens++) {
    rows.push({
      floor: tens * 10 + 1,
      ceiling: tens * 10 + 6,
      resultType: 'text',
      result: items[tens - 1] || '',
      weight: 1,
    });
  }
  
  return rows;
}

/**
 * Convert list items to d88 table rows
 * d88 = 2d8 (first die is 10s, second die is 1s)
 * Creates 8 rows: 11-18, 21-28, 31-38, 41-48, 51-58, 61-68, 71-78, 81-88
 * 
 * @param items - Array of list item strings
 * @returns Array of TableRows with d88 roll ranges
 */
export function listToD88Rows(items: string[]): TableRow[] {
  const rows: TableRow[] = [];
  const maxTens = Math.min(8, items.length);
  
  for (let tens = 1; tens <= maxTens; tens++) {
    rows.push({
      floor: tens * 10 + 1,
      ceiling: tens * 10 + 8,
      resultType: 'text',
      result: items[tens - 1] || '',
      weight: 1,
    });
  }
  
  return rows;
}
