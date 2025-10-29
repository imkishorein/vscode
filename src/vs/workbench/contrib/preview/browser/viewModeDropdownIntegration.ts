/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * ViewModeDropdownIntegration - Integrates ViewModeDropdownRenderer with the actual dropdown UI
 * 
 * This module:
 * 1. Finds or creates the dropdown element in the editor title
 * 2. Instantiates ViewModeDropdownRenderer
 * 3. Connects the renderer to the dropdown element
 * 4. Manages the lifecycle of the renderer
 */

import { IWorkbenchLayoutService } from '../../../services/layout/browser/layoutService.js';
import { IViewModeManager } from './viewModeManager.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { ViewModeDropdownRenderer } from './viewModeDropdownRenderer.js';

export function setupViewModeDropdown(
	layoutService: IWorkbenchLayoutService,
	viewModeManager: IViewModeManager,
	commandService: ICommandService,
	editorTitleElement: HTMLElement
): ViewModeDropdownRenderer {
	// Find or create the dropdown element
	let dropdown = editorTitleElement.querySelector('.view-mode-dropdown-select') as HTMLSelectElement;
	
	if (!dropdown) {
		// Create the dropdown if it doesn't exist
		const controlsContainer = document.createElement('div');
		controlsContainer.className = 'preview-title-controls';
		
		dropdown = document.createElement('select');
		dropdown.className = 'view-mode-dropdown-select';
		dropdown.innerHTML = `
			<option value="code">Code</option>
			<option value="preview" selected>Preview</option>
			<option value="code-and-preview">Code + Preview</option>
		`;
		
		controlsContainer.appendChild(dropdown);
		editorTitleElement.appendChild(controlsContainer);
	}

	// Create the renderer
	const renderer = new ViewModeDropdownRenderer(layoutService, viewModeManager, commandService);
	
	// Connect the renderer to the dropdown element
	renderer.setDropdownElement(dropdown);
	
	return renderer;
}
