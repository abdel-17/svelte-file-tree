<script lang="ts">
	import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
	import type { Snippet } from "svelte";
	import { TreeItemProviderContext } from "./context.js";
	import type { TreeItemPosition } from "./state.svelte.js";

	const {
		node,
		index,
		depth,
		parent,
		children,
	}: {
		node: FileTreeNode;
		index: number;
		depth: number;
		parent: TreeItemPosition<FolderNode> | undefined;
		children: Snippet;
	} = $props();

	TreeItemProviderContext.set({
		node: () => node,
		index: () => index,
		depth: () => depth,
		parent: () => parent,
	});
</script>

{@render children()}
