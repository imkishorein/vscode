/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * ViewModeDropdownRenderer - Renders and manages the view mode dropdown in editor title
 * 
 * Responsibilities:
 * 1. Listen to auxiliary bar visibility changes
 * 2. Update dropdown value when auxiliary bar is closed
 * 3. Handle dropdown selection changes
 */

import { Disposable, IDisposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';
import { IViewModeManager } from './viewModeManager.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { 
	SET_VIEW_MODE_CODE_COMMAND_ID, 
	SET_VIEW_MODE_PREVIEW_COMMAND_ID, 
	SET_VIEW_MODE_CODE_AND_PREVIEW_COMMAND_ID 
} from './viewModeDropdownControl.js';

export class ViewModeDropdownRenderer extends Disposable {
	private dropdown: HTMLSelectElement | undefined;
	private changeListener: IDisposable | undefined;

	constructor(
		private readonly layoutService: IWorkbenchLayoutService,
		private readonly viewModeManager: IViewModeManager,
		private readonly commandService: ICommandService
	) {
		super();

		// Listen to auxiliary bar visibility changes
		this._register(this.layoutService.onDidChangePartVisibility(() => {
			this.onAuxiliaryBarVisibilityChanged();
		}));

		// Listen to view mode changes
		this._register(this.viewModeManager.onDidChangeMode((mode) => {
			this.updateDropdownValue(mode);
		}));
	}

	/**
	 * Called when auxiliary bar visibility changes
	 * If auxiliary bar is hidden, change dropdown to "Preview"
	 */
	private onAuxiliaryBarVisibilityChanged(): void {
		const isAuxiliaryBarVisible = this.layoutService.isVisible(Parts.AUXILIARYBAR_PART);
		
		if (!isAuxiliaryBarVisible && this.viewModeManager.currentMode === 'split-view') {
			// Auxiliary bar was closed, switch to preview-only mode
			this.viewModeManager.setMode('preview-only');
			this.updateDropdownValue('preview-only');
		}
	}

	/**
	 * Update dropdown UI to reflect current mode
	 */
	private updateDropdownValue(mode: string): void {
		if (!this.dropdown) {
			return;
		}

		switch (mode) {
			case 'code-only':
				this.dropdown.value = 'code';
				break;
			case 'preview-only':
				this.dropdown.value = 'preview';
				break;
			case 'split-view':
				this.dropdown.value = 'code-and-preview';
				break;
		}
	}

	/**
	 * Set the dropdown element to manage
	 */
	setDropdownElement(dropdown: HTMLSelectElement): void {
		this.dropdown = dropdown;
		
		// Remove old listener if exists
		if (this.changeListener) {
			this.changeListener.dispose();
		}

		// Add change listener
		const listener = {
			dispose: () => {
				if (this.dropdown) {
					this.dropdown.removeEventListener('change', this.onDropdownChange);
				}
			}
		};
		this.changeListener = listener;
		this._register(listener);

		this.dropdown.addEventListener('change', this.onDropdownChange);
	}

	/**
	 * Handle dropdown selection change
	 */
	private onDropdownChange = async (): Promise<void> => {
		if (!this.dropdown) {
			return;
		}

		const value = this.dropdown.value;

		switch (value) {
			case 'code':
				await this.commandService.executeCommand(SET_VIEW_MODE_CODE_COMMAND_ID);
				break;
			case 'preview':
				await this.commandService.executeCommand(SET_VIEW_MODE_PREVIEW_COMMAND_ID);
				break;
			case 'code-and-preview':
				await this.commandService.executeCommand(SET_VIEW_MODE_CODE_AND_PREVIEW_COMMAND_ID);
				break;
		}
	};
}
