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
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { EditorExtensions } from '../../../common/editor.js';
import { AuxiliaryPreviewView } from './auxiliaryPreviewView.js';
import { PreviewView } from './previewView.js';
import { PreviewEditor, PreviewEditorInput } from './previewEditor.js';
import './previewActions.contribution.js';
import './previewDevtoolsAction.js';
import './viewModeDropdownControl.js';
import { IViewModeManager, ViewModeManager } from './viewModeManager.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';

// Register icon
const previewViewIcon = registerIcon('preview-view-icon', Codicon.play, localize('previewViewIcon', 'View icon of the preview view.'));

// View IDs - Primary Sidebar
export const PREVIEW_CONTAINER_ID = 'workbench.view.preview';
export const PREVIEW_VIEW_ID = 'workbench.view.preview.main';

// View IDs - Auxiliary Sidebar
export const AUXILIARY_PREVIEW_CONTAINER_ID = 'workbench.view.auxiliaryPreview';
export const AUXILIARY_PREVIEW_VIEW_ID = 'workbench.view.auxiliaryPreview.main';

// Register primary preview view container for the left primary sidebar
const PRIMARY_VIEW_CONTAINER: ViewContainer = Registry.as<IViewContainersRegistry>(Extensions.ViewContainersRegistry).registerViewContainer({
	id: PREVIEW_CONTAINER_ID,
	title: localize2('preview', "Preview"),
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [PREVIEW_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
	storageId: PREVIEW_CONTAINER_ID,
	icon: previewViewIcon,
	hideIfEmpty: false,
	order: 5, // Position in sidebar (after Explorer, Search, Source Control, Run/Debug)
}, ViewContainerLocation.Sidebar, { isDefault: false });

// Register primary preview view
const primaryViewDescriptor: IViewDescriptor = {
	id: PREVIEW_VIEW_ID,
	name: localize2('previewView', "Preview"),
	containerIcon: previewViewIcon,
	ctorDescriptor: new SyncDescriptor(PreviewView),
	canToggleVisibility: true,
	canMoveView: true,
	collapsed: false,
};

Registry.as<IViewsRegistry>(Extensions.ViewsRegistry).registerViews([primaryViewDescriptor], PRIMARY_VIEW_CONTAINER);

// Register auxiliary preview view container for the right auxiliary panel
const AUXILIARY_VIEW_CONTAINER: ViewContainer = Registry.as<IViewContainersRegistry>(Extensions.ViewContainersRegistry).registerViewContainer({
	id: AUXILIARY_PREVIEW_CONTAINER_ID,
	title: localize2('auxiliaryPreview', "Preview"),
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [AUXILIARY_PREVIEW_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
	storageId: AUXILIARY_PREVIEW_CONTAINER_ID,
	icon: previewViewIcon,
	hideIfEmpty: false,
	order: 1,
}, ViewContainerLocation.AuxiliaryBar, { isDefault: false });

// Register auxiliary preview view
const auxiliaryViewDescriptor: IViewDescriptor = {
	id: AUXILIARY_PREVIEW_VIEW_ID,
	name: localize2('auxiliaryPreviewView', "Preview"),
	containerIcon: previewViewIcon,
	ctorDescriptor: new SyncDescriptor(AuxiliaryPreviewView),
	canToggleVisibility: false,
	canMoveView: false,
	collapsed: false,
};

Registry.as<IViewsRegistry>(Extensions.ViewsRegistry).registerViews([auxiliaryViewDescriptor], AUXILIARY_VIEW_CONTAINER);

// Register PreviewEditor as an editor pane
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		PreviewEditor,
		PreviewEditor.ID,
		localize('previewEditor', "Preview Editor")
	),
	[new SyncDescriptor(PreviewEditorInput)]
);

// Register ViewModeManager service
registerSingleton(IViewModeManager, ViewModeManager, InstantiationType.Eager);
