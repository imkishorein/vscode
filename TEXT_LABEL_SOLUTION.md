# Text Label Solution - Root Cause Analysis

## Problem
Split button was showing **icon + dropdown chevron** but **missing the text label** "Code + Preview".

## Root Cause Discovery

### Deep Dive into VSCode Source

Found in `menuEntryActionViewItem.ts` line 193:

```typescript
export class MenuEntryActionViewItem extends ActionViewItem {
    constructor(action: MenuItemAction, options, ...) {
        super(undefined, action, { 
            icon: !!(action.class || action.item.icon), 
            label: !action.class && !action.item.icon,  // ← THE PROBLEM
            ...
        });
    }
}
```

### The Logic

```typescript
icon:  !!(action.class || action.item.icon)  // TRUE if icon exists
label: !action.class && !action.item.icon     // TRUE only if NO icon
```

**Translation**: VSCode shows **EITHER** icon **OR** label, never both!

### Why This Exists

This is intentional VSCode behavior for space efficiency in toolbars:
- Navigation group items are typically icon-only
- Text labels take more space
- Most toolbar actions don't need both

## The Solution

### Remove the Icon Property

**Before** (icon but no label):
```typescript
MenuRegistry.appendMenuItem(MenuId.EditorTitle, {
    submenu: PreviewModeSubmenu,
    title: 'Code + Preview',
    icon: Codicon.play,  // ← This prevents label from showing
    isSplitButton: { togglePrimaryAction: true }
});
```

**After** (text label with dropdown):
```typescript
MenuRegistry.appendMenuItem(MenuId.EditorTitle, {
    submenu: PreviewModeSubmenu,
    title: 'Code + Preview',
    // icon: Codicon.play,  // ← Removed
    isSplitButton: { togglePrimaryAction: true }
});
```

## Expected Result

```
[Code + Preview ▼] [▶ Run or Debug... ▼] [split] [...]
 ↑ TEXT + DROPDOWN
```

The button will now show:
- ✅ Text label: "Code + Preview"
- ✅ Dropdown chevron: ▼
- ❌ No icon (trade-off for showing text)

## Alternative: Icon + Text (Custom Implementation)

If you absolutely need BOTH icon AND text, you would need to:

1. **Create a custom ActionViewItem**:
```typescript
class PreviewDropdownActionViewItem extends DropdownWithDefaultActionViewItem {
    constructor(...) {
        super(...);
    }
    
    override render(container: HTMLElement): void {
        super.render(container);
        // Custom logic to force both icon and label
        // Override the MenuEntryActionViewItem options
        // Manually render icon + text
    }
}
```

2. **Register custom view item provider**:
```typescript
actionViewItemProvider: (action, options) => {
    if (action.id === 'our-preview-action') {
        return new PreviewDropdownActionViewItem(action, options);
    }
    return undefined;
}
```

**Complexity**: ~200+ lines of code
**Maintenance**: High (custom rendering logic)
**Recommendation**: ❌ Not worth it for this use case

## Why Debug Dropdown Also Shows Icon Only

Looking at the Debug dropdown registration:
```typescript
MenuRegistry.appendMenuItem(MenuId.EditorTitle, { 
    submenu: MenuId.EditorTitleRun, 
    isSplitButton: { togglePrimaryAction: true }, 
    title: "Run or Debug...", 
    icon: icons.debugRun,  // ← Has icon
    group: 'navigation', 
    order: -1 
});
```

The Debug dropdown **also has an icon**, which means it also shows icon-only by default!

**Observation**: In a standard VSCode window, the Debug dropdown likely shows as [▶] (icon only), not [▶ Run or Debug...].

## Principal Engineer Decision

### Trade-offs Analysis

| Option | Icon | Text | Complexity | Maintenance |
|--------|------|------|------------|-------------|
| Icon Only | ✅ | ❌ | Low | Low |
| Text Only | ❌ | ✅ | Low | Low |
| Icon + Text (Custom) | ✅ | ✅ | High | High |

### Recommendation: Text Only ✅

**Reasons**:
1. **User requested text label** - Primary requirement
2. **Low complexity** - One line change
3. **Maintainable** - Uses standard VSCode patterns
4. **Clear intent** - Text makes the button's purpose obvious
5. **Consistent** - Matches other text-based dropdowns

### When to Use Icon + Text

Only if:
- ✅ User explicitly requires both
- ✅ Willing to maintain custom code
- ✅ Have time for 200+ lines of implementation
- ✅ Can handle future VSCode API changes

## Testing

### Rebuild
```bash
npm run watch
```

### Launch
```bash
./scripts/code.sh
```

### Expected Result

```
[Code + Preview ▼] [split] [layout] [...]
 ↑ TEXT LABEL
```

Should show:
- ✅ Text: "Code + Preview"
- ✅ Dropdown chevron: ▼
- ✅ Clickable button
- ✅ Opens dropdown menu

## Summary

**Root Cause**: VSCode's `MenuEntryActionViewItem` has built-in logic that shows either icon OR label, never both.

**Solution**: Remove the `icon` property to force text label rendering.

**Result**: Clean, maintainable solution that meets the requirement.

**Status**: ✅ Ready for testing
