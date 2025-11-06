# Editor Dropdown - Two Versions

## Overview
Two different implementations of the preview mode dropdown in the editor title bar.

## Version 1: Icon Only 🎬
**File**: `previewEditorTitleDropdownIconOnly.ts`

### Appearance
- Shows **only the play icon** (no text)
- Dropdown menu appears on click
- Compact, takes minimal space

### Implementation
- Uses `icon: Codicon.play` property
- Submenu with 3 actions (Code, Preview, Code + Preview)
- Each submenu action has its own icon
- Position: `order: -3` (leftmost)

### User Experience
```
[🎬 ▼]  ← Click to see dropdown menu
```

Dropdown shows:
- 📄 Code
- 👁️ Preview  
- ⬌ Code + Preview

---

## Version 2: Label + Chevron 📝
**File**: `previewEditorTitleDropdownLabelChevron.ts`

### Appearance
- Shows **text label** that updates dynamically (no icon)
- Dropdown menu appears on click
- Takes more space but clearer intent

### Implementation
- NO icon property (allows text to render)
- Uses submenu pattern with 3 actions
- Split button with `togglePrimaryAction: true`
- Position: `order: -2` (after icon version)

### User Experience
```
[Code + Preview ▼]  ← Click to see dropdown
```

Dropdown shows:
- Code
- Preview
- Code + Preview

**Features**:
- ✅ **Dynamic label updates** - Button text changes to match selection
- ✅ Keyboard navigation
- ✅ Standard dropdown menu
- ✅ Label persists across sessions

### Dynamic Label Behavior
- Select "Code" → Button shows `[Code ▼]`
- Select "Preview" → Button shows `[Preview ▼]`
- Select "Code + Preview" → Button shows `[Code + Preview ▼]`

---

## Visual Comparison

### In Editor Title Bar
```
[🎬 ▼] [Code + Preview] [split] [layout] [...]
  ↑            ↑
Version 1    Version 2
Icon Only    Label + Quick Pick
```

### Interaction Comparison

| Feature | Version 1 (Icon) | Version 2 (Label) |
|---------|------------------|-------------------|
| **Button Style** | Icon only | Text label |
| **Width** | Narrow (~30px) | Wide (~120px) |
| **Interaction** | Dropdown menu | Dropdown menu |
| **Dynamic Label** | ❌ No | ✅ Yes |
| **Label Updates** | ❌ Static icon | ✅ Shows selected mode |
| **Space Efficient** | ✅ Yes | ❌ No |
| **Clear Intent** | ⚠️ Requires hover | ✅ Obvious |

---

## Key Differences

### Version 1: Icon Only
- **Pros**: Compact, space-efficient, icon-based
- **Cons**: Less discoverable, icon doesn't change
- **Best for**: Users familiar with the feature, minimal UI

### Version 2: Dynamic Label
- **Pros**: Clear labels, **dynamic updates**, shows current mode
- **Cons**: Takes more space, text-heavy
- **Best for**: Discoverability, clarity, showing current state

---

## Testing

Both versions are active. To test:

```bash
npm run watch
./scripts/code.sh
```

Open any file and look at the editor title bar. You'll see both buttons.

---

## Choosing a Version

### Keep Version 1 (Icon) if:
- Space is premium
- Users are familiar with the feature
- Prefer minimal UI
- Don't need to see current mode at a glance

### Keep Version 2 (Dynamic Label) if:
- Discoverability is important
- Want to show current mode in the button
- Prefer explicit labels that update
- Users need clear visual feedback

### Keep Both if:
- Want to offer both interaction styles
- Different use cases for each
- A/B testing needed

---

## Files Modified

1. **previewEditorTitleDropdownIconOnly.ts** - Icon version with dropdown menu
2. **previewEditorTitleDropdownLabelChevron.ts** - Label version with quick pick
3. **preview.contribution.ts** - Imports both versions

To disable one version, comment out its import in `preview.contribution.ts`.
