# AI Fill Table System - List Format Fix

## Problem
The AI fill table system in WeaveAIService.ts is requesting JSON responses from the AI, but the AI is returning malformed JSON. The system should be configured to accept simple list formats instead, which the system already supports via the `listParser` utility.

## Solution
Modify all AI methods in WeaveAIService.ts to request list format responses instead of JSON. The system already has the `listParser` utility to handle various list formats (numbered, bullet, plain text).

## Changes Required

### 1. fillTable Method (Lines 236-342)

**Current Behavior:**
- Asks AI to return JSON with `newRows` array
- Has fallback to list parsing if JSON fails

**New Behavior:**
- Ask AI to return a simple numbered list of entries
- Parse the list directly using `parseList()`
- Convert list items to table rows using `listToTableRows()`

**New Prompt Structure:**
```
Add ${rowCount} more entries to this table.

Table Name: ${table.name}
Description: ${table.description || 'No description'}
Tags: ${table.tags.join(', ') || 'None'}
Die Type: d${table.maxRoll}

Current Table Contents:
${tableContent}

Please generate ${rowCount} new entries that:
1. Match the tone and theme of the existing entries
2. Fill in any gaps in the roll range if needed
3. Are distinct from existing entries (no duplicates)
4. Follow the same format and style

Format your response as a numbered list:
1. Entry text
2. Entry text
3. Entry text
...
```

**Response Parsing:**
```typescript
const items = parseList(response.content);
const newRows = listToTableRows(items, newMaxRoll);
```

### 2. generateTable Method (Lines 145-231)

**Current Behavior:**
- Asks AI to return JSON with `name`, `description`, `tags`, `maxRoll`, `tableData`
- Has fallback to list parsing if JSON fails

**New Behavior:**
- Ask AI to return a simple numbered list of entries
- Use prompt parameters for name, description, tags, maxRoll
- Parse the list directly using `parseList()`
- Convert list items to table rows using `listToTableRows()`

**New Prompt Structure:**
```
Generate a random table with ${rowCount} rows based on this description: "${prompt}"

The table should use a d${maxRoll} die (so the roll range is 1-${maxRoll}).
Distribute the ${rowCount} entries evenly across the range.

Please generate ${rowCount} entries that match the description.

Format your response as a numbered list:
1. Entry text
2. Entry text
3. Entry text
...
```

**Response Parsing:**
```typescript
const items = parseList(response.content);
const tableData = listToTableRows(items, maxRoll);
```

### 3. reviewTable Method (Lines 79-140)

**Current Behavior:**
- Asks AI to return JSON with `summary`, `tone`, `consistency`, `duplicates`, `suggestions`, `overallRating`

**New Behavior:**
- Ask AI to return a structured list format with labels
- Parse the labeled list to extract the required fields

**New Prompt Structure:**
```
Review this random table for quality, tone, consistency, and duplicates.

Table Name: ${table.name}
Description: ${table.description || 'No description'}
Tags: ${table.tags.join(', ') || 'None'}
Die Type: d${table.maxRoll}

Table Contents:
${tableContent}

Please provide:
1. A brief summary of what this table represents
2. Assessment of the tone (e.g., serious, humorous, dark, whimsical)
3. Assessment of consistency (are all entries thematically appropriate?)
4. List of any duplicates or near-duplicates
5. Suggestions for improvement
6. Overall rating (excellent, good, fair, or poor)

Format your response as:
Summary: [your summary]
Tone: [tone assessment]
Consistency: [consistency assessment]
Duplicates: [duplicate1, duplicate2, ...]
Suggestions: [suggestion1, suggestion2, ...]
Overall Rating: [excellent|good|fair|poor]
```

**Response Parsing:**
```typescript
const lines = response.content.trim().split('\n');
const result: TableReviewResult = {
  summary: extractField(lines, 'Summary:'),
  tone: extractField(lines, 'Tone:'),
  consistency: extractField(lines, 'Consistency:'),
  duplicates: extractListField(lines, 'Duplicates:'),
  suggestions: extractListField(lines, 'Suggestions:'),
  overallRating: extractField(lines, 'Overall Rating:') as any,
};
```

### 4. improveEntry Method (Lines 385-443)

**Current Behavior:**
- Asks AI to return JSON with `improvedText`, `explanation`

**New Behavior:**
- Ask AI to return a labeled format with improved text and explanation
- Parse the labeled format to extract the required fields

**New Prompt Structure:**
```
Review this specific table entry and suggest an improvement.

Table Name: ${table.name}
Description: ${table.description || 'No description'}

Table Contents:
${tableContent}

Target Entry (${entry.floor}-${entry.ceiling}):
${this.formatResult(entry.result)}

Please:
1. Analyze this entry in the context of the table
2. Suggest an improved version that better fits the theme
3. Explain why the improvement is better

Format your response as:
Improved: [improved entry text]
Explanation: [explanation of why this is better]
```

**Response Parsing:**
```typescript
const lines = response.content.trim().split('\n');
const result: EntryImprovementResult = {
  originalIndex: entryIndex,
  originalText: this.formatResult(entry.result),
  improvedText: extractField(lines, 'Improved:'),
  explanation: extractField(lines, 'Explanation:'),
};
```

## Helper Functions Needed

Add these helper functions to WeaveAIService.ts:

```typescript
/**
 * Extract a field value from a labeled list format
 */
private extractField(lines: string[], label: string): string {
  for (const line of lines) {
    if (line.startsWith(label)) {
      return line.substring(label.length).trim();
    }
  }
  return '';
}

/**
 * Extract a list field from a labeled list format (comma-separated)
 */
private extractListField(lines: string[], label: string): string[] {
  const value = this.extractField(lines, label);
  if (!value) return [];
  
  // Handle formats like: "item1, item2, item3" or "1. item1, 2. item2, 3. item3"
  const items = value.split(',').map(item => item.trim());
  return items.filter(item => item.length > 0);
}
```

## Implementation Order

1. Add helper functions (`extractField`, `extractListField`) to WeaveAIService.ts
2. Modify `fillTable` method to use list format
3. Modify `generateTable` method to use list format
4. Modify `reviewTable` method to use labeled list format
5. Modify `improveEntry` method to use labeled list format
6. Remove JSON parsing fallback logic (no longer needed)
7. Test all methods to ensure they work correctly

## Benefits

- More reliable AI responses (lists are simpler than JSON)
- Better compatibility with different AI models
- Leverages existing `listParser` utility
- Cleaner code without fallback logic
- Easier to debug and maintain
