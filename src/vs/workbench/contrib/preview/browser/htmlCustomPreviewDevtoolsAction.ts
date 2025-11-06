/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize2 } from '../../../../nls.js';
import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { INativeHostService } from '../../../../platform/native/common/native.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { ActiveEditorContext } from '../../../common/contextkeys.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';

/**
 * Action to toggle DevTools for the custom preview editor
 * Only visible when a custom preview editor is active
 */
export class HtmlCustomPreviewDevtoolsAction extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.htmlCustomPreview.toggleDevtools',
			title: localize2('toggleCustomPreviewDevtools', 'Toggle DevTools'),
			category: Categories.Developer,
			icon: Codicon.debugConsole,
			menu: [{
				id: MenuId.EditorTitle,
				group: 'navigation',
				order: 100,
				when: ContextKeyExpr.and(
					ActiveEditorContext.isEqualTo('workbench.editor.htmlCustomPreview')
				)
			}]
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const nativeHostService = accessor.get(INativeHostService);

		try {
			console.info('Toggling DevTools for custom preview editor');
			// Use the native host service to toggle devtools for the current window
			// This will open devtools for the entire VSCode window, allowing inspection of the webview
			await nativeHostService.toggleDevTools();
			console.info('DevTools toggled successfully');
		} catch (error) {
			console.error('Failed to toggle devtools:', error);
		}
	}
}

registerAction2(HtmlCustomPreviewDevtoolsAction);
