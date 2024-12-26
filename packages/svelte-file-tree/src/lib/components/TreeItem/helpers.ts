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

export function getSiblings(
	tree: FileTree,
	parent: TreeItemData<FolderNode> | undefined,
): FileTreeNode[] {
	if (parent === undefined) {
		return tree.nodes;
	}
	return parent.node.children;
}

export function getNext(tree: FileTree, current: TreeItemData): TreeItemData | undefined {
	let { node, index, parent } = current;
	if (node.type === "folder" && node.expanded && node.children.length !== 0) {
		parent = current as TreeItemData<FolderNode>;
		node = node.children[0];
		index = 0;
		return { parent, node, index };
	}

	while (true) {
		const siblings = getSiblings(tree, parent);
		if (index !== siblings.length - 1) {
			index++;
			node = siblings[index];
			break;
		}

		if (parent === undefined) {
			return;
		}

		node = parent.node;
		index = parent.index;
		parent = parent.parent;
	}
	return { node, index, parent };
}

export function getPrevious(tree: FileTree, current: TreeItemData): TreeItemData | undefined {
	let { node, index, parent } = current;
	if (index === 0) {
		return parent;
	}

	index--;
	node = getSiblings(tree, parent)[index];
	while (node.type === "folder" && node.expanded && node.children.length !== 0) {
		parent = { node, index, parent };
		index = node.children.length - 1;
		node = node.children[index];
	}
	return { node, index, parent };
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
			parent: undefined,
		};
		do {
			current.node.select();
			if (current.node === node) {
				break;
			}
			current = getNext(tree, current);
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
		current = following ? getNext(tree, current) : getPrevious(tree, current);
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
