import type { FileTreeNode } from "./tree.svelte.js";

export type EnumeratedTreeItem = {
	readonly node: FileTreeNode;
	readonly index: number;
};

export class TreeState {
	readonly #id: () => string;
	readonly #items = new Map<string, EnumeratedTreeItem>();
	#tabbableId?: string = $state.raw();
	#draggedId?: string = $state.raw();

	constructor(id: () => string) {
		this.#id = id;
	}

	get draggedId(): string | undefined {
		return this.#draggedId;
	}

	getTreeElement(): HTMLElement | null {
		return document.getElementById(this.#id());
	}

	getItemElementId(node: FileTreeNode): string {
		return `${this.#id()}:${node.id}`;
	}

	getItemElement(node: FileTreeNode): HTMLElement | null {
		const elementId = this.getItemElementId(node);
		return document.getElementById(elementId);
	}

	getItem(id: string): EnumeratedTreeItem | undefined {
		return this.#items.get(id);
	}

	isItemTabbable(node: FileTreeNode): boolean {
		const tabbableId = this.#tabbableId ?? node.tree.nodes[0].id;
		return tabbableId === node.id;
	}

	getNextItem(current: EnumeratedTreeItem): EnumeratedTreeItem | undefined {
		let { node, index } = current;

		if (node.isFolder() && node.expanded && node.children.length !== 0) {
			node = node.children[0];
			index = this.#items.get(node.id)!.index;
			return { node, index };
		}

		while (true) {
			if (index !== node.siblings.length - 1) {
				index++;
				node = node.siblings[index];
				break;
			}

			if (node.parent === undefined) {
				return;
			}
			node = node.parent;
			index = this.#items.get(node.id)!.index;
		}
		return { node, index };
	}

	getPreviousItem(current: EnumeratedTreeItem): EnumeratedTreeItem | undefined {
		let { node, index } = current;

		if (index === 0) {
			if (node.parent === undefined) {
				return;
			}
			node = node.parent;
			index = this.#items.get(node.id)!.index;
			return { node, index };
		}

		index--;
		node = node.siblings[index];
		while (node.isFolder() && node.expanded && node.children.length !== 0) {
			index = node.children.length - 1;
			node = node.children[index];
		}
		return { node, index };
	}

	onSetItem(item: EnumeratedTreeItem): void {
		this.#items.set(item.node.id, item);
	}

	onDestroyItem(id: string): void {
		this.#items.delete(id);

		if (this.#tabbableId === id) {
			this.#tabbableId = undefined;
		}

		if (this.#draggedId === id) {
			this.#draggedId = undefined;
		}
	}

	onFocusInItem(node: FileTreeNode): void {
		this.#tabbableId = node.id;
	}

	onDragStartItem(node: FileTreeNode): void {
		this.#draggedId = node.id;
	}

	onDragEndItem(): void {
		this.#draggedId = undefined;
	}
}
