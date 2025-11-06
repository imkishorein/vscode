/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Preview Group Manager
 * 
 * Manages dedicated preview-only editor groups that restrict opening non-preview files.
 * 
 * Key Responsibilities:
 * - Track which editor groups are designated as preview-only
 * - Provide API to register/unregister preview groups
 * - Clean up metadata when groups are removed
 * - Support multiple preview groups simultaneously
 */

import { Disposable } from '../../../../base/common/lifecycle.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IEditorGroupsService } from '../../../services/editor/common/editorGroupsService.js';
import { GroupIdentifier } from '../../../common/editor.js';

export const IPreviewGroupManager = createDecorator<IPreviewGroupManager>('previewGroupManager');

export interface IPreviewGroupManager {
	/**
	 * Register an editor group as a preview-only group
	 * @param groupId The identifier of the group to register
	 */
	registerPreviewGroup(groupId: GroupIdentifier): void;

	/**
	 * Unregister a preview-only group
	 * @param groupId The identifier of the group to unregister
	 */
	unregisterPreviewGroup(groupId: GroupIdentifier): void;

	/**
	 * Check if a group is registered as a preview-only group
	 * @param groupId The identifier of the group to check
	 * @returns true if the group is a preview-only group
	 */
	isPreviewGroup(groupId: GroupIdentifier): boolean;

	/**
	 * Get all registered preview group IDs
	 * @returns Array of preview group identifiers
	 */
	getAllPreviewGroups(): GroupIdentifier[];

	/**
	 * Find the companion HTML group for a preview group
	 * @param previewGroupId The preview group identifier
	 * @returns The companion HTML group identifier, or undefined if not found
	 */
	getCompanionHtmlGroup(previewGroupId: GroupIdentifier): GroupIdentifier | undefined;

	/**
	 * Register a preview-HTML group pair
	 * @param previewGroupId The preview group identifier
	 * @param htmlGroupId The HTML group identifier
	 */
	registerGroupPair(previewGroupId: GroupIdentifier, htmlGroupId: GroupIdentifier): void;

	/**
	 * Find the preview-only group paired with a specific HTML group.
	 * @param htmlGroupId The HTML group identifier
	 * @returns The preview group identifier, or undefined if not found
	 */
	getPreviewGroupForHtmlGroup(htmlGroupId: GroupIdentifier): GroupIdentifier | undefined;
}

export class PreviewGroupManager extends Disposable implements IPreviewGroupManager {

	private readonly previewGroups = new Set<GroupIdentifier>();
	private readonly groupPairs = new Map<GroupIdentifier, GroupIdentifier>(); // previewGroupId -> htmlGroupId

	constructor(
		@IEditorGroupsService private readonly editorGroupsService: IEditorGroupsService
	) {
		super();

		// Clean up when groups are removed
		this._register(this.editorGroupsService.onDidRemoveGroup(group => {
			this.unregisterPreviewGroup(group.id);
		}));
	}

	registerPreviewGroup(groupId: GroupIdentifier): void {
		this.previewGroups.add(groupId);
	}

	unregisterPreviewGroup(groupId: GroupIdentifier): void {
		this.previewGroups.delete(groupId);
		this.groupPairs.delete(groupId);
	}

	isPreviewGroup(groupId: GroupIdentifier): boolean {
		return this.previewGroups.has(groupId);
	}

	getAllPreviewGroups(): GroupIdentifier[] {
		return Array.from(this.previewGroups);
	}

	getCompanionHtmlGroup(previewGroupId: GroupIdentifier): GroupIdentifier | undefined {
		return this.groupPairs.get(previewGroupId);
	}

	registerGroupPair(previewGroupId: GroupIdentifier, htmlGroupId: GroupIdentifier): void {
		this.groupPairs.set(previewGroupId, htmlGroupId);
	}

	getPreviewGroupForHtmlGroup(htmlGroupId: GroupIdentifier): GroupIdentifier | undefined {
		for (const [previewGroupId, registeredHtmlGroupId] of this.groupPairs) {
			if (registeredHtmlGroupId === htmlGroupId) {
				return previewGroupId;
			}
		}

		return undefined;
	}
}
