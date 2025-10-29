/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IViewDescriptorService } from '../../../common/views.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IViewletViewOptions } from '../../../browser/parts/views/viewsViewlet.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IVibeChatService } from '../common/vibeChat.js';
import { ViewPane } from '../../../browser/parts/views/viewPane.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { IWebviewService, WebviewContentPurpose } from '../../../contrib/webview/browser/webview.js';
import { VibeChatCodeGenerator } from './vibeChatCodeGenerator.js';
import { VibeChatPreviewService } from './vibeChatPreview.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';

export class VibeChatViewPane extends ViewPane {
	private webview: any;
	private webviewDisposables = this._register(new DisposableStore());
	private isStreaming = false;

	constructor(
		options: IViewletViewOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService override instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
		@IWebviewService private readonly webviewService: IWebviewService,
		@IVibeChatService private readonly vibeChatService: IVibeChatService
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		this.webview = this.webviewService.createWebviewElement({
			title: 'Vibe Chat',
			options: {
				enableFindWidget: false,
				purpose: WebviewContentPurpose.NotebookRenderer
			},
			contentOptions: {
				allowScripts: true
			},
			extension: undefined
		});

		this.webview.mountTo(container, window);
		this.updateWebviewContent();

		// Listen for messages from webview
		this.webviewDisposables.add(this.webview.onMessage((message: any) => {
			this.handleWebviewMessage(message);
		}));

		// Listen for service events
		this.webviewDisposables.add(this.vibeChatService.onDidStreamProgress((content) => {
			this.postMessageToWebview({ type: 'streamProgress', content });
		}));

		this.webviewDisposables.add(this.vibeChatService.onDidAddMessage((message) => {
			this.postMessageToWebview({ type: 'addMessage', message });
		}));

		this.webviewDisposables.add(this.vibeChatService.onDidCompleteStream(() => {
			this.isStreaming = false;
			this.postMessageToWebview({ type: 'streamComplete' });
		}));
	}

	private async handleWebviewMessage(message: any): Promise<void> {
		switch (message.type) {
			case 'sendMessage':
				if (!this.isStreaming) {
					this.isStreaming = true;
					await this.vibeChatService.sendMessage(message.content);

					// Trigger code generation when streaming starts
					const codeGenerator = this.instantiationService.createInstance(VibeChatCodeGenerator);
					const { htmlFileUri, completed } = await codeGenerator.generateCode();

					// Open preview after code generation completes
					completed.then(async () => {
						const previewService = this.instantiationService.createInstance(VibeChatPreviewService);
						await previewService.openPreview(htmlFileUri);
					});
				}
				break;
			case 'buttonClick':
				// Handle button clicks (insert, docs, regenerate)
				console.log('Button clicked:', message.action);
				break;
		}
	}

	private postMessageToWebview(message: any): void {
		if (this.webview) {
			this.webview.postMessage(message);
		}
	}

	private updateWebviewContent(): void {
		if (!this.webview) {
			return;
		}

		const html = this.getWebviewHtml();
		this.webview.setHtml(html);
	}

