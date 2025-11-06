# Split Preview Implementation

## Overview
Added a new "Code + Preview" context menu option that opens HTML files and their preview side-by-side in a split editor layout (50-50), independent from the existing ViewModeDropdownControl approach.

## Implementation Details

### New File Created
**`/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/htmlSplitPreviewAction.ts`**

### Key Features
1. **Context Menu Integration**: Right-click on any `.html` file in `.preview-samples` folder → "Code + Preview" option appears
2. **Split Editor Layout**: 
   - HTML file opens on the LEFT
   - Preview opens on the RIGHT
   - 50-50 split using `GroupsArrangement.EVEN`
3. **Independent Approach**: Does NOT modify or interfere with ViewModeDropdownControl or auxiliary panel
4. **Reuses Existing Components**: Uses `HtmlCustomPreviewEditor` without modifications

### How It Works

#### Step-by-Step Flow
1. User right-clicks on an HTML file in `.preview-samples` folder
2. Context menu shows "Code + Preview" option (with split horizontal icon)
3. When clicked:
   - Opens HTML file in current active editor group (LEFT)
   - Creates new editor group to the RIGHT
   - Opens preview in the new right group
   - Arranges both groups evenly (50-50 split)

#### Context Key Logic
```typescript
const isPreviewSampleHtmlFile = ContextKeyExpr.and(
    ResourceContextKey.Extension.isEqualTo('.html'),
    ContextKeyExpr.regex('resourcePath', /\.preview-samples/)
);
```
- Only shows for `.html` files
- Only shows for files in `.preview-samples` folder (including subdirectories)

### Technical Implementation

#### Command Registration
- **Command ID**: `workbench.action.htmlSplitPreview`
- **Menu**: `MenuId.ExplorerContext`
- **Group**: `5_cutcopypaste`
- **Order**: 3 (appears after other preview options)
- **Icon**: `Codicon.splitHorizontal`

#### Editor Group Management
```typescript
// Get active group
const activeGroup = editorGroupsService.activeGroup;

// Open HTML in active group (LEFT)
await editorService.openEditor({ resource: selectedResource }, activeGroup);

// Create new group to the RIGHT
const previewGroup = editorGroupsService.addGroup(activeGroup, GroupDirection.RIGHT);

// Open preview in new group (RIGHT)
const previewInput = instantiationService.createInstance(HtmlCustomPreviewEditorInput, selectedResource);
await editorService.openEditor(previewInput, { pinned: true }, previewGroup);

// Arrange groups evenly (50-50)
editorGroupsService.arrangeGroups(GroupsArrangement.EVEN);
```

### Files Modified

1. **`preview.contribution.ts`**
   - Added import: `import './htmlSplitPreviewAction.js';`
   - Registers the new action when preview feature loads

### Coexistence with Existing Features

✅ **ViewModeDropdownControl**: Unchanged, continues to work with auxiliary panel
✅ **Auxiliary Panel Preview**: Unchanged, continues to work independently
✅ **HtmlCustomPreviewEditor**: Reused without modifications
✅ **Context Menu**: New option added alongside existing "Preview" option

### Visual Result

#### Before (Context Menu)
```
Right-click on preview1.html:
├─ Open
├─ Open With...
├─ Preview (Cmd+Shift+V)
├─ Open with new Preview editor
└─ ...
```

#### After (Context Menu)
```
Right-click on preview1.html:
├─ Open
├─ Open With...
├─ Preview (Cmd+Shift+V)
├─ Open with new Preview editor
├─ Code + Preview ← NEW
└─ ...
```

#### Editor Layout After Click
```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   preview1.html     │   Preview           │
│   (HTML Code)       │   (Rendered)        │
│                     │                     │
│   LEFT (50%)        │   RIGHT (50%)       │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

### Testing Checklist

- [ ] Build VSCode successfully: `npm run build`
- [ ] Right-click on `.preview-samples/preview1.html`
- [ ] Verify "Code + Preview" option appears in context menu
- [ ] Click "Code + Preview"
- [ ] Verify HTML file opens on LEFT
- [ ] Verify preview opens on RIGHT
- [ ] Verify 50-50 split layout
- [ ] Test with other preview files (preview2.html, preview3.html, etc.)
- [ ] Verify auxiliary panel preview still works independently
- [ ] Verify ViewModeDropdownControl still works independently
- [ ] Test with files NOT in `.preview-samples` folder (option should NOT appear)

### Future Enhancements

- Add keyboard shortcut (currently no default keybinding)
- Add option to swap left/right positions
- Add option to adjust split ratio
- Add close synchronization (close HTML → close preview, and vice versa)

### Notes

- Uses `GroupsArrangement.EVEN` from memory reference for proper 50-50 split
- Does NOT affect sidebar width (only splits editor area)
- Both editors are pinned by default
- Works with any HTML file in `.preview-samples` folder
- Independent from all existing preview features

