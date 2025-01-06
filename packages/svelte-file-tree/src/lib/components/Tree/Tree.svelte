<script lang="ts">
	import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
	import { setContext } from "svelte";
	import TreeItemContextProvider from "./TreeItemContextProvider.svelte";
	import { TreeContext, type TreeItemData } from "./context.svelte.js";
	import type { TreeProps } from "./types.js";

	let {
		tree,
		item,
		id = crypto.randomUUID(),
		element = $bindable(null),
		onMoveItems,
		onMoveCircularReferenceError,
		onMoveNameConflictError,
		onInsertItems,
		onDeleteItems,
		onRenameItem,
		onRenameError,
		...attributes
	}: TreeProps = $props();

	const context = new TreeContext({
		id: () => id,
		callbacks: {
			onMoveItems: (args) => onMoveItems?.(args),
			onMoveCircularReferenceError: (args) => onMoveCircularReferenceError?.(args),
			onMoveNameConflictError: (args) => onMoveNameConflictError?.(args),
			onInsertItems: (args) => onInsertItems?.(args),
			onDeleteItems: (args) => onDeleteItems?.(args),
			onRenameItem: (args) => onRenameItem?.(args),
			onRenameError: (args) => onRenameError?.(args),
		},
	});
	setContext(TreeContext.key, context);
</script>

{#snippet items(level: FileTreeNode[], parent?: TreeItemData<FolderNode>, depth = 0)}
	{#each level as node, index (node.id)}
		<TreeItemContextProvider {node} {index} {level} {parent} {depth}>
			{#snippet children({ editing, dropPosition })}
				{@render item({
					node,
					index,
					depth,
					editing,
					copied: context.isCopied(node),
					cut: context.isCut(node),
					dragged: context.isDragged(node),
					dropPosition,
				})}
			{/snippet}
		</TreeItemContextProvider>

		{#if node.type === "folder" && node.expanded}
			{@render items(node.children, { node, index, level, parent }, depth + 1)}
		{/if}
	{/each}
{/snippet}

<div {...attributes} bind:this={element} {id} role="tree" aria-multiselectable="true">
	{@render items(tree.children)}
</div>
