/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * View IDs and constants for preview feature
 * 
 * Naming Convention:
 * - PREVIEW_* = PreviewPrimarySidebarView (primary sidebar, left side) ✅ REGISTERED
 * - AUXILIARY_PREVIEW_* = PreviewAuxiliaryPanel (auxiliary sidebar, right side) ✅ REGISTERED
 * 
 * See NAMING_CONVENTIONS.md for complete documentation
 */

// PreviewPrimarySidebarView - Primary sidebar (left side) ✅ REGISTERED
export const PREVIEW_CONTAINER_ID = 'workbench.view.preview';
export const PREVIEW_VIEW_ID = 'workbench.view.preview.main';

// PreviewAuxiliaryPanel - Auxiliary sidebar (right side)
export const AUXILIARY_PREVIEW_CONTAINER_ID = 'workbench.view.auxiliaryPreview';
export const AUXILIARY_PREVIEW_VIEW_ID = 'workbench.view.auxiliaryPreview.main';
