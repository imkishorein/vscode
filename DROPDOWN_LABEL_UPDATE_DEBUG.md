# Dropdown Label Update Issue

## Problem
When selecting "Preview" or "Code + Preview" from the dropdown, the button label stays as "Code" instead of updating to show the selected option.

## Expected Behavior
- Select "Code" → Button shows "Code"
- Select "Preview" → Button shows "Preview"
- Select "Code + Preview" → Button shows "Code + Preview"

## Current Behavior
- Button always shows "Code" regardless of selection

## Root Cause Analysis

### How togglePrimaryAction Works

From `DropdownWithDefaultActionViewItem` (line 478-484):

```typescript
if (options?.togglePrimaryAction) {
    this._register(this._dropdown.actionRunner.onDidRun((e: IRunEvent) => {
        if (e.action instanceof MenuItemAction) {
            this.update(e.action);  // ← Updates button label
        }
    }));
}
```

The button updates when:
1. An action runs
2. The action is a `MenuItemAction`
3. `update()` is called with the action

### The Problem

Our actions are registered with `registerAction2()`, which creates `Action2` instances. These get converted to `MenuItemAction` when added to menus, BUT the issue is that our actions immediately delegate to other commands:

```typescript
async run(accessor: ServicesAccessor): Promise<void> {
    const commandService = accessor.get(ICommandService);
    await commandService.executeCommand(SET_VIEW_MODE_CODE_COMMAND_ID);
}
```

This might be causing the action to not be recognized properly by the update mechanism.

## Solution Options

### Option 1: Direct Action Implementation ✅

Instead of delegating to commands, implement the mode switching logic directly in the actions:

```typescript
registerAction2(class extends Action2 {
    async run(accessor: ServicesAccessor): Promise<void> {
        const viewModeManager = accessor.get(IViewModeManager);
        const layoutService = accessor.get(IWorkbenchLayoutService);
        
        // Direct implementation
        layoutService.setPartHidden(true, Parts.AUXILIARYBAR_PART);
        viewModeManager.setMode('code-only');
    }
});
```

### Option 2: Check Action Registration

Verify that the actions are being registered correctly as MenuItemActions and not just as generic actions.

### Option 3: Force Button Update

Manually trigger a button update after action execution.

## Debugging Steps

1. **Check if actions are MenuItemAction instances**
   - Add console.log in the action runner
   - Verify `e.action instanceof MenuItemAction` is true

2. **Check if update() is being called**
   - Add console.log in the update method
   - Verify it's called when selecting options

3. **Check storage**
   - The selected action ID is stored in workspace storage
   - Key: `${submenuAction.item.submenu.id}_lastActionId`
   - Verify it's being saved correctly

## Quick Fix: Implement Actions Directly

Let me implement the mode switching logic directly in the actions instead of delegating to commands.
