import type { EventHandler } from "svelte/elements";
import type { TreeContext, TreeItemContext } from "../Tree/state.svelte.js";

export type TreeItemInputAttributesProps = {
	treeContext: TreeContext;
	itemContext: TreeItemContext;
	name: () => string;
};

export class TreeItemInputAttributes {
	readonly #treeContext: TreeContext;
	readonly #itemContext: TreeItemContext;
	readonly #name: () => string;

	constructor(props: TreeItemInputAttributesProps) {
		this.#treeContext = props.treeContext;
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
				const { node } = this.#itemContext;
				void this.#treeContext.renameItem(this.#itemContext, this.#name()).then((didRename) => {
					if (didRename) {
						this.#treeContext.getItemElement(node.id)?.focus();
					}
				});
				break;
			}
			case "Escape": {
				this.#treeContext.getItemElement(this.#itemContext.node.id)?.focus();
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
