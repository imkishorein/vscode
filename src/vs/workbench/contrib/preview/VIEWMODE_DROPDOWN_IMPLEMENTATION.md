# ViewModeDropdownControl - Implementation Guide

## Overview

This document describes the implementation of the ViewModeDropdownControl feature that synchronizes the dropdown UI with the auxiliary bar visibility. When the PreviewAuxiliaryPanel is closed, the dropdown automatically changes to "Preview" mode.

## Objective

**When the PreviewAuxiliaryPanel is closed by clicking the close icon or through any other action, the ViewModeDropdownControl value should change to "Preview".**

## Architecture

### Components

#### 1. ViewModeManager (viewModeManager.ts)
**Purpose**: Central state management service for view modes

**Responsibilities**:
- Manages view mode state: `'preview-only' | 'split-view' | 'code-only'`
- Emits `onDidChangeMode` event when mode changes
- Provides `currentMode` getter for querying current state
- Provides `setMode()` method for updating state

**Key Features**:
- Singleton service registered with `InstantiationType.Eager`
- Event-driven architecture for reactive updates
- Type-safe mode management

#### 2. ViewModeDropdownControl (viewModeDropdownControl.ts)
**Purpose**: Registers commands for mode switching

**Responsibilities**:
- Registers three commands:
  - `workbench.action.setViewModeCode` - Sets mode to 'code-only'
  - `workbench.action.setViewModePreview` - Sets mode to 'preview-only'
  - `workbench.action.setViewModeCodeAndPreview` - Sets mode to 'split-view'
- Each command manages auxiliary bar visibility
- Each command updates ViewModeManager with new mode

**Key Features**:
- Clean separation of concerns
- Reusable command pattern
- Proper service injection

#### 3. ViewModeDropdownRenderer (viewModeDropdownRenderer.ts)
**Purpose**: Manages dropdown UI and listens to auxiliary bar changes

**Responsibilities**:
- Listens to `layoutService.onDidChangePartVisibility()` events
- Detects when auxiliary bar is hidden
- Automatically switches mode to 'preview-only' when auxiliary bar closes
- Updates dropdown UI to reflect current mode
- Handles dropdown selection changes
- Executes corresponding commands based on selection

**Key Features**:
- Automatic sync: Auxiliary bar closure → dropdown update
- Bidirectional sync: Dropdown selection → auxiliary bar visibility
- Event-driven updates
- Proper resource cleanup

#### 4. ViewModeDropdownIntegration (viewModeDropdownIntegration.ts)
**Purpose**: Integrates ViewModeDropdownRenderer with the actual dropdown element

**Responsibilities**:
- Finds or creates the dropdown element in editor title
- Instantiates ViewModeDropdownRenderer
- Connects renderer to dropdown element
- Returns renderer for lifecycle management

**Key Features**:
- Flexible dropdown element discovery
- Automatic dropdown creation if needed
- Clean integration interface

### Data Flow

```
User Action
    ↓
┌─────────────────────────────────────────────────────┐
│ Auxiliary Bar Closed by User                        │
│ (Click close icon or other action)                  │
└─────────────────────────────────────────────────────┘
    ↓
layoutService.onDidChangePartVisibility() fires
    ↓
ViewModeDropdownRenderer.onAuxiliaryBarVisibilityChanged()
    ↓
Checks: isAuxiliaryBarVisible && currentMode === 'split-view'
    ↓
viewModeManager.setMode('preview-only')
    ↓
ViewModeManager emits onDidChangeMode event
    ↓
ViewModeDropdownRenderer.updateDropdownValue('preview-only')
    ↓
Dropdown UI updates to show "Preview"
```

## Files Created

### 1. viewModeManager.ts
- **Location**: `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/viewModeManager.ts`
- **Lines**: ~45
- **Exports**:
  - `IViewModeManager` - Service interface
  - `ViewModeManager` - Implementation class
  - `ViewMode` - Type definition

### 2. viewModeDropdownControl.ts
- **Location**: `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/viewModeDropdownControl.ts`
- **Lines**: ~90
- **Exports**:
  - Command IDs (constants)
  - Three Action2 classes for mode switching

### 3. viewModeDropdownRenderer.ts
- **Location**: `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/viewModeDropdownRenderer.ts`
- **Lines**: ~125
- **Exports**:
  - `ViewModeDropdownRenderer` - Main renderer class

### 4. viewModeDropdownIntegration.ts
- **Location**: `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/viewModeDropdownIntegration.ts`
- **Lines**: ~55
- **Exports**:
  - `setupViewModeDropdown()` - Integration function

## Files Modified

### 1. preview.contribution.ts
**Changes**:
- Added imports for ViewModeManager and registerSingleton
- Registered ViewModeManager as singleton service
- Imported viewModeDropdownControl.js to load commands

**Lines Modified**: ~10

### 2. previewSidebarToggle.ts
**Changes**:
- Added import for IViewModeManager
- Updated run() method to set mode when toggling auxiliary bar
- Sets mode to 'preview-only' when closing auxiliary bar
- Sets mode to 'split-view' when opening auxiliary bar

**Lines Modified**: ~15

## Integration Points

### 1. Service Registration
```typescript
// In preview.contribution.ts
registerSingleton(IViewModeManager, ViewModeManager, InstantiationType.Eager);
```

