<script lang="ts">
	import { TreeContext } from "./context.svelte.js";
	import type { LinkedTreeItemList } from "./tree.svelte.js";
	import type { TreeProps } from "./types.js";

	let {
		tree,
		item: treeItem,
		element = $bindable(null),
		...attributes
	}: TreeProps = $props();

	TreeContext.set({
		tree: () => tree,
		treeElement: () => element,
	});
</script>

{#snippet treeItems(items: LinkedTreeItemList)}
	{#each items.toArray() as item, index (item.id)}
		{@render treeItem(item, index)}
		{#if item.expanded}
			{@render treeItems(item.children)}
		{/if}
	{/each}
{/snippet}

<div
	{...attributes}
	bind:this={element}
	role="tree"
	aria-multiselectable="true"
>
	{@render treeItems(tree.items)}
</div>
