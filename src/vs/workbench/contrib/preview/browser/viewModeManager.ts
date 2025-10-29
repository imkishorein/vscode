/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * ViewModeManager - Manages the view mode state for the preview feature
 * 
 * View Modes:
 * - 'preview-only': Shows only preview in editor panel
 * - 'split-view': Shows HTML in editor + Preview in auxiliary panel
 * - 'code-only': Shows only HTML code in editor
 */

import { Emitter, Event } from '../../../../base/common/event.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export type ViewMode = 'preview-only' | 'split-view' | 'code-only';

export interface IViewModeManager {
	readonly onDidChangeMode: Event<ViewMode>;
	readonly currentMode: ViewMode;
	setMode(mode: ViewMode): void;
}

export const IViewModeManager = createDecorator<IViewModeManager>('viewModeManager');

export class ViewModeManager implements IViewModeManager {
	private _currentMode: ViewMode = 'preview-only';
	private _onDidChangeMode = new Emitter<ViewMode>();

	readonly onDidChangeMode: Event<ViewMode> = this._onDidChangeMode.event;

	get currentMode(): ViewMode {
		return this._currentMode;
	}

	setMode(mode: ViewMode): void {
		if (this._currentMode !== mode) {
			this._currentMode = mode;
			this._onDidChangeMode.fire(mode);
		}
	}

	dispose(): void {
		this._onDidChangeMode.dispose();
	}
}
