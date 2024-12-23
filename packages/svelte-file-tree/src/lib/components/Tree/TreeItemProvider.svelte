<script lang="ts">
import type { FileTreeNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";
import { TreeItemContext, type TreeState } from "./context.svelte.js";

const {
	treeState,
	node,
	index,
	children,
}: {
	treeState: TreeState;
	node: FileTreeNode;
	index: number;
	children: Snippet<[context: TreeItemContext]>;
} = $props();

const context = TreeItemContext.set(treeState, {
	getNode: () => node,
	getIndex: () => index,
});
</script>

{@render children(context)}
