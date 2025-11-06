# Current Status and Solution Path

## What's Working ✅
1. Dropdown button appears in editor title bar
2. Button shows "Code" label
3. Dropdown opens with 3 options
4. Actions execute when selected (confirmed by console logs)
5. Mode switching logic works

## What's Not Working ❌
- Button label doesn't update after selecting different options
- Always shows "Code" regardless of selection

## Root Cause Analysis

### The Problem
The `DropdownWithDefaultActionViewItem.update()` method isn't being called when actions execute.

### Why This Happens
From the source code (menuEntryActionViewItem.ts:479-483):
```typescript
this._register(this._dropdown.actionRunner.onDidRun((e: IRunEvent) => {
    if (e.action instanceof MenuItemAction) {
        this.update(e.action);
    }
}));
```

The update only happens if:
1. The action runs through the dropdown's action runner
2. The action is a `MenuItemAction` instance

### Current Hypothesis
Our actions ARE MenuItemAction instances (VSCode wraps Action2 automatically), but something about the action runner chain might be preventing the `onDidRun` event from firing with the correct action.

## Latest Changes
Added `f1: false` to all actions to ensure they're only menu items and not command palette entries. This might affect how VSCode wraps them.

## Testing Instructions

### Rebuild and Test
```bash
npm run watch
./scripts/code.sh
```

### In Browser Console
1. Open DevTools (`Cmd+Option+I`)
2. Select "Preview" from dropdown
3. Check console output - should show:
   ```
   [PreviewMode] Switching to Preview mode
   [PreviewMode] Action ID: workbench.action.previewMode.preview
   [PreviewMode] Action title: [object Object]
   ```

### Check Storage
In browser console:
```javascript
// Check if storage key exists
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('PreviewMode')) {
        console.log('Found key:', key, '=', localStorage.getItem(key));
    }
}
```

Expected key: `PreviewModeSubmenu_lastActionId`

## Potential Solutions

### Solution 1: Force Button Re-render (Hack)
Add code to manually trigger button update after action execution:
```typescript
async run(accessor: ServicesAccessor): Promise<void> {
    // ... existing code ...
    
    // Force UI update
    setTimeout(() => {
        // Trigger re-render
    }, 0);
}
```

### Solution 2: Use Different Menu Pattern
Instead of Action2, use MenuRegistry directly:
```typescript
MenuRegistry.appendMenuItem(PreviewModeSubmenu, {
    command: {
        id: 'workbench.action.previewMode.code',
        title: 'Code'
    },
    group: 'preview_modes',
    order: 1
});

CommandsRegistry.registerCommand('workbench.action.previewMode.code', (accessor) => {
    // Implementation
});
```

### Solution 3: Check VSCode Version Compatibility
The `togglePrimaryAction` feature might have specific requirements or bugs in certain VSCode versions.

## Next Debugging Steps

### 1. Verify MenuItemAction Wrapping
Add to action:
```typescript
async run(accessor: ServicesAccessor): Promise<void> {
    console.log('[PreviewMode] this:', this);
    console.log('[PreviewMode] constructor:', this.constructor.name);
    // ... rest
}
```

### 2. Check Action Runner
The dropdown's action runner should be firing. We need to verify if our actions are going through it.

### 3. Inspect Dropdown Instance
In browser console after clicking dropdown:
```javascript
// Find the dropdown instance
const dropdown = document.querySelector('.action-label');
console.log('Dropdown element:', dropdown);
```

## Comparison with Debug Dropdown

The Debug dropdown works with the same pattern. Key differences to investigate:
1. Are Debug actions registered differently?
2. Does Debug use a different action runner?
3. Is there special handling for EditorTitleRun menu?

## Status

**Current**: Actions execute but button label doesn't update
**Blocker**: `DropdownWithDefaultActionViewItem.update()` not being called
**Next**: Test with `f1: false` added to see if it changes behavior

## If This Doesn't Work

We may need to:
1. File a bug report with VSCode
2. Implement a custom action view item
3. Use a different UI pattern (not split button)

The implementation is architecturally correct based on VSCode patterns. If it still doesn't work, it might be a VSCode framework limitation or bug.
