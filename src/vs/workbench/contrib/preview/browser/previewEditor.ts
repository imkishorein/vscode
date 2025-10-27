/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/previewEditor.css';
import { Dimension, getWindow } from '../../../../base/browser/dom.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { URI } from '../../../../base/common/uri.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { IEditorOpenContext, IUntypedEditorInput } from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';
import { IWebviewService, IWebviewElement } from '../../webview/browser/webview.js';
import { ITextFileService, ITextFileSaveEvent, ITextFileEditorModel, snapshotToString } from '../../../services/textfile/common/textfiles.js';
import { IDisposable } from '../../../../base/common/lifecycle.js';

export interface IPreviewEditorOptions extends IEditorOptions {
	readonly previewTitle?: string;
}

export class PreviewEditorInput extends EditorInput {
	static readonly ID = 'workbench.input.previewEditor';

	constructor(
		public readonly previewTitle: string
	) {
		super();
	}

	override get typeId(): string {
		return PreviewEditorInput.ID;
	}

	override getName(): string {
		return this.previewTitle;
	}

	override get resource(): URI | undefined {
		return URI.from({ scheme: 'preview', path: this.previewTitle });
	}

	override matches(otherInput: EditorInput | IUntypedEditorInput): boolean {
		if (otherInput instanceof PreviewEditorInput) {
			return otherInput.previewTitle === this.previewTitle;
		}
		return false;
	}
}

export class PreviewEditor extends EditorPane {
	static readonly ID = 'workbench.editor.previewEditor';

