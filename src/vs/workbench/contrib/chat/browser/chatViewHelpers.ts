/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ViewContainerLocation } from '../../../common/views.js';
import { IWorkbenchLayoutService } from '../../../services/layout/browser/layoutService.js';
import { IPaneCompositePartService } from '../../../services/panecomposite/browser/panecomposite.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { CHAT_SIDEBAR_PANEL_ID } from '../common/constants.js';

export async function showChatView(viewsService: IViewsService, layoutService: IWorkbenchLayoutService, paneCompositeService?: IPaneCompositePartService, chatViewId?: string): Promise<any | undefined> {

	// Ensure main window is in front
	if (layoutService.activeContainer !== layoutService.mainContainer) {
		layoutService.mainContainer.focus();
	}

	// Close other containers in auxiliary bar to ensure exclusive display
	if (paneCompositeService) {
		const activeComposite = paneCompositeService.getActivePaneComposite(ViewContainerLocation.AuxiliaryBar);
		if (activeComposite && activeComposite.getId() !== CHAT_SIDEBAR_PANEL_ID) {
			await viewsService.closeViewContainer(activeComposite.getId());
		}
	}

	// Import ChatViewId dynamically to avoid circular dependency
	if (!chatViewId) {
		const { ChatViewId } = await import('./chat.js');
		chatViewId = ChatViewId;
	}

	return (await viewsService.openView(chatViewId) as any)?.widget;
}

