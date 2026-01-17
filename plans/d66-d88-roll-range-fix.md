# d66 and d88 Table Roll Range Fix

## Problem
The AI fill table system uses [`listToTableRows()`](src/utils/listParser.ts:69) from [`listParser.ts`](src/utils/listParser.ts:1), which distributes entries evenly across the maxRoll range. This doesn't match the specific d66 and d88 die mechanics.

## Expected Behavior

### d66 (2d6 - first die is 10s, second die is 1s)
- 6 rows total
- Ranges: 11-16, 21-26, 31-36, 41-46, 51-56, 61-66
- Formula: `floor: tens * 10 + 1, ceiling: tens * 10 + 6`
- Where tens goes from 1 to 6

### d88 (2d8 - first die is 10s, second die is 1s)
- 8 rows total
- Ranges: 11-18, 21-28, 31-38, 41-48, 51-58, 61-68, 71-78, 81-88
- Formula: `floor: tens * 10 + 1, ceiling: tens * 10 + 8`
- Where tens goes from 1 to 8

## Current Issue
The [`listToTableRows()`](src/utils/listParser.ts:69) function uses uniform distribution:
```typescript
const rangeSize = Math.floor(effectiveMaxRoll / items.length);
const remainder = effectiveMaxRoll % items.length;
```

This creates evenly-sized ranges, not the specific d66/d88 pattern.

## Solution

Add new functions to [`listParser.ts`](src/utils/listParser.ts:1) to handle d66 and d88 specific mechanics:

```typescript
/**
 * Convert list items to d66 table rows
 * d66 = 2d6 (first die is 10s, second die is 1s)
 * Creates 6 rows: 11-16, 21-26, 31-36, 41-46, 51-56, 61-66
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
```

## Update WeaveAIService.ts

Modify [`generateTable()`](src/core/weave/WeaveAIService.ts:149) and [`fillTable()`](src/core/weave/WeaveAIService.ts:207) to use the new functions:

```typescript
// In generateTable():
let tableData: TableRow[];
if (maxRoll === 66) {
  tableData = listToD66Rows(items);
} else if (maxRoll === 88) {
  tableData = listToD88Rows(items);
} else {
  tableData = listToTableRows(items, maxRoll);
}

// In fillTable():
let newRows: TableRow[];
if (table.maxRoll === 66) {
  newRows = listToD66Rows(items);
} else if (table.maxRoll === 88) {
  newRows = listToD88Rows(items);
} else {
  // Use existing logic for other die types
  const rangeSize = Math.floor((newMaxRoll - nextFloor + 1) / items.length);
  const remainder = (newMaxRoll - nextFloor + 1) % items.length;
  // ... existing distribution logic
}
```

## Implementation Order

1. Add `listToD66Rows()` function to [`listParser.ts`](src/utils/listParser.ts:1)
2. Add `listToD88Rows()` function to [`listParser.ts`](src/utils/listParser.ts:1)
3. Update [`generateTable()`](src/core/weave/WeaveAIService.ts:149) to use new functions for d66/d88
4. Update [`fillTable()`](src/core/weave/WeaveAIService.ts:207) to use new functions for d66/d88
5. Test with d66 and d88 tables to verify correct roll ranges
