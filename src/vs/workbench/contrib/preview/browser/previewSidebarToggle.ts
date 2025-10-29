/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize, localize2 } from '../../../../nls.js';
import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { IViewModeManager } from './viewModeManager.js';

// Register play icon for preview
const previewPlayIcon = registerIcon('preview-play', Codicon.play, localize('previewPlayIcon', 'Play icon for preview toggle.'));

// Command ID
export const TOGGLE_PREVIEW_SIDEBAR_COMMAND_ID = 'workbench.action.togglePreviewSidebar';

// Register toggle command
registerAction2(class TogglePreviewSidebarAction extends Action2 {
	constructor() {
		super({
			id: TOGGLE_PREVIEW_SIDEBAR_COMMAND_ID,
			title: localize2('togglePreviewSidebar', "Toggle Preview Sidebar"),
			icon: previewPlayIcon,
			menu: [
				{
					id: MenuId.LayoutControlMenu,
					group: '2_pane_toggles',
					order: 2
				}
			]
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const layoutService = accessor.get(IWorkbenchLayoutService);
		const viewsService = accessor.get(IViewsService);
		const viewModeManager = accessor.get(IViewModeManager);

		const previewViewId = 'workbench.view.auxiliaryPreview.main';
		const chatViewId = 'workbench.view.vibeChat';

		if (viewsService.isViewVisible(previewViewId)) {
			// Hide auxiliary bar if preview is visible
			layoutService.setPartHidden(true, Parts.AUXILIARYBAR_PART);
			// Update mode to preview-only when closing auxiliary bar
			viewModeManager.setMode('preview-only');
		} else {
			// Close chat view if it's open
			try {
				await viewsService.closeViewContainer(chatViewId);
			} catch (e) {
				// Chat might not be open, ignore error
			}
			
			// Show auxiliary bar and make preview visible
			// The auxiliary bar's maximumWidth constraint will ensure proper 50-50 split
			layoutService.setPartHidden(false, Parts.AUXILIARYBAR_PART);
			
			// Open preview view
			viewsService.openView(previewViewId, true);
			// Update mode to split-view when opening auxiliary bar
			viewModeManager.setMode('split-view');
		}
	}
});