### 2. Command Registration
```typescript
// In viewModeDropdownControl.ts
registerAction2(class SetViewModePreviewAction extends Action2 { ... });
registerAction2(class SetViewModeCodeAction extends Action2 { ... });
registerAction2(class SetViewModeCodeAndPreviewAction extends Action2 { ... });
```

### 3. Dropdown Setup
```typescript
// In editor or view initialization
const renderer = setupViewModeDropdown(
    layoutService,
    viewModeManager,
    commandService,
    editorTitleElement
);
```

## How It Works

### Scenario 1: User Closes Auxiliary Bar
1. User clicks close icon on auxiliary bar
2. VSCode hides the auxiliary bar
3. `layoutService.onDidChangePartVisibility()` fires
4. ViewModeDropdownRenderer detects auxiliary bar is hidden
5. If current mode is 'split-view', switches to 'preview-only'
6. Dropdown UI updates to show "Preview"

### Scenario 2: User Selects from Dropdown
1. User clicks dropdown and selects option
2. Corresponding command executes
3. Command manages auxiliary bar visibility
4. Command updates ViewModeManager with new mode
5. ViewModeManager emits event
6. ViewModeDropdownRenderer updates dropdown UI

### Scenario 3: User Clicks Play Icon
1. User clicks Play icon in topbar
2. previewSidebarToggle command executes
3. Updates ViewModeManager with appropriate mode
4. Manages auxiliary bar visibility
5. Dropdown reflects new state

## Key Features

✅ **Automatic Sync**: When auxiliary bar closes, dropdown changes to "Preview"
✅ **Bidirectional Sync**: Dropdown changes also update auxiliary bar visibility
✅ **Centralized State**: ViewModeManager is single source of truth
✅ **Event-Driven**: All components react to mode changes
✅ **Clean Separation**: UI (dropdown) separate from state management (manager)
✅ **Type-Safe**: Full TypeScript support with proper interfaces
✅ **Extensible**: Easy to add new modes or UI elements

## Testing Scenarios

### Test 1: Basic Auxiliary Bar Closure
1. Open preview → auxiliary bar shows
2. Click close icon on auxiliary bar
3. **Expected**: Dropdown changes to "Preview"
4. **Verify**: `layoutService.onDidChangePartVisibility()` fires
5. **Verify**: Mode changes to 'preview-only'

### Test 2: Dropdown Selection
1. Select "Code + Preview" from dropdown
2. **Expected**: Auxiliary bar opens
3. **Expected**: Mode changes to 'split-view'
4. Select "Preview" from dropdown
5. **Expected**: Auxiliary bar closes
6. **Expected**: Mode changes to 'preview-only'

### Test 3: Play Icon Toggle
1. Click Play icon (auxiliary bar visible)
2. **Expected**: Auxiliary bar closes
3. **Expected**: Dropdown shows "Preview"
4. Click Play icon again
5. **Expected**: Auxiliary bar opens
6. **Expected**: Dropdown shows "Code + Preview"

### Test 4: Multiple Previews
1. Open multiple previews
2. Close auxiliary bar
3. **Expected**: All previews respond to mode change
4. **Expected**: All dropdowns show "Preview"

### Test 5: Mode Persistence
1. Set mode to 'split-view'
2. Close VSCode
3. Reopen VSCode
4. **Expected**: Mode persists (if implemented with storage)

## CSS Classes

The following CSS classes are used for styling:

- `.preview-title-controls` - Container for dropdown in editor title
- `.view-mode-dropdown-select` - Main dropdown element
- `.view-mode-dropdown-select:hover` - Hover state
- `.view-mode-dropdown-select:focus` - Focus state

**Location**: `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/media/previewEditor.css`

## Future Enhancements

1. **Dropdown UI Rendering**: Add dropdown UI rendering in editor title bar
2. **Mode Persistence**: Persist mode preference in workspace settings
3. **Keyboard Shortcuts**: Add keyboard shortcuts for mode switching
4. **Chat Integration**: Integrate with Chat sidebar for exclusive visibility
5. **Animations**: Add smooth transitions when switching modes
6. **Accessibility**: Enhance keyboard navigation and screen reader support

## Troubleshooting

### Dropdown Not Updating
- **Check**: Is ViewModeManager service registered?
- **Check**: Is ViewModeDropdownRenderer listening to layout service?
- **Check**: Is dropdown element properly connected to renderer?

### Auxiliary Bar Not Closing
- **Check**: Are commands properly managing auxiliary bar visibility?
- **Check**: Is `layoutService.setPartHidden()` being called?

### Mode Not Changing
- **Check**: Is ViewModeManager.setMode() being called?
- **Check**: Are event listeners properly registered?

## References

- ViewModeManager: Central state management
- ViewModeDropdownControl: Command registration
- ViewModeDropdownRenderer: UI management and event handling
- ViewModeDropdownIntegration: Integration helper
- previewSidebarToggle: Play icon integration

## Summary

The ViewModeDropdownControl implementation provides a robust, event-driven system for managing preview view modes. The key innovation is the automatic synchronization between the dropdown UI and the auxiliary bar visibility, ensuring that the UI always reflects the current state of the application.

When the auxiliary bar is closed, the system automatically switches to 'preview-only' mode and updates the dropdown to show "Preview". This provides a seamless user experience where the UI stays in sync with the actual layout.
