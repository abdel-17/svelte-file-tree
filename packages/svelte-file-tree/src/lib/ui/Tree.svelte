<script lang="ts">
	import { FileTree, FileTreeNode } from "$lib/data/tree.svelte.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { TreeState } from "./state.svelte.js";
	import TreeItemContextProvider from "./TreeItemContextProvider.svelte";

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
		tree: FileTree;
		item: Snippet<[node: FileTreeNode, index: number]>;
		id?: string;
		element?: HTMLDivElement | null;
	}

	let {
		tree,
		item,
		id = crypto.randomUUID(),
		element = $bindable(null),
		...attributes
	}: Props = $props();

	const treeState = new TreeState(() => id);
</script>

{#snippet items(nodes: FileTreeNode[])}
	{#each nodes as node, index (node.id)}
		<TreeItemContextProvider {treeState} {node} {index}>
			{@render item(node, index)}
		</TreeItemContextProvider>

		{#if node.isFolder() && node.expanded}
			{@render items(node.children)}
		{/if}
	{/each}
{/snippet}

<div {...attributes} bind:this={element} {id} role="tree" aria-multiselectable="true">
	{@render items(tree.nodes)}
</div>
