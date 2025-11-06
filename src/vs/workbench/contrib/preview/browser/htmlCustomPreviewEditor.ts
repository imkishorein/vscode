/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as DOM from '../../../../base/browser/dom.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { MutableDisposable } from '../../../../base/common/lifecycle.js';
import { URI } from '../../../../base/common/uri.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { IEditorOpenContext } from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { IWebviewService, IOverlayWebview } from '../../webview/browser/webview.js';
import { asWebviewUri } from '../../webview/common/webview.js';
import { HtmlCustomPreviewEditorInput } from './htmlCustomPreviewEditorProvider.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { ITextFileService } from '../../../services/textfile/common/textfiles.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';

/**
 * Editor pane for HTML Custom Preview
 * Renders HTML files in a webview with auto-refresh
 */
export class HtmlCustomPreviewEditor extends EditorPane {

	static readonly ID = 'workbench.editor.htmlCustomPreview';

	private _rootElement?: HTMLElement;
	private _toolbar?: HTMLElement;
	private _contentWrapper?: HTMLElement;
	private _dimension?: DOM.Dimension;
	private readonly _webview = this._register(new MutableDisposable<IOverlayWebview>());
	private _currentResource: URI | undefined;
	private _visible = false;

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IWebviewService private readonly webviewService: IWebviewService,
		@IFileService private readonly fileService: IFileService,
		@ITextFileService private readonly textFileService: ITextFileService
	) {
		super(HtmlCustomPreviewEditor.ID, group, telemetryService, themeService, storageService);

		// Listen for file saves to trigger auto-refresh
		this._register(this.textFileService.files.onDidSave(e => {
			if (this._currentResource && e.model.resource.toString() === this._currentResource.toString()) {
				this.updateWebviewContent(this._currentResource);
			}
		}));
	}

	protected override createEditor(parent: HTMLElement): void {
		// Create root element
		this._rootElement = document.createElement('div');
		this._rootElement.classList.add('html-custom-preview-editor');
		parent.appendChild(this._rootElement);

		// Create toolbar
		this._toolbar = document.createElement('div');
		this._toolbar.classList.add('preview-toolbar');

		// Desktop button
		const desktopButton = document.createElement('button');
		desktopButton.classList.add('preview-toolbar-button', 'preview-toolbar-button-active');
		desktopButton.textContent = 'Desktop';
		desktopButton.setAttribute('aria-label', 'Desktop view');
		this._toolbar.appendChild(desktopButton);

		// Mobile button
		const mobileButton = document.createElement('button');
		mobileButton.classList.add('preview-toolbar-button');
		mobileButton.textContent = 'Mobile';
		mobileButton.setAttribute('aria-label', 'Mobile view');
		this._toolbar.appendChild(mobileButton);

		// New Window button
		const newWindowButton = document.createElement('button');
		newWindowButton.classList.add('preview-toolbar-button');
		newWindowButton.textContent = 'New Window';
		newWindowButton.setAttribute('aria-label', 'Open in new window');
		this._toolbar.appendChild(newWindowButton);

		this._rootElement.appendChild(this._toolbar);

		// Create content wrapper for webview
		this._contentWrapper = document.createElement('div');
		this._contentWrapper.classList.add('preview-content-wrapper');
		this._rootElement.appendChild(this._contentWrapper);
	}

	override async setInput(input: EditorInput, options: IEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);

		if (!(input instanceof HtmlCustomPreviewEditorInput)) {
			return;
		}

		this._currentResource = input.resource;

		// Create webview if it doesn't exist
		if (!this._webview.value) {
			const folderPath = input.resource.fsPath.substring(0, input.resource.fsPath.lastIndexOf('/'));
			const localResourceRoot = URI.file(input.resource.fsPath).with({ path: folderPath });
			const webview = this.webviewService.createWebviewOverlay({
				providedViewType: 'htmlCustomPreview',
				title: input.getName(),
				options: {},
				contentOptions: {
					allowScripts: true,
					localResourceRoots: [localResourceRoot]
				},
				extension: undefined
			});

			webview.claim(this, this.window, undefined);
			this._webview.value = webview;

			if (this._dimension) {
				this.layout(this._dimension);
			}
		}

		// Load content
		await this.updateWebviewContent(input.resource);
	}

	override clearInput(): void {
		if (this._webview.value) {
			this._webview.value.release(this);
		}
		this._currentResource = undefined;
		super.clearInput();
	}

	protected override setEditorVisible(visible: boolean): void {
		this._visible = visible;
		const webview = this._webview.value;
		if (webview) {
			if (visible) {
				webview.claim(this, this.window, undefined);
			} else {
				webview.release(this);
			}
		}
		super.setEditorVisible(visible);
	}

	/**
	 * Update webview content by reading the HTML file
	 */
	private async updateWebviewContent(resource: URI): Promise<void> {
		const webview = this._webview.value;
		if (!webview) {
			return;
		}

		try {
			const content = await this.fileService.readFile(resource);
			const htmlContent = content.value.toString();

			// Convert relative paths to webview URIs
			const baseUri = resource.with({ path: resource.path.substring(0, resource.path.lastIndexOf('/')) });
			const processedHtml = this.processHtmlContent(htmlContent, baseUri, webview);

			webview.setHtml(processedHtml);
		} catch (error) {
			console.error('Failed to load HTML content:', error);
			webview.setHtml(`
				<html>
					<body style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; color: #f00;">
						<div>
							<h2>Failed to load preview</h2>
							<p>${error}</p>
						</div>
					</body>
				</html>
			`);
		}
	}

	/**
	 * Process HTML content to convert relative paths to webview URIs
	 */
	private processHtmlContent(html: string, baseUri: URI, webview: IOverlayWebview): string {
		// Convert relative script/link/img sources to webview URIs
		return html.replace(
			/(src|href)=["'](?!http|https|data:)([^"]+)["']/gi,
			(match, attr, path) => {
				const resourceUri = baseUri.with({ path: `${baseUri.path}/${path}` });
				const webviewUri = asWebviewUri(resourceUri);
				return `${attr}="${webviewUri}"`;
			}
		);
	}

	override layout(dimension: DOM.Dimension): void {
		this._dimension = dimension;
		const webview = this._webview.value;
		if (webview && this._contentWrapper && this._visible) {
			webview.layoutWebviewOverElement(this._contentWrapper, dimension);
		}
	}

	override focus(): void {
		super.focus();
		const webview = this._webview.value;
		if (webview) {
			webview.focus();
		}
	}

	override dispose(): void {
		this._rootElement?.remove();
		this._rootElement = undefined;
		this._toolbar = undefined;
		this._contentWrapper = undefined;
		super.dispose();
	}
}