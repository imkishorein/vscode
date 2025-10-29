/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * ViewModeDropdownControl - Dropdown control in editor title bar
 * 
 * Displays current view mode and allows switching between:
 * - Code: Shows only HTML code
 * - Preview: Shows only preview
 * - Code + Preview: Shows HTML and preview side-by-side
 * 
 * Automatically updates when auxiliary bar visibility changes
 */

import { localize } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { IViewModeManager } from './viewModeManager.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';

// Command IDs for view mode switching
export const SET_VIEW_MODE_CODE_COMMAND_ID = 'workbench.action.setViewModeCode';
export const SET_VIEW_MODE_PREVIEW_COMMAND_ID = 'workbench.action.setViewModePreview';
export const SET_VIEW_MODE_CODE_AND_PREVIEW_COMMAND_ID = 'workbench.action.setViewModeCodeAndPreview';

// Register "Code" mode command
registerAction2(class SetViewModeCodeAction extends Action2 {
	constructor() {
		super({
			id: SET_VIEW_MODE_CODE_COMMAND_ID,
			title: localize('setViewModeCode', "View Mode: Code"),
			f1: false
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const viewModeManager = accessor.get(IViewModeManager);
		const layoutService = accessor.get(IWorkbenchLayoutService);

		// Hide auxiliary bar when switching to code-only mode
		layoutService.setPartHidden(true, Parts.AUXILIARYBAR_PART);
		
		viewModeManager.setMode('code-only');
	}
});

// Register "Preview" mode command
registerAction2(class SetViewModePreviewAction extends Action2 {
	constructor() {
		super({
			id: SET_VIEW_MODE_PREVIEW_COMMAND_ID,
			title: localize('setViewModePreview', "View Mode: Preview"),
			f1: false
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const viewModeManager = accessor.get(IViewModeManager);
		const layoutService = accessor.get(IWorkbenchLayoutService);

		// Hide auxiliary bar when switching to preview-only mode
		layoutService.setPartHidden(true, Parts.AUXILIARYBAR_PART);
		
		viewModeManager.setMode('preview-only');
	}
});

// Register "Code + Preview" mode command
registerAction2(class SetViewModeCodeAndPreviewAction extends Action2 {
	constructor() {
		super({
			id: SET_VIEW_MODE_CODE_AND_PREVIEW_COMMAND_ID,
			title: localize('setViewModeCodeAndPreview', "View Mode: Code + Preview"),
			f1: false
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const viewModeManager = accessor.get(IViewModeManager);
		const layoutService = accessor.get(IWorkbenchLayoutService);
		const viewsService = accessor.get(IViewsService);

		// Show auxiliary bar when switching to split-view mode
		layoutService.setPartHidden(false, Parts.AUXILIARYBAR_PART);
		
		// Open the preview view in auxiliary bar
		await viewsService.openView('workbench.view.auxiliaryPreview.main', true);
		
		viewModeManager.setMode('split-view');
	}
});
