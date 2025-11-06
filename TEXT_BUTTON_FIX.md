# Text Button Fix - Editor Title Dropdown

## Problem
The dropdown was showing as an **icon-only button** (🎬) instead of a **text button with icon and chevron** (🎬 Code + Preview ▼).

## Root Cause

VSCode's editor title bar has specific rendering rules:

### Navigation Group Behavior
```typescript
group: 'navigation' + icon: Codicon.play
→ Renders as: [🎬] (icon only)
```

Items in the `navigation` group with an `icon` property are **always rendered as icon-only buttons** for space efficiency.

### Solution: Custom Group
```typescript
group: '0_preview' + NO icon
→ Renders as: [Code + Preview ▼] (text with chevron)
```

## Changes Made

### Before
```typescript
MenuRegistry.appendMenuItem(MenuId.EditorTitle, {
    submenu: PreviewModeSubmenu,
    title: 'Code + Preview',
    icon: Codicon.play,        // ← This forces icon-only
    group: 'navigation',        // ← This group shows icons only
    order: 99997
});
```

**Result**: Icon-only button [🎬]

### After
```typescript
MenuRegistry.appendMenuItem(MenuId.EditorTitle, {
    submenu: PreviewModeSubmenu,
    title: 'Code + Preview',
    // icon: Codicon.play,      // ← Removed to show text
    group: '0_preview',         // ← Custom group for text rendering
    order: 1
});
```

**Result**: Text button with chevron [Code + Preview ▼]

## Key Insights

### VSCode Menu Rendering Rules

1. **Navigation Group**
   - Purpose: Icon-only actions for space efficiency
   - Rendering: Always icon-only if `icon` is provided
   - Examples: Split editor, close, maximize

2. **Custom Groups**
   - Purpose: Context-specific actions
   - Rendering: Text labels with optional icons
   - Examples: Debug dropdown, SCM actions

3. **Group Ordering**
   - Groups are rendered in alphabetical order
   - Prefix with `0_` to appear first: `'0_preview'`
   - Prefix with `9_` to appear last: `'9_settings'`

### Icon vs Text Rendering

| Configuration | Result |
|---------------|--------|
| `icon: X, group: 'navigation'` | Icon only [🎬] |
| `icon: X, group: 'custom'` | Icon + Text [🎬 Text ▼] |
| `NO icon, group: 'navigation'` | Text only [Text ▼] |
| `NO icon, group: 'custom'` | Text only [Text ▼] |

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
[file.html] [Code + Preview ▼] [🎬] [split] [layout] [...]
             ↑ TEXT BUTTON
```

The button should now show:
- ✅ Text label: "Code + Preview"
- ✅ Dropdown chevron: ▼
- ✅ No icon (or icon before text if we add it back)
- ✅ Positioned before navigation icons

## Adding Icon Back (Optional)

If you want **both icon AND text**:

```typescript
MenuRegistry.appendMenuItem(MenuId.EditorTitle, {
    submenu: PreviewModeSubmenu,
    title: 'Code + Preview',
    icon: Codicon.play,         // ← Add icon back
    group: '0_preview',         // ← Keep custom group
    order: 1
});
```

**Result**: [🎬 Code + Preview ▼]

## Alternative Approaches Considered

### ❌ Approach 1: Keep navigation group, remove icon
**Problem**: Text buttons in navigation group are not standard

### ❌ Approach 2: Use isSplitButton
**Problem**: Only works with primary actions, not submenus

### ✅ Approach 3: Custom group without icon (CHOSEN)
**Advantage**: Clean, standard VSCode pattern for text dropdowns

## Positioning

### Current Position
```
group: '0_preview', order: 1
```

This places the button at the **start of the editor title bar**, before all navigation icons.

### To Move After File Tabs
```
group: '1_preview', order: 1
```

### To Move Before Split Icon
```
group: 'navigation', order: -1
```
(But this will show icon-only again)

## Final Configuration

```typescript
// File: previewEditorTitleDropdown.ts

MenuRegistry.appendMenuItem(MenuId.EditorTitle, {
    submenu: PreviewModeSubmenu,
    title: localize('previewModeDropdown', 'Code + Preview'),
    // No icon = text label rendering
    group: '0_preview', // Custom group before navigation
    order: 1
});
```

## Status
✅ **Ready for testing**

The button should now render as a text button with dropdown chevron, matching your screenshot requirement!
