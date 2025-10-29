/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from '../../../../base/common/event.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export const VIBE_CHAT_VIEW_ID = 'workbench.view.vibeChat';

export interface IChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
	buttons?: IChatButton[];
}

export interface IChatButton {
	label: string;
	action: string;
}

export const IVibeChatService = createDecorator<IVibeChatService>('vibeChatService');

export interface IVibeChatService {
	readonly _serviceBrand: undefined;

	/**
	 * Event fired when a new message is added
	 */
	readonly onDidAddMessage: Event<IChatMessage>;

	/**
	 * Event fired when streaming progress occurs
	 */
	readonly onDidStreamProgress: Event<string>;

	/**
	 * Event fired when streaming completes
	 */
	readonly onDidCompleteStream: Event<void>;

	/**
	 * Send a user message and get streaming response
	 */
	sendMessage(content: string): Promise<void>;

	/**
	 * Get all messages
	 */
	getMessages(): IChatMessage[];

	/**
	 * Clear all messages
	 */
	clearMessages(): void;
}

