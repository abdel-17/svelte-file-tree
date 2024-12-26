<script lang="ts">
import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";
import { type TreeContext, setTreeItemProviderContext } from "./context.js";
import { TreeItemState } from "./state.svelte.js";
import type { TreeItemData } from "./types.js";

const {
	treeContext,
	node,
	index,
	parent,
	depth,
	children,
}: {
	treeContext: TreeContext;
	node: FileTreeNode;
	index: number;
	parent: TreeItemData<FolderNode> | undefined;
	depth: number;
	children: Snippet<[itemState: TreeItemState]>;
} = $props();

const itemState = new TreeItemState();
setTreeItemProviderContext({
	treeContext,
	itemState,
	getNode: () => node,
	getIndex: () => index,
	getParent: () => parent,
	getDepth: () => depth,
});
</script>

{@render children(itemState)}
