<script lang="ts">
	import { Ref } from "$lib/internal/box.svelte.js";
	import type { FileTree } from "$lib/tree.svelte.js";
	import type { Snippet } from "svelte";
	import { type TreeContext, TreeItemProviderContext } from "./context.js";

	const {
		node,
		index,
		depth,
		parent,
		onSetItem,
		onDeleteItem,
		children,
	}: {
		node: FileTree.Node;
		index: number;
		depth: number;
		parent: TreeContext.ParentItem | undefined;
		onSetItem: (item: TreeContext.Item) => void;
		onDeleteItem: (id: string) => void;
		children: Snippet;
	} = $props();

	TreeItemProviderContext.set({
		node: new Ref(() => node),
		index: new Ref(() => index),
		depth: new Ref(() => depth),
		parent: new Ref(() => parent),
	});

	$effect(() => {
		onSetItem({ node, index, parent });
	});

	$effect(() => {
		return () => onDeleteItem(node.id);
	});
</script>

{@render children()}