	private getWebviewHtml(): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Vibe Chat</title>
	<style>
		body {
			margin: 0;
			padding: 0;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			background: var(--vscode-sideBar-background);
			color: var(--vscode-sideBar-foreground);
			display: flex;
			flex-direction: column;
			height: 100vh;
			overflow: hidden;
		}
		.header {
			padding: 16px;
			border-bottom: 1px solid var(--vscode-panel-border);
			background: var(--vscode-sideBarSectionHeader-background);
		}
		.header h2 {
			margin: 0;
			font-size: 14px;
			font-weight: 600;
			color: var(--vscode-sideBarTitle-foreground);
		}
		.messages-container {
			flex: 1;
			overflow-y: auto;
			padding: 16px;
		}
		.message {
			margin-bottom: 16px;
			animation: slideIn 0.3s ease-out;
		}
		@keyframes slideIn {
			from {
				opacity: 0;
				transform: translateY(10px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		.message-user {
			text-align: right;
		}
		.message-content {
			display: inline-block;
			padding: 10px 14px;
			border-radius: 12px;
			max-width: 80%;
			word-wrap: break-word;
		}
		.message-user .message-content {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
		}
		.message-assistant .message-content {
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
		}
		.message-buttons {
			margin-top: 8px;
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
		}
		.message-button {
			padding: 6px 12px;
			background: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
			border: none;
			border-radius: 6px;
			cursor: pointer;
			font-size: 12px;
			transition: background 0.2s;
		}
		.message-button:hover {
			background: var(--vscode-button-secondaryHoverBackground);
		}
		.streaming-indicator {
			display: inline-block;
			margin-left: 4px;
		}
		.streaming-indicator::after {
			content: '...';
			animation: dots 1.5s infinite;
		}
		@keyframes dots {
			0%, 20% { content: '.'; }
			40% { content: '..'; }
			60%, 100% { content: '...'; }
		}
		.input-container {
			padding: 16px;
			border-top: 1px solid var(--vscode-panel-border);
			background: var(--vscode-sideBar-background);
		}
		.input-wrapper {
			display: flex;
			gap: 8px;
		}
		.input-box {
			flex: 1;
			padding: 10px 12px;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 6px;
			font-size: 13px;
			font-family: inherit;
			resize: none;
			outline: none;
		}
		.input-box:focus {
			border-color: var(--vscode-focusBorder);
		}
		.send-button {
			padding: 10px 20px;
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 6px;
			cursor: pointer;
			font-size: 13px;
			font-weight: 600;
			transition: background 0.2s;
		}
		.send-button:hover {
			background: var(--vscode-button-hoverBackground);
		}
		.send-button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100%;
			padding: 20px;
			text-align: center;
			color: var(--vscode-descriptionForeground);
		}
		.empty-state-icon {
			font-size: 48px;
			margin-bottom: 16px;
			opacity: 0.6;
		}
		.empty-state-title {
			font-size: 16px;
			font-weight: 600;
			margin-bottom: 8px;
		}
		.empty-state-description {
			font-size: 13px;
			line-height: 1.5;
		}
	</style>
</head>
<body>
	<div class="header">
		<h2>💬 Vibe Chat</h2>
	</div>
	<div class="messages-container" id="messages">
		<div class="empty-state">
			<div class="empty-state-icon">🚀</div>
			<div class="empty-state-title">Welcome to Vibe Chat</div>
			<div class="empty-state-description">
				Ask me to create something, and I'll generate beautiful code with live preview!
			</div>
		</div>
	</div>
	<div class="input-container">
		<div class="input-wrapper">
			<textarea
				class="input-box"
				id="messageInput"
				placeholder="Ask me to create a landing page..."
				rows="2"
			></textarea>
			<button class="send-button" id="sendButton">Send</button>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		const messagesContainer = document.getElementById('messages');
		const messageInput = document.getElementById('messageInput');
		const sendButton = document.getElementById('sendButton');
		let isStreaming = false;
		let streamingMessageElement = null;

		function sendMessage() {
			const content = messageInput.value.trim();
			if (content && !isStreaming) {
				vscode.postMessage({ type: 'sendMessage', content });
				messageInput.value = '';
				sendButton.disabled = true;
			}
		}

		sendButton.addEventListener('click', sendMessage);
		messageInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
		});

		function addMessage(message) {
			// Remove empty state if present
			const emptyState = messagesContainer.querySelector('.empty-state');
			if (emptyState) {
				emptyState.remove();
			}

			const messageDiv = document.createElement('div');
			messageDiv.className = \`message message-\${message.role}\`;

			const contentDiv = document.createElement('div');
			contentDiv.className = 'message-content';
			contentDiv.textContent = message.content;
			messageDiv.appendChild(contentDiv);

			if (message.buttons && message.buttons.length > 0) {
				const buttonsDiv = document.createElement('div');
				buttonsDiv.className = 'message-buttons';

				message.buttons.forEach(button => {
					const btn = document.createElement('button');
					btn.className = 'message-button';
					btn.textContent = button.label;
					btn.addEventListener('click', () => {
						vscode.postMessage({ type: 'buttonClick', action: button.action });
					});
					buttonsDiv.appendChild(btn);
				});

				messageDiv.appendChild(buttonsDiv);
			}

			messagesContainer.appendChild(messageDiv);
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}

		function updateStreamingMessage(content) {
			if (!streamingMessageElement) {
				const emptyState = messagesContainer.querySelector('.empty-state');
				if (emptyState) {
					emptyState.remove();
				}

				streamingMessageElement = document.createElement('div');
				streamingMessageElement.className = 'message message-assistant';

				const contentDiv = document.createElement('div');
				contentDiv.className = 'message-content';
				streamingMessageElement.appendChild(contentDiv);

				messagesContainer.appendChild(streamingMessageElement);
			}

			const contentDiv = streamingMessageElement.querySelector('.message-content');
			contentDiv.innerHTML = content + '<span class="streaming-indicator"></span>';
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}

		window.addEventListener('message', (event) => {
			const message = event.data;

			switch (message.type) {
				case 'addMessage':
					if (message.message.role === 'assistant') {
						streamingMessageElement = null;
					}
					addMessage(message.message);
					if (message.message.role === 'user') {
						isStreaming = true;
					} else {
						sendButton.disabled = false;
						isStreaming = false;
					}
					break;
				case 'streamProgress':
					updateStreamingMessage(message.content);
					break;
				case 'streamComplete':
					streamingMessageElement = null;
					sendButton.disabled = false;
					isStreaming = false;
					break;
			}
		});
	</script>
</body>
</html>`;
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
		// Webview layout is handled automatically
	}

	override focus(): void {
		super.focus();
		if (this.webview) {
			this.webview.focus();
		}
	}
}

