# Table Creation and AI Entry Limit Changes

## Overview

This plan outlines two requested changes to the Weave table system:

1. **Table Creation Flow**: Remove predetermined rows and dice number during table creation. Determine dice number after all values are entered and Save is clicked. Create no rows on initial table creation.
2. **AI Entry Limit**: Increase the maximum number of AI-generated entries from 50 to 100.

---

## Change 1: Table Creation Flow Redesign

### Current Behavior

In [`CreateTableModal.tsx`](../src/components/weave/CreateTableModal.tsx:1):

- User selects initial rows setup (d6, d10, d20, or custom)
- Rows are pre-generated with empty results
- `maxRoll` is determined based on row count
- Table is created with pre-populated row structure

**Problem**: This forces users to commit to a dice type and row structure before they've entered any content.

### Desired Behavior

- User creates table with only metadata (name, description, category, tags)
- **No rows are created initially**
- `maxRoll` should be set to a default value (e.g., 20) or left for user to determine later
- User manually adds rows and fills in values
- When user clicks **Save** in the table editor, the system should:
  - Calculate the appropriate `maxRoll` based on the highest ceiling value in all rows
  - Update the table's `maxRoll` field
  - Save the table

### Implementation Plan

#### Step 1: Modify CreateTableModal.tsx

**Remove**:
- `initialRowsType` state and UI (lines 31, 121, 137)
- `customRowCount` state and UI (lines 32, 122, 138)
- `getRowCount()` function (lines 37-44)
- `getMaxRoll()` function (lines 46-48)
- Row generation logic in `handleCreate()` (lines 86-97)
- "Initial Rows Setup" section in UI (lines 264-336)

**Update** `handleCreate()` function:
```typescript
const handleCreate = async () => {
  if (!validateForm()) return;

  try {
    // Create table with NO initial rows
    const newTable = await createTable(category, {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      tableType: category,
      category,
      name: name.trim(),
      tags,
      description: description.trim(),
      maxRoll: 20, // Default value, will be recalculated on save
      headers: DEFAULT_HEADERS,
      tableData: [], // Empty - no rows initially
    });

    if (onCreate) {
      onCreate(newTable);
    }
    
    // Reset form
    setName('');
    setDescription('');
    setCategory('Uncategorized');
    setTags([]);
    setTagInput('');
    setValidationError('');
    
    onClose();
  } catch (err) {
    console.error('Failed to create table:', err);
  }
};
```

**Update** `handleClose()` function:
```typescript
const handleClose = () => {
  setName('');
  setDescription('');
  setCategory('Uncategorized');
  setTags([]);
  setTagInput('');
  setValidationError('');
  onClose();
};
```

#### Step 2: Modify WeaveTableEditor.tsx

**Update** `handleSave()` function to calculate `maxRoll`:
```typescript
const handleSave = async () => {
  if (!editedTable) return;
  
  try {
    // Calculate maxRoll based on highest ceiling value
    const highestCeiling = editedTable.tableData.reduce((max, row) => 
      Math.max(max, row.ceiling), 0
    );
    
    // Update maxRoll to match the highest ceiling
    const updatedTable = {
      ...editedTable,
      maxRoll: highestCeiling || 20, // Default to 20 if no rows
    };
    
    await saveTable(updatedTable);
    setTable(updatedTable);
    setEditedTable(updatedTable);
    setIsEditing(false);
  } catch (err) {
    console.error('Failed to save table:', err);
    alert('Failed to save table. Please try again.');
  }
};
```

**Update** `handleAddRow()` to use current `maxRoll`:
```typescript
const handleAddRow = () => {
  if (!editedTable) return;
  
  const newRow: TableRow = {
    floor: 1, // Default to 1, user will adjust
    ceiling: 1, // Default to 1, user will adjust
    resultType: 'text',
    result: '',
  };

  setEditedTable({
    ...editedTable,
    tableData: [...editedTable.tableData, newRow],
  });
};
```

**Consider adding**: An "Auto-Number Rows" button in the editor to help users distribute rows evenly across the roll range. This could be a future enhancement.

