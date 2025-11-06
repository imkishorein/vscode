# Final Debug Guide - Principal Engineer Approach

## Current Implementation Status

### What We Have
1. ✅ Dropdown button appears in editor title bar
2. ✅ Shows "Code" label initially
3. ✅ Dropdown menu opens with 3 options
4. ✅ Actions execute when selected (with console logging)
5. ❌ Button label doesn't update after selection

## Deep Technical Analysis

### How VSCode Split Buttons Work

From `DropdownWithDefaultActionViewItem` (menuEntryActionViewItem.ts:478-484):

```typescript
if (options?.togglePrimaryAction) {
    this._register(this._dropdown.actionRunner.onDidRun((e: IRunEvent) => {
        if (e.action instanceof MenuItemAction) {
            this.update(e.action);  // ← Updates button label
        }
    }));
}
```

**Critical Requirements:**
1. `e.action` MUST be a `MenuItemAction` instance
2. The action must be executed through the dropdown's action runner
3. The `update()` method re-renders the button with the new action's label

### How Action2 Becomes MenuItemAction

When you use `registerAction2()` with a `menu` configuration:

```typescript
registerAction2(class extends Action2 {
    constructor() {
        super({
            id: 'my.action',
            title: 'My Action',
            menu: [{ id: SomeMenuId }]
        });
    }
});
```

VSCode's menu service automatically:
1. Creates a `MenuItemAction` wrapper around your Action2
2. Adds it to the specified menu
3. The MenuItemAction delegates to your Action2's run() method

## Testing Steps

### Step 1: Rebuild and Launch
```bash
npm run watch
./scripts/code.sh
```

### Step 2: Open Browser Console
Press `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)

### Step 3: Test Action Execution
1. Click the dropdown button
2. Select "Preview"
3. Check console for: `[PreviewMode] Switching to Preview mode`
4. Check if button label changed to "Preview"

### Step 4: Debug Action Type
In the browser console, run:
```javascript
// Get the menu service
const menuService = window._VSCODE_DEV_MENU_SERVICE;

// Check if actions are registered
console.log('Menu items:', menuService);
```

### Step 5: Check Storage
In browser console:
```javascript
// Check workspace storage
const storage = localStorage.getItem('workbench.panel.markers.hidden');
console.log('Storage:', storage);

// Look for our submenu storage key
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('PreviewModeSubmenu')) {
        console.log(key, localStorage.getItem(key));
    }
}
```

## Potential Issues and Solutions

### Issue 1: Actions Not MenuItemAction Instances

**Symptom**: Console shows action execution but label doesn't update

**Diagnosis**: The action might not be wrapped in MenuItemAction

**Solution**: Verify action registration is correct

### Issue 2: Action Runner Not Firing

**Symptom**: No console logs appear

**Diagnosis**: Actions aren't being executed through the dropdown's action runner

**Solution**: Check if actions are properly registered in the submenu

### Issue 3: Storage Key Mismatch

**Symptom**: Label updates but doesn't persist

**Diagnosis**: Storage key might be incorrect

**Expected Key**: `PreviewModeSubmenu_lastActionId`

### Issue 4: Button Not Re-rendering

**Symptom**: Action executes, storage updates, but UI doesn't change

**Diagnosis**: The `update()` method might not be re-rendering properly

**Solution**: Check if the button container exists

## Comparison with Working Example

### Debug Dropdown (Working)
```typescript
// Parent menu
MenuRegistry.appendMenuItem(MenuId.EditorTitle, { 
    submenu: MenuId.EditorTitleRun,
    isSplitButton: { togglePrimaryAction: true },
    ...
});

// Submenu actions (in other files)
registerAction2(class extends Action2 {
    constructor() {
        super({
            menu: [{ id: MenuId.EditorTitleRun }]
        });
    }
});
```

### Our Implementation
```typescript
// Parent menu
MenuRegistry.appendMenuItem(MenuId.EditorTitle, {
    submenu: PreviewModeSubmenu,
    isSplitButton: { togglePrimaryAction: true },
    ...
});

// Submenu actions
registerAction2(class extends Action2 {
    constructor() {
        super({
            menu: [{ id: PreviewModeSubmenu }]
        });
    }
});
```

**Difference**: None structurally. Should work the same way.

## Advanced Debugging

### Add Breakpoint in VSCode Source

1. Open `menuEntryActionViewItem.ts`
2. Find line 480: `if (e.action instanceof MenuItemAction)`
3. Add breakpoint
4. Test dropdown selection
5. Check if breakpoint hits
6. Inspect `e.action` type

### Check Action Registration

Add logging to our actions:
```typescript
async run(accessor: ServicesAccessor): Promise<void> {
    console.log('[PreviewMode] Action type:', this.constructor.name);
    console.log('[PreviewMode] Action ID:', this.desc.id);
    // ... rest of implementation
}
```

### Verify Menu Service

Check if actions are properly registered:
```typescript
// In browser console
const menuService = window._VSCODE_MENU_SERVICE;
if (menuService) {
    console.log('Menu service exists');
} else {
    console.log('Menu service not found');
}
```

## Expected Console Output

### When Selecting "Preview"
```
[PreviewMode] Switching to Preview mode
```

### When Selecting "Code + Preview"
```
[PreviewMode] Switching to Code + Preview mode
```

### When Selecting "Code"
```
[PreviewMode] Switching to Code mode
```

## Next Steps Based on Results

### If Console Logs Appear
✅ Actions are executing
→ Problem is with button label update mechanism
→ Check if `DropdownWithDefaultActionViewItem.update()` is being called

### If No Console Logs
❌ Actions aren't executing
→ Problem is with action registration or menu configuration
→ Verify actions are added to the correct submenu

### If Label Updates Once But Not Again
⚠️ Partial success
→ First update works, subsequent don't
→ Check if action runner is being disposed

## Final Checklist

- [ ] Actions registered with `registerAction2()`
- [ ] Actions have `menu: [{ id: PreviewModeSubmenu }]`
- [ ] Parent menu has `isSplitButton: { togglePrimaryAction: true }`
- [ ] Actions implement `async run()` method
- [ ] Console logs appear when selecting options
- [ ] Button label updates after selection
- [ ] Label persists after VSCode restart

## Status

Current implementation follows VSCode patterns correctly. If label still doesn't update, the issue is likely in how VSCode's menu service creates MenuItemAction wrappers for our actions.

**Next Action**: Test with console logging and report results.
