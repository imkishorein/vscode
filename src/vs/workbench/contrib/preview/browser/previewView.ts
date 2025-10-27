/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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
import { ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewPaneOptions } from '../../../browser/parts/views/viewPane.js';
import { $, append } from '../../../../base/browser/dom.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { PreviewEditorInput } from './previewEditor.js';

interface PreviewItem {
	id: string;
	label: string;
}

interface PreviewSection {
	id: string;
	label: string;
	items: PreviewItem[];
	expanded: boolean;
}

export class PreviewView extends ViewPane {
	private sections: PreviewSection[] = [
		{
			id: 'react-app',
			label: 'React App',
			expanded: true,
			items: [
				{ id: '1', label: 'Preview 1' },
				{ id: '2', label: 'Preview 2' },
			]
		},
		{
			id: 'lwc-components',
			label: 'LWC Components',
			expanded: true,
			items: [
				{ id: '3', label: 'Preview 3' },
				{ id: '4', label: 'Preview 4' },
			]
		},
		{
			id: 'data-entity-visualiser',
			label: 'Data Entity Visualiser',
			expanded: true,
			items: [
				{ id: '5', label: 'Preview 5' },
			]
		},
	];

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
		@IEditorService private readonly editorService: IEditorService
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);
		
		// Set flex layout on main container
		container.style.display = 'flex';
		container.style.flexDirection = 'column';
		container.style.height = '100%';

		const sectionsContainer = append(container, $('.preview-sections-container'));
		this.renderSections(sectionsContainer);
	}

	private renderSections(container: HTMLElement): void {
		for (const section of this.sections) {
			this.renderSection(container, section);
		}
	}

	private renderSection(container: HTMLElement, section: PreviewSection): void {
		const sectionDiv = append(container, $('.preview-section'));
		
		const header = append(sectionDiv, $('.preview-section-header'));
		header.setAttribute('role', 'button');
		header.setAttribute('tabindex', '0');
		header.setAttribute('aria-expanded', section.expanded ? 'true' : 'false');
		
		const chevron = append(header, $('.preview-section-chevron'));
		chevron.textContent = '▼';
		chevron.classList.add(section.expanded ? 'expanded' : 'collapsed');
		
		const label = append(header, $('.preview-section-label'));
		label.textContent = section.label;
		
		const content = append(sectionDiv, $('.preview-section-content'));
		if (!section.expanded) {
			content.style.display = 'none';
		}
		
		// Render items directly as DOM elements instead of using WorkbenchList
		for (const item of section.items) {
			const itemDiv = append(content, $('.preview-item'));
			const itemLabel = append(itemDiv, $('.preview-item-label'));
			itemLabel.textContent = item.label;
			
			// Add click handler to open preview
			itemDiv.addEventListener('click', () => {
				this.openPreview(item.id);
			});
		}
		
		const toggleSection = () => {
			section.expanded = !section.expanded;
			chevron.classList.toggle('expanded');
			chevron.classList.toggle('collapsed');
			header.setAttribute('aria-expanded', section.expanded ? 'true' : 'false');
			content.style.display = section.expanded ? 'block' : 'none';
		};
		
		header.addEventListener('click', toggleSection);
		header.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				toggleSection();
			}
		});
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
	}

	private openPreview(previewId: string): void {
		const previewInput = new PreviewEditorInput(`Preview ${previewId}`);
		this.editorService.openEditor(previewInput);
	}
}