#### Step 3: Update Validation

The `validateTable()` function in [`WeaveTableEditor.tsx`](../src/components/weave/WeaveTableEditor.tsx:172) already checks for gaps and duplicate ranges. This should work well with the new flow.

**Add** validation warning for empty tables:
```typescript
const validateTable = (t: Table): string[] => {
  const warnings: string[] = [];
  
  // Check for empty table
  if (t.tableData.length === 0) {
    warnings.push('Table has no rows');
    return warnings;
  }
  
  // ... existing validation logic
};
```

---

## Change 2: AI Entry Limit Increase

### Current Behavior

In [`WeaveAIPanel.tsx`](../src/components/weave/WeaveTableEditor.tsx:1):

- **Fill Table** mode: Maximum of 50 entries (line 521)
- **Generate Table** mode: Maximum of 100 entries (line 455)

### Desired Behavior

- Both modes should support up to **100 entries**

### Implementation Plan

#### Step 1: Update WeaveAIPanel.tsx

**Change** line 521 from:
```tsx
max={50}
```
to:
```tsx
max={100}
```

**Update** the label to reflect the new limit (line 514):
```tsx
Number of Entries to Add (1-100)
```

#### Step 2: Update WeaveAIService.ts

No changes needed - the service already accepts any `rowCount` value passed to it.

#### Step 3: Consider Backend Validation (if applicable)

Check if there's any backend validation that limits row counts. Based on the code review, the Electron IPC handlers in [`electron/ipc/weaves.ts`](../electron/ipc/weaves.ts:1) don't appear to have row count limits.

---

## Testing Checklist

### Table Creation Flow

- [ ] Create new table - verify no rows are created
- [ ] Verify table opens in editor with empty tableData array
- [ ] Add first row manually - verify default floor/ceiling values
- [ ] Add multiple rows with custom floor/ceiling values
- [ ] Click Save - verify maxRoll is calculated correctly based on highest ceiling
- [ ] Reload table - verify maxRoll persists
- [ ] Verify table can still be rolled if ranges cover 1-maxRoll without gaps

### AI Entry Limit

- [ ] Open AI Panel in Fill Table mode
- [ ] Verify input field allows up to 100 entries
- [ ] Test generating 100 entries
- [ ] Verify all entries are added to table
- [ ] Verify table saves correctly with 100 entries

---

## User Experience Impact

### Positive Changes

1. **More Flexible Table Creation**: Users can now create tables without committing to a dice type upfront
2. **Better AI Support**: Users can generate larger tables (up to 100 entries) in a single operation
3. **Simpler Initial Flow**: Fewer decisions required when creating a new table

### Potential Concerns

1. **Learning Curve**: Users accustomed to the old flow may need guidance on how to add rows manually
2. **Manual Numbering**: Users will need to manually set floor/ceiling values for each row (or use a future auto-number feature)

### Mitigation

Consider adding:
- A tooltip or help text explaining the new flow
- An "Auto-Number Rows" button to distribute rows evenly
- A "Quick Add" feature that adds multiple rows with auto-numbering

---

## Files to Modify

1. [`src/components/weave/CreateTableModal.tsx`](../src/components/weave/CreateTableModal.tsx:1)
   - Remove initial rows setup UI and logic
   - Create tables with empty tableData array

2. [`src/components/weave/WeaveTableEditor.tsx`](../src/components/weave/WeaveTableEditor.tsx:1)
   - Update handleSave() to calculate maxRoll
   - Update handleAddRow() for better defaults

3. [`src/components/weave/WeaveAIPanel.tsx`](../src/components/weave/WeaveTableEditor.tsx:1)
   - Change max entries from 50 to 100 (line 521)

---

## Future Enhancements (Optional)

1. **Auto-Number Rows**: Button to distribute rows evenly across the roll range
2. **Smart Row Suggestions**: AI suggests appropriate floor/ceiling values based on content
3. **Roll Range Visualization**: Visual indicator showing which parts of 1-maxRoll are covered
4. **Template System**: Pre-defined table templates with common row structures
