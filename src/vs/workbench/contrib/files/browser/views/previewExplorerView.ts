/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * PreviewExplorerView - Preview accordion in File Explorer sidebar
 * 
 * Naming Convention:
 * - Component: PreviewExplorerView (File Explorer accordion, 2nd position)
 * - Class: PreviewExplorerView
 * - View ID: workbench.explorer.previewView
 * - Trigger: Click preview items in File Explorer accordion
 * - Location: File Explorer sidebar, 2nd position (between Folders and Outline)
 * - Behavior: Shows collapsible sections with preview items
 */

import * as nls from '../../../../../nls.js';
import { ViewPane } from '../../../../browser/parts/views/viewPane.js';
import { IViewletViewOptions } from '../../../../browser/parts/views/viewsViewlet.js';
import { IInstantiationService } from '../../../../../platform/instantiation/common/instantiation.js';
import { IEditorService } from '../../../../services/editor/common/editorService.js';
import * as dom from '../../../../../base/browser/dom.js';
import { IContextMenuService } from '../../../../../platform/contextview/browser/contextView.js';
import { IContextKeyService } from '../../../../../platform/contextkey/common/contextkey.js';
import { IThemeService } from '../../../../../platform/theme/common/themeService.js';
import { IKeybindingService } from '../../../../../platform/keybinding/common/keybinding.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import { IViewDescriptorService } from '../../../../common/views.js';
import { IOpenerService } from '../../../../../platform/opener/common/opener.js';
import { IHoverService } from '../../../../../platform/hover/browser/hover.js';
import { ILocalizedString } from '../../../../../platform/action/common/action.js';

const $ = dom.$;

interface PreviewSection {
	id: string;
	label: string;
	items: PreviewItem[];
	expanded: boolean;
}

interface PreviewItem {
	id: string;
	label: string;
	previewNumber: string;
}

export class PreviewExplorerView extends ViewPane {

	static readonly ID = 'workbench.explorer.previewView';
	static readonly NAME: ILocalizedString = nls.localize2('preview', 'Preview');

	private sections: PreviewSection[] = [
		{
			id: 'react-app',
			label: 'React App',
			expanded: true,
			items: [
				{ id: 'preview1', label: 'Preview 1', previewNumber: '1' },
				{ id: 'preview2', label: 'Preview 2', previewNumber: '2' }
			]
		},
		{
			id: 'lwc-components',
			label: 'LWC Components',
			expanded: true,
			items: [
				{ id: 'preview3', label: 'Preview 3', previewNumber: '3' },
				{ id: 'preview4', label: 'Preview 4', previewNumber: '4' }
			]
		},
		{
			id: 'data-entity-visualiser',
			label: 'Data Entity Visualiser',
			expanded: true,
			items: [
				{ id: 'preview5', label: 'Preview 5', previewNumber: '5' }
			]
		}
	];

	constructor(
		options: IViewletViewOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
		@IEditorService private readonly editorService: IEditorService
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		container.classList.add('preview-explorer-view');
		const sectionsContainer = dom.append(container, $('div.preview-explorer-sections-container'));

		for (const section of this.sections) {
			this.renderSection(sectionsContainer, section);
		}
	}

	private renderSection(container: HTMLElement, section: PreviewSection): void {
		const sectionElement = dom.append(container, $('div.preview-explorer-section'));

		// Section header
		const header = dom.append(sectionElement, $('div.preview-explorer-section-header'));
		header.setAttribute('role', 'button');
		header.setAttribute('tabindex', '0');
		header.setAttribute('aria-expanded', section.expanded.toString());

		// Chevron
		const chevron = dom.append(header, $('span.preview-explorer-section-chevron'));
		chevron.textContent = section.expanded ? '▼' : '▶';

		// Label
		const label = dom.append(header, $('span.preview-explorer-section-label'));
		label.textContent = section.label;

		// Content
		const content = dom.append(sectionElement, $('div.preview-explorer-section-content'));
		if (!section.expanded) {
			content.style.display = 'none';
		}

		// Render items
		for (const item of section.items) {
			this.renderItem(content, item);
		}

		// Toggle on click
		header.addEventListener('click', () => {
			section.expanded = !section.expanded;
			header.setAttribute('aria-expanded', section.expanded.toString());
			chevron.textContent = section.expanded ? '▼' : '▶';
			content.style.display = section.expanded ? 'block' : 'none';
		});

		// Toggle on keyboard
		header.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				section.expanded = !section.expanded;
				header.setAttribute('aria-expanded', section.expanded.toString());
				chevron.textContent = section.expanded ? '▼' : '▶';
				content.style.display = section.expanded ? 'block' : 'none';
			}
		});
	}

	private renderItem(container: HTMLElement, item: PreviewItem): void {
		const itemElement = dom.append(container, $('div.preview-explorer-item'));
		itemElement.setAttribute('role', 'button');
		itemElement.setAttribute('tabindex', '0');

		const label = dom.append(itemElement, $('span.preview-explorer-item-label'));
		label.textContent = item.label;

		// Open preview on click
		itemElement.addEventListener('click', () => {
			this.openPreview(item.previewNumber);
		});

		// Open preview on Enter/Space
		itemElement.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				this.openPreview(item.previewNumber);
			}
		});
	}

	private openPreview(previewNumber: string): void {
		// Import PreviewEditorInput dynamically to avoid circular dependencies
		import('../../../preview/browser/previewEditor.js').then(module => {
			const PreviewEditorInput = module.PreviewEditorInput;
			const previewTitle = `Preview ${previewNumber}`;

			const input = new PreviewEditorInput(previewTitle);
			this.editorService.openEditor(input, { pinned: true });
		});
	}
}
