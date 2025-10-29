/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize, localize2 } from '../../../../nls.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { IViewContainersRegistry, IViewsRegistry, Extensions as ViewContainerExtensions, ViewContainerLocation, IViewDescriptorService } from '../../../common/views.js';
import { VIBE_CHAT_VIEW_ID, IVibeChatService } from '../common/vibeChat.js';
import { VibeChatViewPane } from './vibeChatViewPane.js';
import { VibeChatService } from './vibeChatService.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { VibeChatPreviewEditor, VibeChatPreviewInput } from './vibeChatPreview.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { EditorExtensions } from '../../../common/editor.js';
import { IPaneCompositePartService } from '../../../services/panecomposite/browser/panecomposite.js';

// Register icon for the activity bar
const vibeChatIcon = registerIcon('vibe-chat-view-icon', Codicon.commentDiscussion, localize('vibeChatViewIcon', 'View icon of the Vibe Chat view.'));

// COMMENTED OUT: Chat (Build with Agents) - Replaced with Preview in auxiliary panel
// Register the view container in the sidebar (activity bar)
const VIEW_CONTAINER = Registry.as<IViewContainersRegistry>(ViewContainerExtensions.ViewContainersRegistry).registerViewContainer({
	id: VIBE_CHAT_VIEW_ID,
	title: localize2('vibeChat', 'Vibe Chat'),
	icon: vibeChatIcon,
	order: 10,
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [VIBE_CHAT_VIEW_ID, { mergeViewWithContainerWhenSingleView: true }]),
	storageId: VIBE_CHAT_VIEW_ID,
	hideIfEmpty: false,
}, ViewContainerLocation.AuxiliaryBar); // CHANGED: Moved to AuxiliaryBar so it doesn't interfere with preview list

// COMMENTED OUT: Chat view registration - Using auxiliary panel for preview instead
// Register the view itself
const viewsRegistry = Registry.as<IViewsRegistry>(ViewContainerExtensions.ViewsRegistry);
viewsRegistry.registerViews([{
	id: VIBE_CHAT_VIEW_ID,
	name: localize2('vibeChat', 'Vibe Chat'),
	containerIcon: vibeChatIcon,
	canToggleVisibility: true,
	canMoveView: true,
	ctorDescriptor: new SyncDescriptor(VibeChatViewPane),
}], VIEW_CONTAINER);

// Register the service
registerSingleton(IVibeChatService, VibeChatService, InstantiationType.Delayed);

// Register preview editor
const editorPaneRegistry = Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane);
editorPaneRegistry.registerEditorPane(
	EditorPaneDescriptor.create(
		VibeChatPreviewEditor,
		VibeChatPreviewEditor.ID,
		localize('vibeChatPreview', "Vibe Chat Preview")
	),
	[new SyncDescriptor(VibeChatPreviewInput)]
);

// Register command to open Vibe Chat
class OpenVibeChatAction extends Action2 {
	constructor() {
		super({
			id: 'vibeChat.open',
			title: localize2('openVibeChat', 'Open Vibe Chat'),
			category: Categories.View,
			f1: true,
			keybinding: {
				primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyV,
				weight: KeybindingWeight.WorkbenchContrib
			}
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const viewsService = accessor.get(IViewsService);
		const viewDescriptorService = accessor.get(IViewDescriptorService);
		const paneCompositeService = accessor.get(IPaneCompositePartService);

		// Get the view container for Vibe Chat
		const viewContainer = viewDescriptorService.getViewContainerByViewId(VIBE_CHAT_VIEW_ID);
		if (!viewContainer) {
			return;
		}

		// Check if Vibe Chat is in the auxiliary bar
		const location = viewDescriptorService.getViewContainerLocation(viewContainer);
		if (location === ViewContainerLocation.AuxiliaryBar) {
			// Close other containers in auxiliary bar before opening Vibe Chat
			const activeComposite = paneCompositeService.getActivePaneComposite(ViewContainerLocation.AuxiliaryBar);
			if (activeComposite && activeComposite.getId() !== viewContainer.id) {
				await viewsService.closeViewContainer(activeComposite.getId());
			}
		}

		await viewsService.openView(VIBE_CHAT_VIEW_ID, true);
	}
}

registerAction2(OpenVibeChatAction);

