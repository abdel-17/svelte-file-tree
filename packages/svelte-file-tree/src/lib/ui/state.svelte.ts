import { FileTree, FileTreeNode, FolderNode } from "$lib/data/tree.svelte.js";

export type EnumeratedTreeItem = {
	readonly node: FileTreeNode;
	readonly index: number;
};

export class TreeState {
	readonly #id: () => string;
	readonly items = new Map<string, EnumeratedTreeItem>();
	tabbableId?: string = $state.raw();
	draggedId?: string = $state.raw();

	constructor(id: () => string) {
		this.#id = id;
	}

	getTreeElement() {
		return document.getElementById(this.#id());
	}

	getItemElementId(node: FileTreeNode) {
		return `${this.#id()}:${node.id}`;
	}

	getItemElement(node: FileTreeNode) {
		const elementId = this.getItemElementId(node);
		return document.getElementById(elementId);
	}

	getItemTabIndex(node: FileTreeNode) {
		const { tabbableId = node.tree.nodes[0].id } = this;
		return tabbableId === node.id ? 0 : -1;
	}

	getNextItem(current: EnumeratedTreeItem) {
		let { node, index } = current;

		if (node.isFolder() && node.expanded && node.children.length !== 0) {
			node = node.children[0];
			index = this.items.get(node.id)!.index;
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
			index = this.items.get(node.id)!.index;
		}
		return { node, index };
	}

	getPreviousItem(current: EnumeratedTreeItem) {
		let { node, index } = current;

		if (index === 0) {
			if (node.parent === undefined) {
				return;
			}
			node = node.parent;
			index = this.items.get(node.id)!.index;
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

	getDropPosition(node: FileTreeNode, element: HTMLElement, clientY: number) {
		const { top, bottom, height } = element.getBoundingClientRect();

		if (!node.isFolder()) {
			const midY = top + height / 2;
			return clientY < midY ? "before" : "after";
		}

		if (clientY < top + height / 3) {
			return "before";
		}
		if (clientY > bottom - height / 3) {
			return "after";
		}
		return "inside";
	}

	batchSelect(node: FileTreeNode, element: HTMLElement) {
		let lastSelected: EnumeratedTreeItem | undefined;
		for (const id of node.tree.selected) {
			const item = this.items.get(id);
			if (item !== undefined) {
				lastSelected = item;
			}
		}

		if (lastSelected === undefined) {
			const first = { node: node.tree.nodes[0], index: 0 };
			let current: EnumeratedTreeItem | undefined = first;
			do {
				current.node.select();
				if (current.node === node) {
					break;
				}
				current = this.getNextItem(current);
			} while (current !== undefined);
			return;
		}

		const lastElement = this.getItemElement(lastSelected.node);
		if (lastElement === null) {
			return;
		}

		const following =
			lastElement.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING;

		let current: EnumeratedTreeItem | undefined = lastSelected;
		while (current.node !== node) {
			current = following ? this.getNextItem(current) : this.getPreviousItem(current);
			if (current === undefined) {
				break;
			}
			current.node.select();
		}
	}

	deletingSelected(nodes: FileTreeNode[], deleted: FileTreeNode[]) {
		const remaining: FileTreeNode[] = [];
		for (const node of nodes) {
			if (node.selected) {
				deleted.push(node);
				this.#onDeleteItem(node);
			} else {
				remaining.push(node);
			}
		}
		return remaining;
	}

	#onDeleteItem(node: FileTreeNode) {
		const { selected, expanded } = node.tree;
		selected.delete(node.id);
		expanded.delete(node.id);

		if (selected.size === 0 || expanded.size === 0) {
			return true;
		}

		if (node.isFolder()) {
			for (const child of node.children) {
				const done = this.#onDeleteItem(child);
				if (done) {
					return true;
				}
			}
		}

		return false;
	}
}

export class TreeItemState {
	readonly #treeState: TreeState;
	readonly #node: () => FileTreeNode;
	readonly #index: () => number;
	editing = $state.raw(false);
	dropPosition?: "before" | "inside" | "after" = $state.raw();

	constructor(treeState: TreeState, node: () => FileTreeNode, index: () => number) {
		this.#treeState = treeState;
		this.#node = node;
		this.#index = index;
	}

	get node() {
		return this.#node();
	}

	get index() {
		return this.#index();
	}

	readonly dragged = $derived.by(() => this.#treeState.draggedId === this.#node().id);

	getElement() {
		return this.#treeState.getItemElement(this.#node());
	}
}
