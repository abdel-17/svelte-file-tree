<script lang="ts">
	import { Ref } from "$lib/internal/ref.js";
	import type { FileOrFolder, FolderNode } from "$lib/tree.svelte.js";
	import type { Snippet } from "svelte";
	import { setTreeItemProviderContext } from "./context.svelte.js";
	import type { TreeProps } from "./types.js";

	const {
		node,
		index,
		depth,
		parent,
		onSetItem,
		onDeleteItem,
		children,
	}: {
		node: FileOrFolder;
		index: number;
		depth: number;
		parent: TreeProps.Item<FolderNode> | undefined;
		onSetItem: (item: TreeProps.Item) => void;
		onDeleteItem: (id: string) => void;
		children: Snippet;
	} = $props();

	setTreeItemProviderContext({
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
