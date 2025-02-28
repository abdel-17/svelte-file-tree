import type { EventHandler } from "svelte/elements";
import type { TreeContext, TreeItemProviderContext } from "../Tree/state.svelte.js";
import type { TreeItemContext } from "../TreeItem/state.svelte.js";

export type TreeItemInputAttributesProps = {
	treeContext: TreeContext;
	itemProviderContext: TreeItemProviderContext;
	itemContext: TreeItemContext;
	name: () => string;
};

export class TreeItemInputAttributes {
	readonly #treeContext: TreeContext;
	readonly #itemProviderContext: TreeItemProviderContext;
	readonly #itemContext: TreeItemContext;
	readonly #name: () => string;

	constructor(props: TreeItemInputAttributesProps) {
		this.#treeContext = props.treeContext;
		this.#itemProviderContext = props.itemProviderContext;
		this.#itemContext = props.itemContext;
		this.#name = props.name;
	}

	onMount(input: HTMLInputElement): void {
		input.focus();
		input.select();
	}

	readonly onfocus: EventHandler<FocusEvent, HTMLInputElement> = () => {
		this.#itemContext.editing = true;
	};

	readonly onkeydown: EventHandler<KeyboardEvent, HTMLInputElement> = (event) => {
		switch (event.key) {
			case "Enter": {
				const name = this.#name();
				const { node } = this.#itemProviderContext;
				if (name === node.name) {
					this.#treeContext.getItemElement(node.id)?.focus();
					break;
				}

				void this.#treeContext.renameItem(name, this.#itemProviderContext).then((didRename) => {
					if (didRename) {
						this.#treeContext.getItemElement(node.id)?.focus();
					}
				});
				break;
			}
			case "Escape": {
				this.#treeContext.getItemElement(this.#itemProviderContext.node.id)?.focus();
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	readonly onblur: EventHandler<FocusEvent, HTMLInputElement> = () => {
		this.#itemContext.editing = false;
	};
}
