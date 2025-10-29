# Bug Fix: Preview Editor Registration

## Problem
When clicking preview items from PreviewPrimarySidebarView, the preview editor failed to open with the error:
```
The editor could not be opened due to an unexpected error. Please consult the log for more details.
```

## Root Cause
The `PreviewEditor` class was implemented but **not registered** with VSCode's editor pane registry. When `editorService.openEditor()` was called with a `PreviewEditorInput`, VSCode couldn't find the corresponding editor pane to render it.

## Solution
Registered the `PreviewEditor` as an editor pane in `preview.contribution.ts` using VSCode's standard editor registration pattern.

## Changes Made

### File: `/Users/kishore.v/Dev/vscode/src/vs/workbench/contrib/preview/browser/preview.contribution.ts`

#### 1. Added Required Imports
```typescript
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { EditorExtensions } from '../../../common/editor.js';
import { PreviewEditor, PreviewEditorInput } from './previewEditor.js';
```

#### 2. Registered PreviewEditor as Editor Pane
```typescript
// Register PreviewEditor as an editor pane
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		PreviewEditor,
		PreviewEditor.ID,
		localize('previewEditor', "Preview Editor")
	),
	[new SyncDescriptor(PreviewEditorInput)]
);
```

## How It Works

### Editor Registration Flow
1. **PreviewEditorInput** - Defines the editor input type (what to open)
2. **PreviewEditor** - Defines the editor pane (how to render it)
3. **EditorPaneDescriptor** - Connects input type to editor pane
4. **Registry** - Makes the connection available to VSCode's editor service

### When User Clicks Preview Item
1. `PreviewView.openPreview()` creates a `PreviewEditorInput`
2. `editorService.openEditor()` looks up the registered editor pane for this input type
3. VSCode finds `PreviewEditor` via the registry
4. `PreviewEditor` is instantiated and renders the preview

## Pattern Reference
This follows the same pattern used by other VSCode editors:
- **Notebook Editor**: `notebook.contribution.ts`
- **Custom Editor**: `customEditor.contribution.ts`
- **Text File Editor**: `files.contribution.ts`
- **Webview Editor**: `customEditor.contribution.ts`

## Testing
After this fix:
1. ✅ Click any preview item from PreviewPrimarySidebarView
2. ✅ Preview opens in the main editor area
3. ✅ HTML content is rendered in a webview
4. ✅ Auto-refresh works on file changes
5. ✅ Multiple previews can be opened simultaneously

## Key Takeaway
In VSCode, **every custom editor must be registered** with the editor pane registry. Simply implementing `EditorPane` and `EditorInput` classes is not enough - they must be explicitly registered via `Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane()`.
