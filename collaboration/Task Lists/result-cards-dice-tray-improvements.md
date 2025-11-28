# Result Cards & Dice Tray Improvements

## Task List

### ResultCard Component Improvements

1. **Update ResultCard header colors to use dark tints**
   - Dice: #222244
   - Table/Environment: #224422
   - Oracle: #442222
   - Interpretation/AI: #442244
   - Header text: #eeffff
   - Subtext/timestamp: #eeffff at 70% opacity

2. **Add timestamp display to ResultCard header**
   - Position: right side of header row
   - Format: Time display with 70% opacity

3. **Restructure ResultCard layout**
   - Header row (clickable toggle)
   - Collapsible content section (middle)
   - Footer with large result value (always visible)
   - Use `flex flex-col justify-between` for layout

4. **Implement collapse/expand behavior**
   - Add smooth height/opacity transition
   - Click header to toggle content visibility
   - Animate transitions for smooth UX

5. **Set default collapse states**
   - History cards: collapsed by default
   - Last Result card: expanded by default

### Results Pane Layout Fixes

6. **Fix Results pane ordering**
   - History list: oldest at top, newest at bottom
   - Ensure newest result appears both in history and Last Result card

7. **Add spacing between ResultCards**
   - Use `space-y-2` (~8px between cards)

8. **Restructure Results pane layout**
   - Scrollable history section (flex-1 overflow-y-auto)
   - Horizontal divider (1px)
   - Last Result footer (anchored at bottom)

9. **Add global scrollbar styles**
   - Width: 6px
   - Track: #020617 (very dark)
   - Thumb: #1f2937 (dark slate)
   - Apply to body and .app-scroll class

### Dice Engine Improvements

10. **Update dice parser to handle implicit 1dX**
    - Accept "d4" as "1d4"
    - Regex: `/(\d*)d(\d+)/gi` with empty string defaulting to 1

11. **Add trailing operator stripping**
    - Strip trailing +/- before parsing
    - Example: `d4+d6+` becomes `1d4+1d6`

12. **Improve error handling**
    - Return clear error messages for invalid expressions
    - No silent failures or 0 results

### Dice Tray UI Redesign

13. **Redesign DiceTool layout to match screenshot**
    - Dice tray section with geometric icons
    - Expression input below
    - Action buttons at bottom

14. **Create geometric dice icon components**
    - d4: Triangle
    - d6: Square
    - d8: Diamond
    - d10: Pentagon
    - d12: Hexagon
    - d20: Icosahedron/Circle
    - d100: Percentage symbol
    - Use Lucide icons or custom SVG

15. **Add modifier and placeholder buttons**
    - -1 button
    - +1 button
    - DIS button (placeholder, not wired)
    - ADV button (placeholder, not wired)

16. **Update expression input styling**
    - Match screenshot appearance
    - Dark background with proper borders

### Testing

17. **Test end-to-end flow**
    - Roll dice expressions
    - Verify correct header colors by source type
    - Test collapse/expand animations
    - Verify ordering (oldest to newest)
    - Check Last Result card updates correctly
    - Validate scrollbar appearance

## Notes

- The screenshot shows the target layout for the Dice Tray
- DIS/ADV/challenge notation buttons are UI-only for now (not wired to functionality)
- Click-to-reuse feature is deferred
- All dice buttons should use the established IconButton theme and behaviors
- Use Lucide icons where available
