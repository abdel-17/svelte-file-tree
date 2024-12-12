<script lang="ts">
	import { TreeState } from "$lib/state.svelte.js";
	import type { FileTree, FileTreeNode } from "$lib/tree.svelte.js";
	import type { HTMLDivAttributes } from "$lib/types.js";
	import type { Snippet } from "svelte";
	import TreeItemProvider from "./TreeItemProvider.svelte";

	interface Props extends Omit<HTMLDivAttributes, "children"> {
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
		<TreeItemProvider {treeState} {node} {index}>
			{@render item(node, index)}
		</TreeItemProvider>

		{#if node.isFolder() && node.expanded}
			{@render items(node.children)}
		{/if}
	{/each}
{/snippet}

<div {...attributes} bind:this={element} {id} role="tree" aria-multiselectable="true">
	{@render items(tree.nodes)}
</div>
