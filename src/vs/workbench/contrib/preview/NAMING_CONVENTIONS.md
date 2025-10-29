# Preview Feature - Naming Conventions

This document defines the official naming conventions for all Preview feature components to ensure consistency and eliminate ambiguity.

## Overview

The Preview feature allows users to view HTML previews in VSCode through multiple trigger points and rendering locations.

---

## Trigger Points

### 1. PreviewPrimarySidebarView (IMPLEMENTED ✅)
**Status:** ✅ Fully implemented and registered

- **Component Name**: `PreviewPrimarySidebarView`
- **Class Name**: `PreviewView`
- **File**: `previewView.ts`
- **View ID**: `workbench.view.preview.main`
- **Container ID**: `workbench.view.preview`
- **Icon**: Play icon (Codicon.play)
- **Location**: Primary sidebar (left side), order 5
- **Trigger**: Click Play icon in activity bar (primary sidebar)
- **Behavior**: Shows list of available previews organized in collapsible sections
- **Toggle Command**: `workbench.action.togglePreviewPrimarySidebar`

**Implementation Details:**
- View container registered in `preview.contribution.ts`
- Activity bar icon automatically created by view container registration
- Toggle command available in `previewPrimarySidebarToggle.ts`
- Connected to existing PreviewView class

---

### 2. PreviewExplorerView (IMPLEMENTED ✅)
- **Component Name**: `PreviewExplorerView`
- **Class Name**: `PreviewExplorerView`
- **File**: `files/browser/views/previewExplorerView.ts`
- **View ID**: `workbench.explorer.previewView`
- **Location**: File Explorer sidebar, 2nd position (between Folders and Outline)
- **Trigger**: Click preview items in accordion
- **Behavior**: Collapsible sections with preview items (Preview 1-5)

---

### 3. Context Menu Action (IMPLEMENTED ✅)
- **Component Name**: Preview Context Menu Action
- **File**: `previewActions.contribution.ts`
- **Command ID**: `workbench.action.previewFile`
- **Shortcut**: `Cmd+Shift+V` (Mac) / `Ctrl+Shift+V` (Windows/Linux)
- **Trigger**: Right-click on HTML file in File Explorer
- **Behavior**: Opens preview based on current ViewModeDropdownControl mode

---

## Core Components

### ViewModeDropdownControl (CONCEPTUAL - TO BE IMPLEMENTED)
**Status:** ⚠️ Dropdown exists in commented code, needs proper implementation

- **Component Name**: `ViewModeDropdownControl`
- **File**: To be created as `viewModeDropdownControl.ts`
- **Location**: Editor title bar
- **CSS Class**: `.view-mode-dropdown-select`
- **Service Interface**: `IViewModeManager` (to be created)
- **Service Implementation**: `ViewModeManager` (to be created)

**Command IDs:**
- `workbench.action.setViewModeCode` - Code only
- `workbench.action.setViewModePreview` - Preview only
- `workbench.action.setViewModeCodeAndPreview` - Code + Preview

**View Modes:**
- `'code-only'` - Shows only HTML code in editor
- `'preview-only'` - Shows only preview in editor panel
- `'split-view'` - Shows HTML in editor + Preview in auxiliary panel

---

## Rendering Locations

### 1. PreviewEditorPanel (IMPLEMENTED ✅)
**Renders preview in the main editor panel**

- **Component Name**: `PreviewEditorPanel`
- **Classes**: `PreviewEditor`, `PreviewEditorInput`
- **File**: `previewEditor.ts`
- **Editor ID**: `workbench.editor.previewEditor`
- **Input ID**: `workbench.input.previewEditor`
- **Triggers**:
  - Click from PreviewPrimarySidebarView (when implemented)
  - Click from PreviewExplorerView
  - Select "Preview" from ViewModeDropdownControl
  - Context menu action (Cmd+Shift+V)
- **Mode**: `'preview-only'`
- **Location**: Main editor area

---

### 2. PreviewAuxiliaryPanel (IMPLEMENTED ✅)
**Renders preview in the auxiliary sidebar (right side)**

- **Component Name**: `PreviewAuxiliaryPanel`
- **Class**: `AuxiliaryPreviewView`
- **File**: `auxiliaryPreviewView.ts`
- **Container ID**: `workbench.view.auxiliaryPreview`
- **View ID**: `workbench.view.auxiliaryPreview.main`
- **Trigger**: Select "Code + Preview" from ViewModeDropdownControl
- **Mode**: `'split-view'`
- **Location**: Auxiliary bar (right side)
- **Layout**: HTML in editor panel (left) + Preview in auxiliary panel (right)

---

## CSS Classes

### View Mode Dropdown
- `.view-mode-dropdown-select` - Main dropdown element
- `.view-mode-dropdown-select:hover` - Hover state
- `.view-mode-dropdown-select:focus` - Focus state
- `.preview-title-controls` - Container for dropdown in editor title

### Preview Sections (Sidebar)
- `.preview-sections-container` - Main container
- `.preview-section` - Section wrapper
- `.preview-section-header` - Clickable header
- `.preview-section-chevron` - Animated chevron
- `.preview-section-label` - Section label
- `.preview-section-content` - Items container
- `.preview-item` - Individual preview item
- `.preview-item-label` - Item label

