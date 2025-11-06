/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../nls.js';
import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { IInstantiationService, ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { URI } from '../../../../base/common/uri.js';
import { ResourceContextKey } from '../../../common/contextkeys.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';
import { HtmlCustomPreviewEditorInput } from './htmlCustomPreviewEditorProvider.js';

/**
 * Action to open HTML files with the new custom preview editor
 * Only available for preview1.html through preview5.html
 */
class OpenWithCustomPreviewEditorAction extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.openWithCustomPreviewEditor',
			title: localize('openWithCustomPreviewEditor', 'Open with new Preview editor'),
			menu: [{
				id: MenuId.ExplorerContext,
				group: '5_cutcopypaste',
				order: 2,
				when: ContextKeyExpr.and(
					ResourceContextKey.Extension.isEqualTo('.html'),
					ContextKeyExpr.regex('resourceFilename', /preview[1-5]\.html$/)
				)
			}]
		});
	}

	async run(accessor: ServicesAccessor, resource?: URI): Promise<void> {
		if (!resource) {
			return;
		}

		const editorService = accessor.get(IEditorService);

		// Create and open custom preview editor input
		const input = accessor.get(IInstantiationService).createInstance(HtmlCustomPreviewEditorInput, resource);
		await editorService.openEditor(input, { pinned: true });
	}
}

registerAction2(OpenWithCustomPreviewEditorAction);
