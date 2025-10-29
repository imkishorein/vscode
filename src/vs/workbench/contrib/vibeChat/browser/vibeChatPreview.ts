/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { IEditorService, SIDE_GROUP } from '../../../services/editor/common/editorService.js';
import { URI } from '../../../../base/common/uri.js';
import { IWebviewService, WebviewContentPurpose } from '../../../contrib/webview/browser/webview.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { IEditorOpenContext } from '../../../common/editor.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';

export class VibeChatPreviewInput extends EditorInput {
	static readonly ID = 'workbench.input.vibeChatPreview';

	constructor(
		public readonly htmlContent: string,
		private readonly previewId: string
	) {
		super();
	}

	override get typeId(): string {
		return VibeChatPreviewInput.ID;
	}

	override getName(): string {
		return 'Preview';
	}

	override get resource(): URI | undefined {
		return undefined;
	}

	override matches(other: EditorInput): boolean {
		return other instanceof VibeChatPreviewInput && other.previewId === this.previewId;
	}
}

export class VibeChatPreviewEditor extends EditorPane {
	static readonly ID = 'workbench.editor.vibeChatPreview';

	private webviewElement: any;
	private dropdownElement: HTMLSelectElement | undefined;

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IWebviewService private readonly webviewService: IWebviewService,
		@IEditorService private readonly editorService: IEditorService
	) {
		super(VibeChatPreviewEditor.ID, group, telemetryService, themeService, storageService);
	}

	protected createEditor(parent: HTMLElement): void {
		// Create dropdown controls
		this.createDropdownControls(parent);
	}

	private createDropdownControls(parent: HTMLElement): void {
		// Wait a bit for the editor group to be ready, then inject the dropdown
		setTimeout(() => {
			const editorGroup = parent.closest('.editor-group-container') as HTMLElement;
			if (!editorGroup) {
				return;
			}

			const titleArea = editorGroup.querySelector('.editor-title') as HTMLElement;
			if (!titleArea || titleArea.classList.contains('vibe-preview-title-modified')) {
				return;
			}

			titleArea.classList.add('vibe-preview-title-modified');

			// Create controls container
			const controlsContainer = document.createElement('div');
			controlsContainer.className = 'preview-title-controls';
			controlsContainer.style.cssText = 'display: flex; align-items: center; margin-left: auto; padding-right: 8px;';

			// Create dropdown
			this.dropdownElement = document.createElement('select');
			this.dropdownElement.className = 'mode-dropdown-select';
			this.dropdownElement.style.cssText = `
				padding: 4px 8px;
				background-color: var(--vscode-dropdown-background);
				color: var(--vscode-dropdown-foreground);
				border: 1px solid var(--vscode-dropdown-border);
				border-radius: 3px;
				font-size: 13px;
				cursor: pointer;
				outline: none;
			`;

			const codeOption = document.createElement('option');
			codeOption.value = 'code';
			codeOption.textContent = 'Code';

			const previewOption = document.createElement('option');
			previewOption.value = 'preview';
			previewOption.textContent = 'Preview';
			previewOption.selected = true;

			this.dropdownElement.appendChild(codeOption);
			this.dropdownElement.appendChild(previewOption);

			// Handle dropdown change
			this.dropdownElement.addEventListener('change', () => {
				if (this.dropdownElement?.value === 'code') {
					// Switch to code view - close preview
					this.editorService.closeEditor({ editor: this.input as any, groupId: this.group!.id });
				}
			});

			controlsContainer.appendChild(this.dropdownElement);

			// Find the actions toolbar and insert before it
			const actionsToolbar = titleArea.querySelector('.editor-actions');
			if (actionsToolbar) {
				titleArea.insertBefore(controlsContainer, actionsToolbar);
			} else {
				titleArea.appendChild(controlsContainer);
			}
		}, 100);
	}

	override async setInput(input: VibeChatPreviewInput, options: any, context: IEditorOpenContext, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);

		const container = this.getContainer();
		if (!this.webviewElement && container) {
			this.webviewElement = this.webviewService.createWebviewElement({
				title: 'Vibe Chat Preview',
				options: {
					enableFindWidget: false,
					purpose: WebviewContentPurpose.NotebookRenderer
				},
				contentOptions: {
					allowScripts: true
				},
				extension: undefined
			});

			this.webviewElement.mountTo(container, window);
		}

		if (this.webviewElement) {
			this.webviewElement.setHtml(input.htmlContent);
		}
	}

	override clearInput(): void {
		super.clearInput();
	}

	override focus(): void {
		super.focus();
		if (this.webviewElement) {
			this.webviewElement.focus();
		}
	}

	override layout(dimension: any): void {
		// Webview layout is handled automatically
	}

	protected override saveState(): void {
		// No state to save for preview
	}
}

export class VibeChatPreviewService extends Disposable {
	constructor(
		@IEditorService private readonly editorService: IEditorService,
		@IFileService private readonly fileService: IFileService
	) {
		super();
	}

	async openPreview(htmlFileUri: URI): Promise<void> {
		// Wait a bit for the file to be fully generated
		await this.delay(500);

		// Read the HTML content
		const content = await this.fileService.readFile(htmlFileUri);
		const htmlContent = content.value.toString();

		// Create and open the preview input
		const previewInput = new VibeChatPreviewInput(htmlContent, generateUuid());

		await this.editorService.openEditor(previewInput, {
			pinned: true,
			preserveFocus: false
		}, SIDE_GROUP);
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