	private container: HTMLElement | undefined;
	private currentPreviewNumber: string | undefined;
	private currentHtmlPath: URI | undefined;
	private webview: IWebviewElement | undefined;
	private modelListener: IDisposable | undefined;
	private webviewDisposable: IDisposable | undefined;

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IFileService private readonly fileService: IFileService,
		@IWebviewService private readonly webviewService: IWebviewService,
		@ITextFileService private readonly textFileService: ITextFileService
	) {
		super(PreviewEditor.ID, group, telemetryService, themeService, storageService);
		
		// Watch for file changes on disk
		this._register(this.fileService.onDidFilesChange(event => {
			if (this.currentPreviewNumber) {
				const htmlPath = URI.file(`/Users/kishore.v/Dev/vscode/.preview-samples/preview${this.currentPreviewNumber}.html`);
				// Check if the current HTML file was updated
				if (event.contains(htmlPath)) {
					this.render(this.input instanceof PreviewEditorInput ? this.input.previewTitle : '');
				}
			}
		}));
		
		// Watch for file saves in the editor (covers save from outside text model listener)
		this._register(this.textFileService.files.onDidSave((e: ITextFileSaveEvent) => {
			// Check if the saved file matches the current preview
			if (this.currentPreviewNumber) {
				const expectedPath = `/Users/kishore.v/Dev/vscode/.preview-samples/preview${this.currentPreviewNumber}.html`;
				if (e.model.resource.fsPath === expectedPath) {
					this.render(this.input instanceof PreviewEditorInput ? this.input.previewTitle : '');
				}
			}
		}));
	}

	override async setInput(input: EditorInput, options: IEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);
		if (input instanceof PreviewEditorInput) {
			// Extract preview number from title (e.g., "Preview 1" -> "1")
			const match = input.previewTitle.match(/\d+/);
			this.currentPreviewNumber = match ? match[0] : undefined;
			this.render(input.previewTitle);
		}
	}

	protected createEditor(parent: HTMLElement): void {
		this.container = parent;
		this.container.classList.add('preview-editor');
		
		// Add controls to title area after a short delay to ensure DOM is ready
		setTimeout(() => this.createTitleAreaControls(), 100);
	}

	private createTitleAreaControls(): void {
		// Find the parent editor group which contains the title area
		const editorGroup = this.container?.closest('.editor-group-container') as HTMLElement;
		if (!editorGroup) {
			return;
		}

		// Find the title area within the editor group
		const titleArea = editorGroup.querySelector('.editor-title') as HTMLElement;
		if (!titleArea || titleArea.classList.contains('preview-title-area-modified')) {
			return;
		}

		titleArea.classList.add('preview-title-area-modified');
		
		// Create controls container on the right
		const controlsContainer = document.createElement('div');
		controlsContainer.className = 'preview-title-controls';
		
		// Create dropdown
		const dropdown = document.createElement('select');
		dropdown.className = 'mode-dropdown-select';
		dropdown.innerHTML = `
			<option value="code">Code</option>
			<option value="preview" selected>Preview</option>
		`;
		
		controlsContainer.appendChild(dropdown);
		titleArea.appendChild(controlsContainer);
	}

	private async render(title: string): Promise<void> {
		if (!this.container) {
			return;
		}

		// Dispose existing webview to ensure clean state
		if (this.webview) {
			this.webviewDisposable?.dispose();
			this.webview = undefined;
			this.webviewDisposable = undefined;
		}

		// Clear existing content
		while (this.container.firstChild) {
			this.container.removeChild(this.container.firstChild);
		}

		// Load the HTML file content
		if (this.currentPreviewNumber) {
			const htmlPath = URI.file(`/Users/kishore.v/Dev/vscode/.preview-samples/preview${this.currentPreviewNumber}.html`);
			this.currentHtmlPath = htmlPath;
			try {
				const model = await this.textFileService.files.resolve(htmlPath);
				const htmlContent = this.getModelContent(model);
				this.updateWebviewContent(htmlContent, title);
				this.registerModelListener(model, title, htmlPath);
			} catch (error) {
				try {
					const fileContent = await this.fileService.readFile(htmlPath);
					const htmlContent = fileContent.value.toString();
					this.updateWebviewContent(htmlContent, title);
				} catch (readError) {
					// Show error message if file cannot be read
					const errorDiv = document.createElement('div');
					errorDiv.textContent = `Error loading preview: ${readError}`;
					errorDiv.style.color = 'var(--vscode-errorForeground)';
					errorDiv.style.padding = '20px';
					this.container.appendChild(errorDiv);
				}
			}
		}
	}

	private registerModelListener(model: ITextFileEditorModel, title: string, resource: URI): void {
		this.modelListener?.dispose();
		const listener = model.onDidChangeContent(() => {
			if (this.currentHtmlPath && this.currentHtmlPath.fsPath === resource.fsPath) {
				const htmlContent = this.getModelContent(model);
				this.updateWebviewContent(htmlContent, title);
			}
		});
		this.modelListener = this._register(listener);
	}

	private getModelContent(model: ITextFileEditorModel): string {
		const textEditorModel = model.textEditorModel;
		if (textEditorModel) {
			return textEditorModel.getValue();
		}
		const snapshot = model.createSnapshot();
		return snapshot ? snapshotToString(snapshot) : '';
	}

	private updateWebviewContent(htmlContent: string, title: string): void {
		if (!this.container) {
			return;
		}
		// Create webview only if it doesn't exist
		if (!this.webview) {
			this.webview = this.webviewService.createWebviewElement({
				title: title,
				options: {},
				contentOptions: {
					allowScripts: true,
					allowForms: true,
					localResourceRoots: []
				},
				extension: undefined
			});
			this.webviewDisposable = this._register(this.webview);
			this.webview.mountTo(this.container, getWindow(this.container));
		}
		// Update HTML content without recreating webview
		this.webview.setHtml(htmlContent);
	}

	override layout(dimension: Dimension): void {
		if (this.webview) {
			// Webview handles its own layout
		}
	}

	override focus(): void {
		if (this.webview) {
			this.webview.focus();
		}
	}

	override clearInput(): void {
		this.modelListener?.dispose();
		this.modelListener = undefined;
		this.webviewDisposable?.dispose();
		this.webviewDisposable = undefined;
		this.webview = undefined;
		if (this.container) {
			while (this.container.firstChild) {
				this.container.removeChild(this.container.firstChild);
			}
		}
		super.clearInput();
	}
}

