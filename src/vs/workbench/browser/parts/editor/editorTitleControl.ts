/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/editortitlecontrol.css';
import { $, Dimension, clearNode } from '../../../../base/browser/dom.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IThemeService, Themable } from '../../../../platform/theme/common/themeService.js';
import { BreadcrumbsControl, BreadcrumbsControlFactory } from './breadcrumbsControl.js';
import { IEditorGroupsView, IEditorGroupTitleHeight, IEditorGroupView, IEditorPartsView, IInternalEditorOpenOptions } from './editor.js';
import { IEditorTabsControl } from './editorTabsControl.js';
import { MultiEditorTabsControl } from './multiEditorTabsControl.js';
import { SingleEditorTabsControl } from './singleEditorTabsControl.js';
import { IEditorPartOptions } from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { MultiRowEditorControl } from './multiRowEditorTabsControl.js';
import { IReadonlyEditorGroupModel } from '../../../common/editor/editorGroupModel.js';
import { NoEditorTabsControl } from './noEditorTabsControl.js';
import { IEditorService, SIDE_GROUP } from '../../../services/editor/common/editorService.js';
import { PreviewEditorInput } from '../../../contrib/preview/browser/previewEditor.js';
import { URI } from '../../../../base/common/uri.js';

export interface IEditorTitleControlDimensions {

	/**
	 * The size of the parent container the title control is layed out in.
	 */
	readonly container: Dimension;

	/**
	 * The maximum size the title control is allowed to consume based on
	 * other controls that are positioned inside the container.
	 */
	readonly available: Dimension;
}

export class EditorTitleControl extends Themable {

	private editorTabsControl: IEditorTabsControl;
	private readonly editorTabsControlDisposable = this._register(new DisposableStore());

	private breadcrumbsControlFactory: BreadcrumbsControlFactory | undefined;
	private readonly breadcrumbsControlDisposables = this._register(new DisposableStore());
	private get breadcrumbsControl() { return this.breadcrumbsControlFactory?.control; }

	private modeSwitcherContainer: HTMLElement | undefined;
	private modeSwitcherSelect: HTMLSelectElement | undefined;
	private static readonly MODE_SWITCHER_HEIGHT = 30;

	constructor(
		private readonly parent: HTMLElement,
		private readonly editorPartsView: IEditorPartsView,
		private readonly groupsView: IEditorGroupsView,
		private readonly groupView: IEditorGroupView,
		private readonly model: IReadonlyEditorGroupModel,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IThemeService themeService: IThemeService,
		@IEditorService private readonly editorService: IEditorService
	) {
		super(themeService);

		this.editorTabsControl = this.createEditorTabsControl();
		this.breadcrumbsControlFactory = this.createBreadcrumbsControl();
		this.modeSwitcherContainer = this.createModeSwitcherBar();
	}

	private createEditorTabsControl(): IEditorTabsControl {
		let tabsControlType;
		switch (this.groupsView.partOptions.showTabs) {
			case 'none':
				tabsControlType = NoEditorTabsControl;
				break;
			case 'single':
				tabsControlType = SingleEditorTabsControl;
				break;
			case 'multiple':
			default:
				tabsControlType = this.groupsView.partOptions.pinnedTabsOnSeparateRow ? MultiRowEditorControl : MultiEditorTabsControl;
				break;
		}

		const control = this.instantiationService.createInstance(tabsControlType, this.parent, this.editorPartsView, this.groupsView, this.groupView, this.model);
		return this.editorTabsControlDisposable.add(control);
	}

	private createBreadcrumbsControl(): BreadcrumbsControlFactory | undefined {
		if (this.groupsView.partOptions.showTabs === 'single') {
			return undefined; // Single tabs have breadcrumbs inlined. No tabs have no breadcrumbs.
		}

		// Breadcrumbs container
		const breadcrumbsContainer = $('.breadcrumbs-below-tabs');
		this.parent.appendChild(breadcrumbsContainer);

		const breadcrumbsControlFactory = this.breadcrumbsControlDisposables.add(this.instantiationService.createInstance(BreadcrumbsControlFactory, breadcrumbsContainer, this.groupView, {
			showFileIcons: true,
			showSymbolIcons: true,
			showDecorationColors: false,
			showPlaceholder: true,
			dragEditor: false,
		}));

		// Breadcrumbs enablement & visibility change have an impact on layout
		// so we need to relayout the editor group when that happens.
		this.breadcrumbsControlDisposables.add(breadcrumbsControlFactory.onDidEnablementChange(() => this.groupView.relayout()));
		this.breadcrumbsControlDisposables.add(breadcrumbsControlFactory.onDidVisibilityChange(() => this.groupView.relayout()));

		return breadcrumbsControlFactory;
	}

