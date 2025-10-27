/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize, localize2 } from '../../../../nls.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import {
	IViewContainersRegistry,
	IViewDescriptor,
	IViewsRegistry,
	Extensions,
	ViewContainer,
	ViewContainerLocation
} from '../../../common/views.js';
import { PreviewView } from './previewView.js';
import { PreviewEditor, PreviewEditorInput } from './previewEditor.js';
import { EditorExtensions } from '../../../common/editor.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';

// Register icon
const previewViewIcon = registerIcon('preview-view-icon', Codicon.play, localize('previewViewIcon', 'View icon of the preview view.'));

// View IDs
export const PREVIEW_CONTAINER_ID = 'workbench.view.preview';
export const PREVIEW_VIEW_ID = 'workbench.view.preview.main';

// Register view container
const VIEW_CONTAINER: ViewContainer = Registry.as<IViewContainersRegistry>(Extensions.ViewContainersRegistry).registerViewContainer({
	id: PREVIEW_CONTAINER_ID,
	title: localize2('preview', "Preview"),
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [PREVIEW_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
	storageId: PREVIEW_CONTAINER_ID,
	icon: previewViewIcon,
	hideIfEmpty: false,
	order: 5,
}, ViewContainerLocation.Sidebar, { isDefault: true });

// Register view
const viewDescriptor: IViewDescriptor = {
	id: PREVIEW_VIEW_ID,
	name: localize2('previewView', "Preview"),
	containerIcon: previewViewIcon,
	ctorDescriptor: new SyncDescriptor(PreviewView),
	canToggleVisibility: true,
	canMoveView: true,
	collapsed: false,
};

Registry.as<IViewsRegistry>(Extensions.ViewsRegistry).registerViews([viewDescriptor], VIEW_CONTAINER);

// Register editor pane
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		PreviewEditor,
		PreviewEditor.ID,
		localize('previewEditor', "Preview Editor")
	),
	[
		new SyncDescriptor(PreviewEditorInput)
	]
);

