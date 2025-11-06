/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize2 } from '../../../../../nls.js';
import { IViewletViewOptions } from '../../../../browser/parts/views/viewsViewlet.js';
import { IInstantiationService } from '../../../../../platform/instantiation/common/instantiation.js';
import { IThemeService } from '../../../../../platform/theme/common/themeService.js';
import { IKeybindingService } from '../../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import { ViewPane } from '../../../../browser/parts/views/viewPane.js';
import { IViewDescriptorService } from '../../../../common/views.js';
import { IOpenerService } from '../../../../../platform/opener/common/opener.js';
import { IEditorService } from '../../../../services/editor/common/editorService.js';
import { PreviewEditorInput } from '../../../preview/browser/previewEditor.js';
import { IContextKeyService } from '../../../../../platform/contextkey/common/contextkey.js';
import { IHoverService } from '../../../../../platform/hover/browser/hover.js';

interface PreviewSection {
	id: string;
	label: string;
	items: { id: string; label: string }[];
	expanded: boolean;
}

export class PreviewExplorerView extends ViewPane {

	static readonly ID = 'workbench.explorer.previewView';
	static readonly NAME = localize2('preview', "Preview");

	private sections: PreviewSection[] = [
		{
			id: 'react-app',
			label: 'React App',
			items: [
				{ id: '1', label: 'Preview 1' },
				{ id: '2', label: 'Preview 2' }
			],
			expanded: true
		},
		{
			id: 'lwc-components',
			label: 'LWC Components',
			items: [
				{ id: '3', label: 'Preview 3' },
				{ id: '4', label: 'Preview 4' }
			],
			expanded: true
		},
		{
			id: 'data-entity-visualiser',
			label: 'Data Entity Visualiser',
			items: [
				{ id: '5', label: 'Preview 5' }
			],
			expanded: true
		}
	];

	constructor(
		options: IViewletViewOptions,
		@IInstantiationService instantiationService: IInstantiationService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IThemeService themeService: IThemeService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IOpenerService openerService: IOpenerService,
		@IHoverService hoverService: IHoverService,
		@IEditorService private readonly editorService: IEditorService
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		const sectionsContainer = document.createElement('div');
		sectionsContainer.className = 'preview-explorer-sections-container';

		this.sections.forEach(section => {
			this.renderSection(sectionsContainer, section);
		});

		container.appendChild(sectionsContainer);
	}

	private renderSection(container: HTMLElement, section: PreviewSection): void {
		const sectionElement = document.createElement('div');
		sectionElement.className = 'preview-explorer-section';

		// Section header
		const header = document.createElement('div');
		header.className = 'preview-explorer-section-header';
		header.setAttribute('role', 'button');
		header.setAttribute('tabindex', '0');
		header.setAttribute('aria-expanded', section.expanded.toString());

		const chevron = document.createElement('span');
		chevron.className = 'preview-explorer-section-chevron codicon codicon-chevron-down';
		if (!section.expanded) {
			chevron.classList.add('collapsed');
		}

		const label = document.createElement('span');
		label.className = 'preview-explorer-section-label';
		label.textContent = section.label;

		header.appendChild(chevron);
		header.appendChild(label);

		// Toggle section on click
		header.addEventListener('click', () => {
			section.expanded = !section.expanded;
			chevron.classList.toggle('collapsed');
			content.style.display = section.expanded ? 'block' : 'none';
			header.setAttribute('aria-expanded', section.expanded.toString());
		});

		// Keyboard accessibility
		header.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				header.click();
			}
		});

		// Section content
		const content = document.createElement('div');
		content.className = 'preview-explorer-section-content';
		content.style.display = section.expanded ? 'block' : 'none';

		section.items.forEach(item => {
			const itemElement = document.createElement('div');
			itemElement.className = 'preview-explorer-item';
			itemElement.setAttribute('role', 'button');
			itemElement.setAttribute('tabindex', '0');

			const itemLabel = document.createElement('span');
			itemLabel.className = 'preview-explorer-item-label';
			itemLabel.textContent = item.label;

			itemElement.appendChild(itemLabel);

			// Open preview on click
			itemElement.addEventListener('click', () => {
				this.openPreview(item.id);
			});

			// Keyboard accessibility
			itemElement.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					this.openPreview(item.id);
				}
			});

			content.appendChild(itemElement);
		});

		sectionElement.appendChild(header);
		sectionElement.appendChild(content);
		container.appendChild(sectionElement);
	}

	private openPreview(previewId: string): void {
		const previewTitle = `Preview ${previewId}`;
		const previewInput = new PreviewEditorInput(previewTitle);
		this.editorService.openEditor(previewInput, { pinned: true });
	}
}