	private createModeSwitcherBar(): HTMLElement | undefined {
		if (this.groupsView.partOptions.showTabs === 'single') {
			return undefined; // Only show for multiple tabs mode
		}

		// Mode switcher container
		const modeSwitcherContainer = $('.preview-mode-switcher-bar');
		this.parent.appendChild(modeSwitcherContainer);

		// Create dropdown container
		const dropdownContainer = $('.preview-mode-switcher-dropdown');
		modeSwitcherContainer.appendChild(dropdownContainer);

		// Create select element
		const select = document.createElement('select');
		select.className = 'mode-dropdown-select';

		const codeOption = document.createElement('option');
		codeOption.value = 'code';
		codeOption.textContent = 'Code';

		const previewOption = document.createElement('option');
		previewOption.value = 'preview';
		previewOption.textContent = 'Preview';

		const splitOption = document.createElement('option');
		splitOption.value = 'split';
		splitOption.textContent = 'Code + Preview';

		select.appendChild(codeOption);
		select.appendChild(previewOption);
		select.appendChild(splitOption);
		select.value = 'code';

		// Prevent focus loss when clicking the dropdown
		select.addEventListener('mousedown', (e) => {
			e.stopPropagation();
		});

		select.addEventListener('click', (e) => {
			e.stopPropagation();
		});

		// Prevent editor from stealing focus
		select.addEventListener('focus', (e) => {
			e.stopPropagation();
		});

		// Handle mode switching
		select.addEventListener('change', async (e) => {
			const target = e.target as HTMLSelectElement;
			const activeEditor = this.groupView.activeEditor;
			
			if (!activeEditor || !activeEditor.resource) {
				return;
			}

			// Check if this is a preview file or preview editor
			const isPreviewFile = activeEditor.resource.fsPath?.includes('.preview-samples/preview');
			const isPreviewEditor = activeEditor instanceof PreviewEditorInput;

			if (target.value === 'preview' && isPreviewFile) {
				// Switch from code to preview mode - replace current editor in same tab
				const match = activeEditor.resource.fsPath.match(/preview(\d+)\.html/);
				if (match) {
					const previewNumber = match[1];
					const previewInput = new PreviewEditorInput(`Preview ${previewNumber}`);
					// Use replaceEditors to replace in the same tab
					await this.editorService.replaceEditors([{
						editor: activeEditor,
						replacement: previewInput,
						forceReplaceDirty: false
					}], this.groupView);
				}
			} else if (target.value === 'code' && isPreviewEditor) {
				// Switch from preview to code mode - replace current editor in same tab
				const previewInput = activeEditor as PreviewEditorInput;
				const match = previewInput.previewTitle.match(/\d+/);
				if (match) {
					const previewNumber = match[0];
					const htmlFilePath = `/Users/kishore.v/Dev/vscode/.preview-samples/preview${previewNumber}.html`;
					// Use replaceEditors to replace in the same tab
					await this.editorService.replaceEditors([{
						editor: activeEditor,
						replacement: {
							resource: URI.file(htmlFilePath),
							options: { pinned: true }
						},
						forceReplaceDirty: false
					}], this.groupView);
				}
			} else if (target.value === 'split') {
				// Open split view with code on left and preview on right
				let previewNumber: string | undefined;
				
				if (isPreviewFile) {
					// Currently viewing code, extract preview number
					const match = activeEditor.resource.fsPath.match(/preview(\d+)\.html/);
					if (match) {
						previewNumber = match[1];
					}
				} else if (isPreviewEditor) {
					// Currently viewing preview, extract preview number
					const previewInput = activeEditor as PreviewEditorInput;
					const match = previewInput.previewTitle.match(/\d+/);
					if (match) {
						previewNumber = match[0];
					}
				}
				
				if (previewNumber) {
					const htmlFilePath = `/Users/kishore.v/Dev/vscode/.preview-samples/preview${previewNumber}.html`;
					const previewInput = new PreviewEditorInput(`Preview ${previewNumber}`);
					
					// Open code in current group and preview in side group
					await this.editorService.replaceEditors([{
						editor: activeEditor,
						replacement: {
							resource: URI.file(htmlFilePath),
							options: { pinned: true }
						},
						forceReplaceDirty: false
					}], this.groupView);
					
					// Open preview in side group
					await this.editorService.openEditor(previewInput, { pinned: true }, SIDE_GROUP);
				}
			}
		});

		dropdownContainer.appendChild(select);

		// Store reference to select element
		this.modeSwitcherSelect = select;

		return modeSwitcherContainer;
	}

	private updateModeSwitcher(): void {
		if (!this.modeSwitcherSelect) {
			return;
		}

		const activeEditor = this.groupView.activeEditor;
		if (!activeEditor) {
			return;
		}

		// Update dropdown based on current editor type
		if (activeEditor instanceof PreviewEditorInput) {
			this.modeSwitcherSelect.value = 'preview';
		} else if (activeEditor.resource?.fsPath?.includes('.preview-samples/preview')) {
			this.modeSwitcherSelect.value = 'code';
		}
		// Note: split mode is set by user action, not auto-detected
	}

