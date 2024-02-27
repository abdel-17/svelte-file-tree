<script lang="ts">
	import { Tree } from "$lib/helpers/tree.js";
	import TreeItem from "./TreeItem.svelte";

	export let tree: Tree<string>;

	let expandedIds = new Set<string>();
	let selectedIds = new Set<string>();
	let focusableId: string | null = null;

	$: nodes = Array.from(
		tree.filter(
			(node) => node.parent === undefined || expandedIds.has(node.parent.id),
		),
	);
</script>

<div role="tree" aria-multiselectable="true">
	{#each nodes as node, index (node.id)}
		<TreeItem
			bind:expandedIds
			bind:selectedIds
			bind:focusableId
			{nodes}
			{node}
			{index}
		/>
	{/each}
</div>
