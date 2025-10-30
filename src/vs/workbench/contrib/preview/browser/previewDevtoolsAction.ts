/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { localize2 } from '../../../../nls.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { INativeHostService } from '../../../../platform/native/common/native.js';

export class PreviewDevtoolsAction extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.preview.openDevtools',
			title: localize2('openPreviewDevtools', 'Toggle DevTools'),
			category: Categories.Developer,
			icon: Codicon.debugConsole,
			menu: [
				{
					id: MenuId.ViewTitle,
					group: 'navigation',
					order: 100,
					when: undefined // Will be shown for all view titles
				}
			]
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const nativeHostService = accessor.get(INativeHostService);

		try {
			console.info('Toggling DevTools for preview webview');
			// Use the native host service to toggle devtools for the current window
			// This will open devtools for the entire VSCode window, allowing inspection of the webview
			await nativeHostService.toggleDevTools();
			console.info('DevTools toggled successfully');
		} catch (error) {
			console.error('Failed to toggle devtools:', error);
		}
	}
}

// Register the action
registerAction2(PreviewDevtoolsAction);
