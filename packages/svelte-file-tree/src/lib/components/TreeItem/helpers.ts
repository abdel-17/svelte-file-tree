import type { FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import type { TreeState } from "../Tree/state.svelte.js";
import type { TreeItemData } from "../Tree/types.js";

export function getElementId(treeId: string, node: FileTreeNode): string {
	return `${treeId}:${node.id}`;
}

export function getElement(treeId: string, node: FileTreeNode): HTMLElement | null {
	const elementId = getElementId(treeId, node);
	return document.getElementById(elementId);
}

export function getNext(item: TreeItemData): TreeItemData | undefined {
	const { node } = item;
	if (node.type === "folder" && node.expanded) {
		const { children } = node;
		if (children.length !== 0) {
			return {
				node: children[0],
				index: 0,
				level: children,
				parent: item as TreeItemData<FolderNode>,
			};
		}
	}
	return getNextNonChild(item);
}

export function getNextNonChild(item: TreeItemData): TreeItemData | undefined {
	let current: TreeItemData | undefined = item;
	do {
		const { index, level } = current;
		if (index !== level.length - 1) {
			return {
				node: level[index + 1],
				index: index + 1,
				level,
				parent: current.parent,
			};
		}
		current = current.parent;
	} while (current !== undefined);
}

export function getPrevious(item: TreeItemData): TreeItemData | undefined {
	let { node, index, parent, level } = item;
	if (index === 0) {
		return parent;
	}

	index--;
	node = level[index];
	while (node.type === "folder" && node.expanded) {
		const { children } = node;
		if (children.length === 0) {
			break;
		}

		parent = { node, index, level, parent };
		level = children;
		index = children.length - 1;
		node = children[index];
	}
	return { node, index, level, parent };
}

export function batchSelect(
	treeState: TreeState,
	tree: FileTree,
	treeId: string,
	node: FileTreeNode,
	element: HTMLElement,
): void {
	let lastSelected: TreeItemData | undefined;
	for (const id of tree.selected) {
		const current = treeState.getItem(id);
		if (current !== undefined) {
			lastSelected = current;
		}
	}

	if (lastSelected === undefined) {
		let current: TreeItemData | undefined = {
			node: tree.nodes[0],
			index: 0,
			level: tree.nodes,
			parent: undefined,
		};
		do {
			current.node.select();
			if (current.node === node) {
				break;
			}
			current = getNext(current);
		} while (current !== undefined);
		return;
	}

	const lastSelectedElement = getElement(treeId, lastSelected.node);
	if (lastSelectedElement === null) {
		return;
	}

	const positionBitmask = lastSelectedElement.compareDocumentPosition(element);
	const following = positionBitmask & Node.DOCUMENT_POSITION_FOLLOWING;

	let current: TreeItemData | undefined = lastSelected;
	while (current.node !== node) {
		current = following ? getNext(current) : getPrevious(current);
		if (current === undefined) {
			break;
		}
		current.node.select();
	}
}

export function cloneNode(tree: FileTree, node: FileTreeNode): FileTreeNode {
	const id = crypto.randomUUID();
	switch (node.type) {
		case "file": {
			return tree.createFile({
				id,
				name: node.name,
			});
		}
		case "folder": {
			return tree.createFolder({
				id,
				name: node.name,
				children: node.children.map((child) => cloneNode(tree, child)),
			});
		}
	}
}

// TODO: Maybe rely on onDestroy to clean up the tree instead of this function
export function onDelete(tree: FileTree, deleted: FileTreeNode[]): boolean {
	for (const node of deleted) {
		tree.selected.delete(node.id);
		tree.copied.delete(node.id);
		tree.expanded.delete(node.id);

		if (tree.selected.size === 0 && tree.copied.size === 0 && tree.expanded.size === 0) {
			return true;
		}

		if (node.type === "folder") {
			const done = onDelete(tree, node.children);
			if (done) {
				return true;
			}
		}
	}
	return false;
}
