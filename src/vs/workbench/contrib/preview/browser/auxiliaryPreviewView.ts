/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * PreviewAuxiliaryPanel - Renders preview in the auxiliary sidebar (right side)
 * 
 * Naming Convention:
 * - Component: PreviewAuxiliaryPanel
 * - Class: AuxiliaryPreviewView
 * - View ID: workbench.view.auxiliaryPreview.main
 * - Trigger: Select "Code + Preview" from ViewModeDropdownControl
 * - Location: Auxiliary bar (right side)
 * - Mode: 'split-view'
 * - Layout: HTML in editor panel (left) + Preview in auxiliary panel (right)
 */

import './media/preview.css';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { ViewPane, IViewPaneOptions } from '../../../browser/parts/views/viewPane.js';
import { IWebviewService, IWebviewElement } from '../../webview/browser/webview.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { ITextFileService, ITextFileEditorModel, snapshotToString } from '../../../services/textfile/common/textfiles.js';
import { URI } from '../../../../base/common/uri.js';
import { IDisposable } from '../../../../base/common/lifecycle.js';
import { getWindow } from '../../../../base/browser/dom.js';

export class AuxiliaryPreviewView extends ViewPane {
	private webview: IWebviewElement | undefined;
	private currentPreviewNumber: string | undefined;
	private currentHtmlPath: URI | undefined;
	private modelListener: IDisposable | undefined;
	private webviewDisposable: IDisposable | undefined;
	private container: HTMLElement | undefined;

	constructor(
		options: IViewPaneOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
		@IWebviewService private readonly webviewService: IWebviewService,
		@IFileService private readonly fileService: IFileService,
		@ITextFileService private readonly textFileService: ITextFileService
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);

		// Watch for file changes on disk
		this._register(this.fileService.onDidFilesChange(event => {
			if (this.currentPreviewNumber) {
				const htmlPath = URI.file(`/Users/kishore.v/Dev/vscode/.preview-samples/preview${this.currentPreviewNumber}.html`);
				if (event.contains(htmlPath)) {
					this.showPreview(this.currentPreviewNumber);
				}
			}
		}));

		// Watch for file saves in the editor
		this._register(this.textFileService.files.onDidSave((e) => {
			if (this.currentPreviewNumber) {
				const expectedPath = `/Users/kishore.v/Dev/vscode/.preview-samples/preview${this.currentPreviewNumber}.html`;
				if (e.model.resource.fsPath === expectedPath) {
					this.showPreview(this.currentPreviewNumber);
				}
			}
		}));
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		this.container = container;
		container.style.display = 'flex';
		container.style.flexDirection = 'column';
		container.style.height = '100%';
		container.style.overflow = 'hidden';

		// Add preview list section
		this.renderPreviewList(container);
	}

	private renderPreviewList(container: HTMLElement): void {
		const previewListDiv = document.createElement('div');
		previewListDiv.style.padding = '8px 12px';
		previewListDiv.style.borderBottom = '1px solid var(--vscode-panel-border)';
		previewListDiv.style.fontSize = '12px';
		previewListDiv.style.fontWeight = '500';
		previewListDiv.style.textTransform = 'uppercase';
		previewListDiv.style.letterSpacing = '0.5px';
		previewListDiv.style.color = 'var(--vscode-sideBar-foreground)';
		previewListDiv.textContent = 'Select Preview';
		container.appendChild(previewListDiv);

		const previewsDiv = document.createElement('div');
		previewsDiv.style.display = 'flex';
		previewsDiv.style.flexDirection = 'column';
		previewsDiv.style.padding = '4px 0';

		// Create buttons for previews 1-5
		for (let i = 1; i <= 5; i++) {
			const button = document.createElement('button');
			button.textContent = `Preview ${i}`;
			button.style.padding = '6px 12px';
			button.style.margin = '2px 4px';
			button.style.border = '1px solid var(--vscode-button-border)';
			button.style.backgroundColor = 'var(--vscode-button-background)';
			button.style.color = 'var(--vscode-button-foreground)';
			button.style.cursor = 'pointer';
			button.style.borderRadius = '3px';
			button.style.fontSize = '12px';
			button.style.fontFamily = 'inherit';

			button.addEventListener('click', () => {
				this.showPreview(i.toString());
			});

			button.addEventListener('mouseover', () => {
				button.style.backgroundColor = 'var(--vscode-button-hoverBackground)';
			});

			button.addEventListener('mouseout', () => {
				button.style.backgroundColor = 'var(--vscode-button-background)';
			});

			previewsDiv.appendChild(button);
		}

		container.appendChild(previewsDiv);
	}

	public async showPreview(previewNumber: string): Promise<void> {
		this.currentPreviewNumber = previewNumber;

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

		const htmlPath = URI.file(`/Users/kishore.v/Dev/vscode/.preview-samples/preview${previewNumber}.html`);
		this.currentHtmlPath = htmlPath;

		try {
			const model = await this.textFileService.files.resolve(htmlPath);
			const htmlContent = this.getModelContent(model);
			this.updateWebviewContent(htmlContent, `Preview ${previewNumber}`);
			this.registerModelListener(model, htmlPath);
		} catch (error) {
			try {
				const fileContent = await this.fileService.readFile(htmlPath);
				const htmlContent = fileContent.value.toString();
				this.updateWebviewContent(htmlContent, `Preview ${previewNumber}`);
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

	private registerModelListener(model: ITextFileEditorModel, resource: URI): void {
		this.modelListener?.dispose();
		const listener = model.onDidChangeContent(() => {
			if (this.currentHtmlPath && this.currentHtmlPath.fsPath === resource.fsPath) {
				const htmlContent = this.getModelContent(model);
				this.updateWebviewContent(htmlContent, `Preview ${this.currentPreviewNumber}`);
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

		// Update HTML content
		this.webview.setHtml(htmlContent);
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
		// Webview handles its own layout
	}

	override dispose(): void {
		this.modelListener?.dispose();
		this.webviewDisposable?.dispose();
		super.dispose();
	}
}



