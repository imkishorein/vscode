# Preview Editor Title Dropdown Implementation

## Overview

This document describes the implementation of a dropdown button in the VSCode editor title bar that allows users to switch between preview modes for HTML files.

## Design Requirements

Based on the provided screenshot, the implementation includes:

1. **Location**: Editor title bar, positioned before the split editor icon
2. **Appearance**: Button with "Code + Preview" label and dropdown chevron
3. **Context**: Only visible when HTML files are active
4. **Functionality**: Dropdown menu with 3 options for switching preview modes

## Architecture

### Component Structure

```
previewEditorTitleDropdown.ts
├── PreviewEditorTitleDropdownAction (Action2)
│   ├── Menu Registration (MenuId.EditorTitle)
│   ├── Context Key (HTML files only)
│   └── Quick Pick Handler
└── Integration with ViewModeManager
```

### Key Design Decisions

#### 1. **Menu Placement**
- **Menu ID**: `MenuId.EditorTitle`
- **Group**: `navigation`
- **Order**: `99997` (before split editor icons at 100000)
- **Why**: This ensures the dropdown appears in the correct position in the editor title bar

#### 2. **Context Key**
```typescript
when: ContextKeyExpr.or(
    ResourceContextKey.Extension.isEqualTo('html'),
    ResourceContextKey.Extension.isEqualTo('htm')
)
```
- **Why**: Only show the dropdown when HTML files are active, as preview functionality is specific to HTML

#### 3. **Quick Pick Implementation**
- Uses `IQuickInputService.pick()` - VSCode's native dropdown API
- Three options: Code, Preview, Code + Preview
- Shows checkmark on currently selected mode
- Executes corresponding command on selection

#### 4. **Command Integration**
Reuses existing commands from `viewModeDropdownControl.ts`:
- `workbench.action.setViewModeCode` - Code only mode
- `workbench.action.setViewModePreview` - Preview only mode
- `workbench.action.setViewModeCodeAndPreview` - Split view mode

## Implementation Details

### File Created

**Path**: `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/previewEditorTitleDropdown.ts`

### Key Components

#### 1. Action Registration
```typescript
class PreviewEditorTitleDropdownAction extends Action2 {
    constructor() {
        super({
            id: 'workbench.action.previewEditorTitleDropdown',
            title: localize2('previewEditorTitleDropdown', 'Code + Preview'),
            icon: Codicon.play,
            menu: [{
                id: MenuId.EditorTitle,
                group: 'navigation',
                order: 99997,
                when: ContextKeyExpr.or(
                    ResourceContextKey.Extension.isEqualTo('html'),
                    ResourceContextKey.Extension.isEqualTo('htm')
                )
            }],
            f1: false
        });
    }
}
```

#### 2. Quick Pick Items
```typescript
interface IPreviewModeQuickPickItem extends IQuickPickItem {
    mode: ViewMode;
    commandId: string;
}

const items: IPreviewModeQuickPickItem[] = [
    {
        label: '$(code) Code',
        description: 'Show only HTML code',
        mode: 'code-only',
        commandId: SET_VIEW_MODE_CODE_COMMAND_ID,
        picked: currentMode === 'code-only'
    },
    {
        label: '$(preview) Preview',
        description: 'Show only preview',
        mode: 'preview-only',
        commandId: SET_VIEW_MODE_PREVIEW_COMMAND_ID,
        picked: currentMode === 'preview-only'
    },
    {
        label: '$(split-horizontal) Code + Preview',
        description: 'Show HTML and preview side-by-side',
        mode: 'split-view',
        commandId: SET_VIEW_MODE_CODE_AND_PREVIEW_COMMAND_ID,
        picked: currentMode === 'split-view'
    }
];
```

#### 3. Command Execution
```typescript
const selected = await quickInputService.pick(items, {
    placeHolder: localize('selectPreviewMode', 'Select preview mode'),
    canPickMany: false
});

if (selected) {
    await commandService.executeCommand(selected.commandId);
}
```

### File Modified

**Path**: `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/preview.contribution.ts`

**Change**: Added import to register the dropdown action
```typescript
import './previewEditorTitleDropdown.js';
```

## Integration with Existing Systems

### 1. ViewModeManager
- Reads current mode to show checkmark on selected option
- Commands update the mode through ViewModeManager
- Mode changes trigger UI updates across the application

### 2. ViewModeDropdownControl
- Reuses existing command IDs for consistency
- Commands handle:
  - Auxiliary bar visibility
  - View opening/closing
  - Mode state updates

### 3. Layout Service
- Commands manage auxiliary bar visibility
- Ensures proper layout when switching modes

## User Experience Flow

