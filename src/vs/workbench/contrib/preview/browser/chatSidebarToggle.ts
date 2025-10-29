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

// Register chat icon for toggle
const chatToggleIcon = registerIcon('chat-toggle', Codicon.commentDiscussion, localize('chatToggleIcon', 'Chat icon for toggle.'));

// Command ID
export const TOGGLE_CHAT_SIDEBAR_COMMAND_ID = 'workbench.action.toggleChatSidebar';

// Register toggle command
registerAction2(class ToggleChatSidebarAction extends Action2 {
	constructor() {
		super({
			id: TOGGLE_CHAT_SIDEBAR_COMMAND_ID,
			title: localize2('toggleChatSidebar', "Toggle Chat Sidebar"),
			icon: chatToggleIcon,
			menu: [
				{
					id: MenuId.LayoutControlMenu,
					group: '2_pane_toggles',
					order: 3
				}
			]
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const layoutService = accessor.get(IWorkbenchLayoutService);
		const viewsService = accessor.get(IViewsService);

		const chatViewId = 'workbench.view.vibeChat';

		if (viewsService.isViewVisible(chatViewId)) {
			// Hide auxiliary bar if chat is visible
			layoutService.setPartHidden(true, Parts.AUXILIARYBAR_PART);
		} else {
			// Show auxiliary bar and make chat visible
			layoutService.setPartHidden(false, Parts.AUXILIARYBAR_PART);
			
			// Close preview view if it's open
			try {
				await viewsService.closeViewContainer('workbench.view.auxiliaryPreview');
			} catch (e) {
				// Preview might not be open, ignore error
			}
			
			// Open chat view
			viewsService.openView(chatViewId, true);
		}
	}
});
