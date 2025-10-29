/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../nls.js';
import { MenuId, MenuRegistry } from '../../../../platform/actions/common/actions.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';
import { ResourceContextKey } from '../../../common/contextkeys.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { PreviewEditorInput } from './previewEditor.js';
import { ICommandHandler } from '../../../../platform/commands/common/commands.js';
import { KeyMod, KeyCode } from '../../../../base/common/keyCodes.js';
import { KeybindingsRegistry, KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { FilesExplorerFocusCondition } from '../../files/common/files.js';
import { getMultiSelectedResources, IExplorerService } from '../../files/browser/files.js';
import { IListService } from '../../../../platform/list/browser/listService.js';
import { IEditorGroupsService } from '../../../services/editor/common/editorGroupsService.js';

// Supported preview file extensions
const PREVIEW_SUPPORTED_EXTENSIONS = ['.html', '.htm'];

// Context key to check if file supports preview
const isPreviewSupportedFile = ContextKeyExpr.or(
	...PREVIEW_SUPPORTED_EXTENSIONS.map(ext => ResourceContextKey.Extension.isEqualTo(ext))
);

const PREVIEW_FILE_COMMAND_ID = 'workbench.action.previewFile';

// Register the command
const previewFileCommandHandler: ICommandHandler = async (accessor: ServicesAccessor, resource: unknown) => {
	const editorService = accessor.get(IEditorService);
	const listService = accessor.get(IListService);
	const editorGroupsService = accessor.get(IEditorGroupsService);
	const explorerService = accessor.get(IExplorerService);
	
	// Get the selected resources from the explorer
	const resources = getMultiSelectedResources(resource, listService, editorService, editorGroupsService, explorerService);
	
	if (resources.length === 0) {
		return;
	}

	// Use the first selected resource
	const selectedResource = resources[0];
	
	// Extract file name without extension to determine preview number
	const fileName = selectedResource.path.split('/').pop() || '';
	const match = fileName.match(/preview(\d+)/);
	
	if (match && match[1]) {
		const previewNumber = match[1];
		const previewTitle = `Preview ${previewNumber}`;
		
		// Open the preview editor
		await editorService.openEditor(
			new PreviewEditorInput(previewTitle),
			{ pinned: true }
		);
	}
};

// Register the keybinding
KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: PREVIEW_FILE_COMMAND_ID,
	weight: KeybindingWeight.WorkbenchContrib,
	when: ContextKeyExpr.and(FilesExplorerFocusCondition, isPreviewSupportedFile),
	primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyV,
	handler: previewFileCommandHandler
});

// Register the menu item
MenuRegistry.appendMenuItem(MenuId.ExplorerContext, {
	group: '5_cutcopypaste',
	order: 1,
	command: {
		id: PREVIEW_FILE_COMMAND_ID,
		title: localize('previewFile', "Preview"),
		icon: Codicon.play
	},
	when: isPreviewSupportedFile
});
