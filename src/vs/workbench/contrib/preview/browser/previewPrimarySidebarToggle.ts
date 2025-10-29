/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * PreviewPrimarySidebarView Toggle Command
 * 
 * Provides programmatic toggle functionality for the Preview sidebar.
 * The activity bar icon is automatically registered via the view container registration.
 * 
 * Note: The Play icon in the activity bar is created automatically when the view container
 * is registered in preview.contribution.ts with ViewContainerLocation.Sidebar.
 */

import { CommandsRegistry } from '../../../../platform/commands/common/commands.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { PREVIEW_VIEW_ID } from './preview.contribution.js';

// Command ID for programmatic toggle
const TOGGLE_PREVIEW_SIDEBAR_COMMAND_ID = 'workbench.action.togglePreviewPrimarySidebar';

// Register the toggle command (for programmatic use, keybindings, etc.)
CommandsRegistry.registerCommand(TOGGLE_PREVIEW_SIDEBAR_COMMAND_ID, async (accessor) => {
	const viewsService = accessor.get(IViewsService);
	
	// Check if the view is visible
	const isVisible = viewsService.isViewVisible(PREVIEW_VIEW_ID);
	
	if (isVisible) {
		// Hide the view
		await viewsService.closeView(PREVIEW_VIEW_ID);
	} else {
		// Show the view
		await viewsService.openView(PREVIEW_VIEW_ID, true);
	}
});
