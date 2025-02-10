import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import { Context } from "runed";
import type { TreeItemPosition, TreeState } from "./state.svelte.js";

export const TreeContext = new Context<{
	treeState: TreeState;
}>("Tree");

export const TreeItemProviderContext = new Context<{
	node: () => FileTreeNode;
	index: () => number;
	depth: () => number;
	parent: () => TreeItemPosition<FolderNode> | undefined;
}>("TreeItemProvider");
