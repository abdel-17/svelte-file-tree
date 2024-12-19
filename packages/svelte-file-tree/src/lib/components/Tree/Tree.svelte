<script lang="ts">
	import type { FileTreeNode } from "$lib/tree.svelte.js";
	import { TreeState } from "./context.svelte.js";
	import TreeItemProvider from "./TreeItemProvider.svelte";
	import type { TreeProps } from "./types.js";

	let {
		tree,
		item,
		id = crypto.randomUUID(),
		element = $bindable(null),
		onMoveItems,
		onInsertItems,
		onDeleteItems,
		onRenameItem,
		onRenameError,
		...attributes
	}: TreeProps = $props();

	const treeState = new TreeState({
		getElementId: () => id,
		callbacks: {
			onMoveItems(nodes, start, count) {
				onMoveItems?.(nodes, start, count);
			},
			onInsertItems(nodes, start, count) {
				onInsertItems?.(nodes, start, count);
			},
			onDeleteItems(nodes) {
				onDeleteItems?.(nodes);
			},
			onRenameItem(node) {
				onRenameItem?.(node);
			},
			onRenameError(node, error) {
				onRenameError?.(node, error);
			},
		},
	});
</script>

{#snippet items(nodes: FileTreeNode[])}
	{#each nodes as node, index (node.id)}
		<TreeItemProvider {treeState} {node} {index}>
			{#snippet children(context)}
				{@render item({
					node,
					index,
					editing: context.editing,
					dragged: treeState.draggedId === node.id,
					dropPosition: context.dropPosition,
				})}
			{/snippet}
		</TreeItemProvider>

		{#if node.type === "folder" && node.expanded}
			{@render items(node.children)}
		{/if}
	{/each}
{/snippet}

<div {...attributes} bind:this={element} {id} role="tree" aria-multiselectable="true">
	{@render items(tree.nodes)}
</div>
