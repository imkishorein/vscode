/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IVibeChatService, IChatMessage } from '../common/vibeChat.js';
import { generateUuid } from '../../../../base/common/uuid.js';

export class VibeChatService extends Disposable implements IVibeChatService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidAddMessage = this._register(new Emitter<IChatMessage>());
	readonly onDidAddMessage: Event<IChatMessage> = this._onDidAddMessage.event;

	private readonly _onDidStreamProgress = this._register(new Emitter<string>());
	readonly onDidStreamProgress: Event<string> = this._onDidStreamProgress.event;

	private readonly _onDidCompleteStream = this._register(new Emitter<void>());
	readonly onDidCompleteStream: Event<void> = this._onDidCompleteStream.event;

	private messages: IChatMessage[] = [];

	private readonly hardcodedResponse = "I'll create a beautiful landing page for you! This will be a modern, gradient-styled page with a clean design. Let me generate the HTML code now...";

	async sendMessage(content: string): Promise<void> {
		// Add user message
		const userMessage: IChatMessage = {
			id: generateUuid(),
			role: 'user',
			content,
			timestamp: Date.now()
		};
		this.messages.push(userMessage);
		this._onDidAddMessage.fire(userMessage);

		// Simulate a small delay before starting response
		await this.delay(500);

		// Start streaming assistant response
		await this.streamResponse();
	}

	private async streamResponse(): Promise<void> {
		const assistantMessageId = generateUuid();
		let streamedContent = '';

		// Stream the response word by word
		const words = this.hardcodedResponse.split(' ');

		for (const word of words) {
			streamedContent += (streamedContent ? ' ' : '') + word;
			this._onDidStreamProgress.fire(streamedContent);
			await this.delay(80); // 80ms delay between words for realistic streaming
		}

		// Complete the message with buttons
		const assistantMessage: IChatMessage = {
			id: assistantMessageId,
			role: 'assistant',
			content: streamedContent,
			timestamp: Date.now(),
			buttons: [
				{ label: '📄 Insert Snippet', action: 'insert' },
				{ label: '📚 Open Docs', action: 'docs' },
				{ label: '🔄 Regenerate', action: 'regenerate' }
			]
		};

		this.messages.push(assistantMessage);
		this._onDidAddMessage.fire(assistantMessage);
		this._onDidCompleteStream.fire();
	}

	getMessages(): IChatMessage[] {
		return [...this.messages];
	}

	clearMessages(): void {
		this.messages = [];
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

