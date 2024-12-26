import type { FileTree, FileTreeNode } from "$lib/tree.svelte.js";
import type { TreeItemData, TreeItemDropPosition } from "./types.js";

export class TreeState {
	readonly #items = new Map<string, TreeItemData>();
	#tabbableId?: string = $state.raw();
	#draggedId?: string = $state.raw();

	getItem(id: string): TreeItemData | undefined {
		return this.#items.get(id);
	}

	setItem(item: TreeItemData): void {
		this.#items.set(item.node.id, item);
	}

	deleteItem(id: string): void {
		this.#items.delete(id);

		if (this.#tabbableId === id) {
			this.#tabbableId = undefined;
		}

		if (this.#draggedId === id) {
			this.#draggedId = undefined;
		}
	}

	isTabbable(tree: FileTree, node: FileTreeNode): boolean {
		if (this.#tabbableId === undefined) {
			return node === tree.nodes[0];
		}
		return this.#tabbableId === node.id;
	}

	setTabbable(node: FileTreeNode): void {
		this.#tabbableId = node.id;
	}

	hasDragged(): boolean {
		return this.#draggedId !== undefined;
	}

	isDragged(node: FileTreeNode): boolean {
		return this.#draggedId === node.id;
	}

	getDragged(): TreeItemData | undefined {
		if (this.#draggedId === undefined) {
			return;
		}
		return this.#items.get(this.#draggedId);
	}

	setDragged(node: FileTreeNode): void {
		this.#draggedId = node.id;
	}

	clearDragged(): void {
		this.#draggedId = undefined;
	}
}

export class TreeItemState {
	editing: boolean = $state.raw(false);
	#dropPosition?: TreeItemDropPosition = $state.raw();

	get dropPosition(): TreeItemDropPosition | undefined {
		return this.#dropPosition;
	}

	updateDropPosition(node: FileTreeNode, rect: DOMRect, clientY: number): TreeItemDropPosition {
		const position = getDropPosition(node, rect, clientY);
		this.#dropPosition = position;
		return position;
	}

	clearDropPosition(): void {
		this.#dropPosition = undefined;
	}
}

function getDropPosition(node: FileTreeNode, rect: DOMRect, clientY: number): TreeItemDropPosition {
	const { top, bottom, height } = rect;
	switch (node.type) {
		case "file": {
			const midY = top + height / 2;
			return clientY < midY ? "before" : "after";
		}
		case "folder": {
			if (clientY < top + height / 3) {
				return "before";
			}
			if (clientY > bottom - height / 3) {
				return "after";
			}
			return "inside";
		}
	}
}
