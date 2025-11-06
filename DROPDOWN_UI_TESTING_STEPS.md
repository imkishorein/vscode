# Dropdown UI Testing Steps

## Current Status
The dropdown button has been implemented and should now be visible in the editor title bar.

## Changes Made

### 1. Removed Context Restrictions (Temporary)
- **File**: `previewEditorTitleDropdown.ts`
- **Change**: Commented out the `when` clause that restricts the button to HTML files only
- **Result**: Button should now appear for ALL file types (for testing purposes)
- **Enabled F1**: Set `f1: true` so you can also trigger it from command palette

### 2. Button Configuration
- **Menu ID**: `MenuId.EditorTitle`
- **Group**: `navigation`
- **Order**: `99997` (should appear before split editor icons)
- **Icon**: Play icon (Codicon.play)
- **Title**: "Code + Preview"

## Testing Steps

### Step 1: Rebuild VSCode
```bash
cd /Users/kishore.v/Dev/vscode
npm run watch
```

Wait for the compilation to complete (watch for "Finished compilation" message).

### Step 2: Launch VSCode
After compilation completes:
```bash
./scripts/code.sh
```

Or press `F5` in your VSCode instance to launch the development version.

### Step 3: Look for the Button

#### Where to Look:
The button should appear in the **editor title bar** (the bar with the file tabs).

**Expected Location**:
```
[file.html] [X]  [breadcrumb...]  [🎬 BUTTON] [split] [layout] [close] [...]
                                   ↑ HERE
```

#### Visual Characteristics:
- **Icon**: Play icon (triangle)
- **Position**: Before the split editor button
- **Visibility**: Should be visible on ANY open file (we removed the HTML-only restriction)

### Step 4: Test Command Palette (Alternative)
If you don't see the button in the editor title bar:

1. Press `Cmd+Shift+P` (or `Ctrl+Shift+P` on Windows/Linux)
2. Type: "Code + Preview"
3. You should see the command "Code + Preview" in the list
4. Select it to trigger the dropdown

### Step 5: Verify Button Click
Once you see the button:
1. Click on it
2. A dropdown menu should appear with 3 options:
   - Code
   - Preview  
   - Code + Preview

## Troubleshooting

### Button Not Visible?

#### Check 1: Verify File is Compiled
Look in the terminal for compilation errors:
```bash
# Check if the file was compiled
ls -la /Users/kishore.v/Dev/vscode/out/vs/workbench/contrib/preview/browser/previewEditorTitleDropdown.js
```

If the file exists, compilation succeeded.

#### Check 2: Check Browser Console
1. In the development VSCode window, press `Cmd+Option+I` (or `Ctrl+Shift+I`)
2. Go to the Console tab
3. Look for any errors related to "previewEditorTitleDropdown"

#### Check 3: Verify Registration
In the browser console, type:
```javascript
// Check if the action is registered
window.vscode.commands.getCommands().then(commands => {
    console.log(commands.filter(c => c.includes('preview')));
});
```

You should see `workbench.action.previewEditorTitleDropdown` in the list.

#### Check 4: Force Reload
1. In the development VSCode window, press `Cmd+R` (or `Ctrl+R`) to reload
2. Check again for the button

### Button Visible But Not Working?
That's okay for now! We're focusing on just showing the UI first.

## Next Steps (After Button is Visible)

Once you confirm the button is visible:

1. **Add back context restriction**: Uncomment the `when` clause to show only for HTML files
2. **Adjust positioning**: Fine-tune the `order` value if needed
3. **Style the button**: Add text label with dropdown chevron (currently shows as icon only)
4. **Test functionality**: Verify the dropdown menu works correctly

## Quick Reference

### File Locations
- **Implementation**: `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/previewEditorTitleDropdown.ts`
- **Registration**: `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/preview.contribution.ts` (line 28)
- **Compiled Output**: `/Users/kishore.v/Dev/vscode/out/vs/workbench/contrib/preview/browser/previewEditorTitleDropdown.js`

### Command ID
```
workbench.action.previewEditorTitleDropdown
```

### Current Configuration
```typescript
{
    id: 'workbench.action.previewEditorTitleDropdown',
    title: 'Code + Preview',
    icon: Codicon.play,
    menu: [{
        id: MenuId.EditorTitle,
        group: 'navigation',
        order: 99997
    }],
    f1: true
}
```

## Expected Behavior

### Current (Testing Phase)
- Button appears for ALL file types
- Shows as icon-only (play icon)
- Clicking opens a quick pick menu with 3 options
- Available in command palette

### Target (Final Phase)
- Button appears ONLY for HTML files
- Shows as text button: "Code + Preview ▼"
- Positioned before split editor icon
- Clicking opens dropdown menu
- NOT in command palette (f1: false)

## Report Back

Please test and report:
1. ✅ or ❌ Button visible in editor title bar?
2. ✅ or ❌ Command appears in command palette?
3. ✅ or ❌ Clicking button opens dropdown?
4. 📸 Screenshot of where you see (or don't see) the button

This will help us debug and refine the implementation!
