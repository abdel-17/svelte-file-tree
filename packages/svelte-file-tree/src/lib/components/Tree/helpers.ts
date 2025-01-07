import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import type { TreeItemData } from "./context.svelte.js";

export function getNextItem(item: TreeItemData): TreeItemData | undefined {
	const { node } = item;
	if (node.type === "folder" && node.expanded && node.children.length !== 0) {
		return {
			node: node.children[0],
			index: 0,
			level: node.children,
			parent: item as TreeItemData<FolderNode>,
		};
	}
	return getNextNonChildItem(item);
}

export function getNextNonChildItem(item: TreeItemData): TreeItemData | undefined {
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

export function getPreviousItem(item: TreeItemData): TreeItemData | undefined {
	let { node, index, level, parent } = item;
	if (index === 0) {
		return parent;
	}

	index--;
	node = level[index];
	while (node.type === "folder" && node.expanded && node.children.length !== 0) {
		parent = { node, index, level, parent };
		level = node.children;
		index = level.length - 1;
		node = level[index];
	}
	return { node, index, level, parent };
}

export function hasSelectedAncestor(item: TreeItemData): boolean {
	let ancestor = item.parent;
	while (ancestor !== undefined) {
		if (ancestor.node.selected) {
			return true;
		}
		ancestor = ancestor.parent;
	}
	return false;
}

export function copyNode(node: FileTreeNode): FileTreeNode {
	const id = crypto.randomUUID();
	switch (node.type) {
		case "file": {
			return node.tree.createFile({
				id,
				name: node.name,
			});
		}
		case "folder": {
			return node.tree.createFolder({
				id,
				name: node.name,
				children: node.children.map(copyNode),
			});
		}
	}
}