### Preview Explorer (File Explorer)
- `.preview-explorer-sections-container` - Main container
- `.preview-explorer-section` - Section wrapper
- `.preview-explorer-section-header` - Clickable header
- `.preview-explorer-section-chevron` - Animated chevron
- `.preview-explorer-section-label` - Section label
- `.preview-explorer-section-content` - Items container
- `.preview-explorer-item` - Individual preview item
- `.preview-explorer-item-label` - Item label

### Preview Editor
- `.preview-editor` - Main editor container
- `.preview-editor-wrapper` - Editor wrapper
- `.preview-editor-content` - Content area
- `.preview-iframe` - Preview iframe
- `.preview-title-area-modified` - Modified title area
- `.preview-title-controls` - Title controls container

---

## File Structure

```
preview/
├── browser/
│   ├── previewView.ts                    # PreviewPrimarySidebarView (needs registration)
│   ├── previewEditor.ts                  # PreviewEditorPanel
│   ├── auxiliaryPreviewView.ts           # PreviewAuxiliaryPanel
│   ├── previewActions.contribution.ts    # Context menu action
│   ├── previewConstants.ts               # View IDs and constants
│   ├── preview.contribution.ts           # Registration
│   ├── viewModeDropdownControl.ts        # TO BE CREATED
│   ├── viewModeManager.ts                # TO BE CREATED
│   └── media/
│       ├── preview.css                   # Sidebar styles
│       └── previewEditor.css             # Editor styles
└── NAMING_CONVENTIONS.md                 # This file

files/
└── browser/
    └── views/
        └── previewExplorerView.ts        # PreviewExplorerView
```

---

## Command IDs Summary

```typescript
// Trigger Commands
'workbench.action.togglePreviewPrimarySidebar'  // Toggle primary sidebar (TO BE CREATED)
'workbench.action.previewFile'                  // Context menu + Cmd+Shift+V

// View Mode Commands (TO BE CREATED)
'workbench.action.setViewModeCode'              // Code only
'workbench.action.setViewModePreview'           // Preview only
'workbench.action.setViewModeCodeAndPreview'    // Code + Preview
```

---

## View IDs Summary

```typescript
// Primary Sidebar (TO BE CREATED)
'workbench.view.preview.primary'           // Primary sidebar view

// File Explorer
'workbench.explorer.previewView'           // File Explorer accordion

// Auxiliary Sidebar
'workbench.view.auxiliaryPreview'          // Auxiliary container
'workbench.view.auxiliaryPreview.main'     // Auxiliary panel view
```

---

## Implementation Status

| Component | Status | File | Notes |
|-----------|--------|------|-------|
| PreviewPrimarySidebarView | ✅ Complete | previewView.ts | Fully implemented |
| PreviewExplorerView | ✅ Complete | previewExplorerView.ts | Fully implemented |
| Context Menu Action | ✅ Complete | previewActions.contribution.ts | Fully implemented |
| ViewModeDropdownControl | ⚠️ Missing | N/A | Needs implementation |
| ViewModeManager | ⚠️ Missing | N/A | Needs implementation |
| PreviewEditorPanel | ✅ Complete | previewEditor.ts | Fully implemented |
| PreviewAuxiliaryPanel | ✅ Complete | auxiliaryPreviewView.ts | Fully implemented |

---

## Next Steps

1. **Implement ViewModeDropdownControl**
   - Create `viewModeDropdownControl.ts`
   - Register dropdown in editor title bar
   - Implement mode switching logic

2. **Implement ViewModeManager**
   - Create `viewModeManager.ts`
   - Define `IViewModeManager` service interface
   - Implement mode state management
   - Add event emitters for mode changes

3. ~~**Register PreviewPrimarySidebarView**~~ ✅ **COMPLETED**
   - ✅ View container registered in primary sidebar
   - ✅ Play icon automatically added to activity bar
   - ✅ PreviewView class connected as primary sidebar view
   - ✅ Toggle command implemented

4. **Update CSS References** ✅ **COMPLETED**
   - ✅ Renamed `.mode-dropdown-select` to `.view-mode-dropdown-select`
   - ✅ All styles use new naming convention

---

## Naming Rationale

### Why "ViewMode" instead of "PreviewMode"?
- **ViewMode** emphasizes how content is **displayed** (code, preview, or both)
- **PreviewMode** could be ambiguous (preview of what? preview feature mode?)
- ViewMode is clearer and more descriptive

### Why separate "EditorPanel" and "AuxiliaryPanel"?
- **EditorPanel** = Main editor area (center)
- **AuxiliaryPanel** = Auxiliary sidebar (right side)
- Clear distinction between rendering locations

### Why "PrimarySidebarView" instead of just "SidebarView"?
- VSCode has multiple sidebars (primary, auxiliary)
- **PrimarySidebarView** explicitly indicates left sidebar
- Prevents confusion with auxiliary sidebar

---

## References

- VSCode View API: https://code.visualstudio.com/api/extension-guides/tree-view
- VSCode Webview API: https://code.visualstudio.com/api/extension-guides/webview
- VSCode Contribution Points: https://code.visualstudio.com/api/references/contribution-points

---

**Last Updated:** 2025-01-29
**Version:** 1.0.0