	openEditor(editor: EditorInput, options?: IInternalEditorOpenOptions): void {
		const didChange = this.editorTabsControl.openEditor(editor, options);

		this.handleOpenedEditors(didChange);
	}

	openEditors(editors: EditorInput[]): void {
		const didChange = this.editorTabsControl.openEditors(editors);

		this.handleOpenedEditors(didChange);
	}

	private handleOpenedEditors(didChange: boolean): void {
		if (didChange) {
			this.breadcrumbsControl?.update();
		} else {
			this.breadcrumbsControl?.revealLast();
		}
		
		// Update mode switcher dropdown to reflect current editor
		this.updateModeSwitcher();
	}

	beforeCloseEditor(editor: EditorInput): void {
		return this.editorTabsControl.beforeCloseEditor(editor);
	}

	closeEditor(editor: EditorInput): void {
		this.editorTabsControl.closeEditor(editor);

		this.handleClosedEditors();
	}

	closeEditors(editors: EditorInput[]): void {
		this.editorTabsControl.closeEditors(editors);

		this.handleClosedEditors();
	}

	private handleClosedEditors(): void {
		if (!this.groupView.activeEditor) {
			this.breadcrumbsControl?.update();
		}
	}

	moveEditor(editor: EditorInput, fromIndex: number, targetIndex: number, stickyStateChange: boolean): void {
		return this.editorTabsControl.moveEditor(editor, fromIndex, targetIndex, stickyStateChange);
	}

	pinEditor(editor: EditorInput): void {
		return this.editorTabsControl.pinEditor(editor);
	}

	stickEditor(editor: EditorInput): void {
		return this.editorTabsControl.stickEditor(editor);
	}

	unstickEditor(editor: EditorInput): void {
		return this.editorTabsControl.unstickEditor(editor);
	}

	setActive(isActive: boolean): void {
		return this.editorTabsControl.setActive(isActive);
	}

	updateEditorSelections(): void {
		this.editorTabsControl.updateEditorSelections();
	}

	updateEditorLabel(editor: EditorInput): void {
		return this.editorTabsControl.updateEditorLabel(editor);
	}

	updateEditorDirty(editor: EditorInput): void {
		return this.editorTabsControl.updateEditorDirty(editor);
	}

	updateOptions(oldOptions: IEditorPartOptions, newOptions: IEditorPartOptions): void {
		// Update editor tabs control if options changed
		if (
			oldOptions.showTabs !== newOptions.showTabs ||
			(newOptions.showTabs !== 'single' && oldOptions.pinnedTabsOnSeparateRow !== newOptions.pinnedTabsOnSeparateRow)
		) {
			// Clear old
			this.editorTabsControlDisposable.clear();
			this.breadcrumbsControlDisposables.clear();
			clearNode(this.parent);

			// Create new
			this.editorTabsControl = this.createEditorTabsControl();
			this.breadcrumbsControlFactory = this.createBreadcrumbsControl();
			this.modeSwitcherContainer = this.createModeSwitcherBar();
		}

		// Forward into editor tabs control
		else {
			this.editorTabsControl.updateOptions(oldOptions, newOptions);
		}
	}

	layout(dimensions: IEditorTitleControlDimensions): Dimension {

		// Layout tabs control
		const tabsControlDimension = this.editorTabsControl.layout(dimensions);

		// Layout breadcrumbs if visible
		let breadcrumbsControlDimension: Dimension | undefined = undefined;
		if (this.breadcrumbsControl?.isHidden() === false) {
			breadcrumbsControlDimension = new Dimension(dimensions.container.width, BreadcrumbsControl.HEIGHT);
			this.breadcrumbsControl.layout(breadcrumbsControlDimension);
		}

		// Layout mode switcher bar if visible
		const modeSwitcherHeight = this.modeSwitcherContainer ? EditorTitleControl.MODE_SWITCHER_HEIGHT : 0;

		return new Dimension(
			dimensions.container.width,
			tabsControlDimension.height + (breadcrumbsControlDimension ? breadcrumbsControlDimension.height : 0) + modeSwitcherHeight
		);
	}

	getHeight(): IEditorGroupTitleHeight {
		const tabsControlHeight = this.editorTabsControl.getHeight();
		const breadcrumbsControlHeight = this.breadcrumbsControl?.isHidden() === false ? BreadcrumbsControl.HEIGHT : 0;
		const modeSwitcherHeight = this.modeSwitcherContainer ? EditorTitleControl.MODE_SWITCHER_HEIGHT : 0;

		return {
			total: tabsControlHeight + breadcrumbsControlHeight + modeSwitcherHeight,
			offset: tabsControlHeight
		};
	}
}
