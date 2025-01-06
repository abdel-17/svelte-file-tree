<script lang="ts">
	import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
	import { type Snippet, setContext } from "svelte";
	import { TreeItemContext, type TreeItemData } from "./context.svelte.js";

	const {
		node,
		index,
		level,
		parent,
		depth,
		children,
	}: {
		node: FileTreeNode;
		index: number;
		level: FileTreeNode[];
		parent: TreeItemData<FolderNode> | undefined;
		depth: number;
		children: Snippet<[context: TreeItemContext]>;
	} = $props();

	const context = new TreeItemContext({
		node: () => node,
		index: () => index,
		level: () => level,
		parent: () => parent,
		depth: () => depth,
	});
	setContext(TreeItemContext.key, context);
</script>

{@render children(context)}
