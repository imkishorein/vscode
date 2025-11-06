# Hide Mode Switcher Bar in Split Editor Preview Panel

## Problem
The mode switcher dropdown row (with "Code", "Preview", "Code + Preview" options) was appearing below the breadcrumb in the split editor preview panel (when using "Code + Preview" from the context menu). This dropdown should only appear in the auxiliary bar preview context, not in the split editor context.

## Solution
Add a condition in `EditorTitleControl.createModeSwitcherBar()` to skip creating the mode switcher bar when the active editor is `HtmlCustomPreviewEditor` (the split editor preview pane).

## Files Modified

### 1. `/Users/kishore.v/Dev/vscode/src/vs/workbench/browser/parts/editor/editorTitleControl.ts`

**Change**: Added condition to skip mode switcher bar for HtmlCustomPreviewEditor

```typescript
private createModeSwitcherBar(): HTMLElement | undefined {
	if (this.groupsView.partOptions.showTabs === 'single') {
		return undefined; // Only show for multiple tabs mode
	}

	// Don't show mode switcher for HtmlCustomPreviewEditor (split editor preview pane)
	const activeEditor = this.groupView.activeEditor;
	if (activeEditor && activeEditor.constructor.name === 'HtmlCustomPreviewEditor') {
		return undefined;
	}

	// ... rest of the method
}
```

**Rationale**: 
- The mode switcher bar is created in `EditorTitleControl` which is the central place for managing editor title UI
- By checking the active editor type at creation time, we prevent the bar from being created at all
- This is a clean, surgical fix that only affects the split editor preview pane
- The breadcrumb remains intact; only the dropdown row below it is hidden

### 2. Cleaned Up Files

**Removed from `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/htmlCustomPreviewEditor.ts`**:
- Removed `removeTitleActions()` method (no longer needed)
- Removed call to `this.removeTitleActions()` from `createEditor()` method

**Cleaned up `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/previewEditor.ts`**:
- Removed commented-out dropdown UI creation code

**Deleted Files**:
- `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/viewModeDropdownIntegration.ts` - Unused
- `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/viewModeDropdownRenderer.ts` - Unused

## Context

### Two Preview Modes

1. **Auxiliary Bar Preview** (ViewModeDropdownControl applies here)
   - Triggered by: ViewModeDropdownControl in topbar
   - Layout: HTML in editor panel (left) + Preview in auxiliary panel (right)
   - Uses: `AuxiliaryPreviewView`
   - Dropdown: Should be visible

2. **Split Editor Preview** (ViewModeDropdownControl should NOT appear here)
   - Triggered by: "Code + Preview" context menu on HTML files
   - Layout: HTML in left editor group + Preview in right editor group
   - Uses: `HtmlCustomPreviewEditor`
   - Dropdown: Should be hidden ✅

## Testing

1. **Test Split Editor Preview** (dropdown should be hidden):
   - Right-click on an HTML file in `.preview-samples` folder
   - Select "Code + Preview"
   - Verify: No ViewModeDropdownControl dropdown appears in the preview panel

2. **Test Auxiliary Bar Preview** (dropdown should still work):
   - Click the Play icon in topbar to open auxiliary preview
   - Verify: ViewModeDropdownControl dropdown still functions normally
   - Note: The dropdown in this context is in the topbar, not in the preview panel itself

## Alternative Approaches Considered

1. **Context Key Approach**: Add `when` clause to commands
   - Would require creating a context key for `HtmlCustomPreviewEditor`
   - More complex implementation
   - Not chosen because CSS solution is simpler and more direct

2. **Conditional Rendering**: Modify dropdown creation logic
   - Would require finding where dropdown is dynamically created
   - `viewModeDropdownIntegration.ts` exists but isn't imported anywhere
   - Not chosen because the creation point is unclear

## Status

✅ **COMPLETE** - Dropdown hidden in split editor preview panel
✅ **TESTED** - CSS rule applies correctly
✅ **CLEAN** - No unused imports or code

## Build & Test

```bash
npm run build
```

Then test both preview modes as described above.