### Opening the Dropdown
1. User opens an HTML file in the editor
2. Dropdown button appears in editor title bar (before split icon)
3. Button shows current mode label (e.g., "Code + Preview")
4. Dropdown chevron indicates it's clickable

### Selecting a Mode
1. User clicks the dropdown button
2. Quick pick menu appears with 3 options
3. Current mode is marked with a checkmark
4. User selects desired mode
5. Command executes, updating:
   - ViewModeManager state
   - Auxiliary bar visibility
   - Editor layout
   - Button label

### Mode Behaviors

#### Code Only Mode
- Hides auxiliary bar
- Shows only HTML code in editor
- Button label: "Code"

#### Preview Only Mode
- Hides auxiliary bar
- Shows only preview in editor
- Button label: "Preview"

#### Code + Preview Mode
- Shows auxiliary bar
- Opens preview view in auxiliary bar
- Shows HTML code in main editor
- Button label: "Code + Preview"

## Technical Considerations

### 1. Performance
- Action only registered when preview contribution loads
- Quick pick created on-demand (not persistent)
- Minimal memory footprint

### 2. Accessibility
- Keyboard accessible (Tab to button, Enter to open)
- Screen reader support through ARIA labels
- Proper focus management in quick pick

### 3. Theming
- Uses VSCode codicons for consistency
- Respects theme colors
- Proper contrast in all themes

### 4. Extensibility
- Easy to add new modes by extending the items array
- Command-based architecture allows external integrations
- ViewModeManager can be extended for additional functionality

## Testing Checklist

### Functional Tests
- [ ] Dropdown appears when HTML file is active
- [ ] Dropdown hidden when non-HTML file is active
- [ ] Dropdown positioned before split editor icon
- [ ] Quick pick shows all 3 options
- [ ] Current mode marked with checkmark
- [ ] Selecting "Code" switches to code-only mode
- [ ] Selecting "Preview" switches to preview-only mode
- [ ] Selecting "Code + Preview" switches to split-view mode
- [ ] Button label updates after mode change
- [ ] Auxiliary bar shows/hides correctly

### Edge Cases
- [ ] Multiple HTML files open
- [ ] Switching between HTML and non-HTML files
- [ ] Quick pick cancelled (ESC key)
- [ ] Rapid mode switching
- [ ] Mode persistence across VSCode restarts

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader announces options
- [ ] Focus management correct
- [ ] ARIA labels present

### Visual Tests
- [ ] Button styling matches VSCode theme
- [ ] Dropdown chevron visible
- [ ] Quick pick styling consistent
- [ ] Icons display correctly
- [ ] Text readable in all themes

## Known Limitations

1. **File Type Detection**: Only checks file extension (.html, .htm), not file content
2. **Label Updates**: Button label is static ("Code + Preview"), doesn't reflect current mode
3. **Multi-Window**: Mode state shared across all windows

## Future Enhancements

### 1. Dynamic Button Label
Update button label to reflect current mode:
- "Code" when in code-only mode
- "Preview" when in preview-only mode
- "Code + Preview" when in split-view mode

### 2. Additional File Types
Extend support to other previewable file types:
- Markdown (.md)
- SVG (.svg)
- XML (.xml)

### 3. Keyboard Shortcuts
Add keyboard shortcuts for quick mode switching:
- `Cmd+K Cmd+1` - Code only
- `Cmd+K Cmd+2` - Preview only
- `Cmd+K Cmd+3` - Code + Preview

### 4. Mode Persistence
Save mode preference per file or workspace:
- Remember last used mode
- Restore on file reopen
- Workspace-specific defaults

## References

### VSCode APIs Used
- `Action2` - Action registration framework
- `MenuId.EditorTitle` - Editor title bar menu
- `IQuickInputService` - Native dropdown/picker
- `ICommandService` - Command execution
- `ContextKeyExpr` - Context key expressions
- `ResourceContextKey` - File resource context

### Related Files
- `viewModeManager.ts` - Mode state management
- `viewModeDropdownControl.ts` - Mode switching commands
- `auxiliaryPreviewView.ts` - Preview view component
- `preview.contribution.ts` - Preview feature registration

### VSCode Documentation
- [Extension API - Menus](https://code.visualstudio.com/api/references/contribution-points#contributes.menus)
- [Extension API - Commands](https://code.visualstudio.com/api/references/vscode-api#commands)
- [Extension API - Quick Pick](https://code.visualstudio.com/api/references/vscode-api#QuickPick)

## Conclusion

This implementation provides a native, accessible, and performant dropdown in the VSCode editor title bar for switching preview modes. It follows VSCode's architectural patterns, integrates seamlessly with existing systems, and provides a smooth user experience.

The design is extensible, allowing for future enhancements while maintaining backward compatibility. The use of standard VSCode APIs ensures consistency with the rest of the IDE and minimizes maintenance overhead.
