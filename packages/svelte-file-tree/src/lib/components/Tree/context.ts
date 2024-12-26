import type { FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import { getContext, setContext } from "svelte";
import type { TreeItemState, TreeState } from "./state.svelte.js";
import type { TreeCallbacks, TreeItemData } from "./types.js";

export interface TreeContext {
	treeState: TreeState;
	getTree: () => FileTree;
	getTreeId: () => string;
	callbacks: TreeCallbacks;
}

export interface TreeItemProviderContext {
	treeContext: TreeContext;
	itemState: TreeItemState;
	getNode: () => FileTreeNode;
	getIndex: () => number;
	getParent: () => TreeItemData<FolderNode> | undefined;
	getDepth: () => number;
}

const contextKey = Symbol("TreeItemProviderContext");

export function getTreeItemProviderContext(): TreeItemProviderContext {
	const context: TreeItemProviderContext | undefined = getContext(contextKey);
	if (context === undefined) {
		throw new Error("No parent <Tree> found");
	}
	return context;
}

export function setTreeItemProviderContext(context: TreeItemProviderContext): void {
	setContext(contextKey, context);
}
