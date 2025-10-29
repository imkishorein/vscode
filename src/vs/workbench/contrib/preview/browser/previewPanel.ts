/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IFileService } from '../../../../platform/files/common/files.js';
import { ITextFileService } from '../../../services/textfile/common/textfiles.js';
import { URI } from '../../../../base/common/uri.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';

export class PreviewPanel {
	private static instance: PreviewPanel | undefined;
	private webviewPanel: any;
	private currentPreviewNumber: string | undefined;
	private readonly disposables = new DisposableStore();

	private constructor(
		private readonly fileService: IFileService,
		private readonly textFileService: ITextFileService
	) {
		// Watch for file changes on disk
		this.disposables.add(this.fileService.onDidFilesChange(event => {
			if (this.currentPreviewNumber) {
				const htmlPath = URI.file(`/Users/kishore.v/Dev/vscode/.preview-samples/preview${this.currentPreviewNumber}.html`);
				if (event.contains(htmlPath)) {
					this.updatePreview(this.currentPreviewNumber);
				}
			}
		}));

		// Watch for file saves in the editor
		this.disposables.add(this.textFileService.files.onDidSave((e) => {
			if (this.currentPreviewNumber) {
				const expectedPath = `/Users/kishore.v/Dev/vscode/.preview-samples/preview${this.currentPreviewNumber}.html`;
				if (e.model.resource.fsPath === expectedPath) {
					this.updatePreview(this.currentPreviewNumber);
				}
			}
		}));
	}

	static getInstance(
		fileService: IFileService,
		textFileService: ITextFileService
	): PreviewPanel {
		if (!PreviewPanel.instance) {
			PreviewPanel.instance = new PreviewPanel(fileService, textFileService);
		}
		return PreviewPanel.instance;
	}

	async showPreview(previewNumber: string): Promise<void> {
		this.currentPreviewNumber = previewNumber;
		await this.updatePreview(previewNumber);
	}

	private async updatePreview(previewNumber: string): Promise<void> {
		const htmlPath = `/Users/kishore.v/Dev/vscode/.preview-samples/preview${previewNumber}.html`;
		
		try {
			const fileUri = URI.file(htmlPath);
			const content = await this.fileService.readFile(fileUri);
			const htmlContent = content.value.toString();

			if (this.webviewPanel) {
				// Update existing webview
				this.webviewPanel.webview.html = this.getWebviewContent(htmlContent);
			}
		} catch (error) {
			console.error(`Failed to load preview ${previewNumber}:`, error);
		}
	}

	private getWebviewContent(htmlContent: string): string {
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<style>
					body { margin: 0; padding: 0; }
					iframe { width: 100%; height: 100vh; border: none; }
				</style>
			</head>
			<body>
				<iframe srcdoc="${htmlContent.replace(/"/g, '&quot;')}"></iframe>
			</body>
			</html>
		`;
	}

	dispose(): void {
		this.disposables.dispose();
		if (this.webviewPanel) {
			this.webviewPanel.dispose();
		}
	}
}
