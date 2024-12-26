<script lang="ts">
import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import TreeItemProvider from "./TreeItemProvider.svelte";
import type { TreeContext } from "./context.js";
import { TreeState } from "./state.svelte.js";
import type { TreeItemData, TreeProps } from "./types.js";

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

const treeState = new TreeState();
const treeContext: TreeContext = {
	treeState,
	getTree: () => tree,
	getTreeId: () => id,
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
};
</script>

{#snippet items(nodes: FileTreeNode[], parent?: TreeItemData<FolderNode>, depth: number = 0)}
	{#each nodes as node, index (node.id)}
		<TreeItemProvider {treeContext} {node} {index} {parent} {depth}>
			{#snippet children(itemState)}
				{@render item({
					node,
					index,
					parent,
					depth,
					editing: itemState.editing,
					dragged: treeState.isDragged(node),
					dropPosition: itemState.dropPosition,
				})}
			{/snippet}
		</TreeItemProvider>

		{#if node.type === "folder" && node.expanded}
			{@render items(node.children, { node, index, parent }, depth + 1)}
		{/if}
	{/each}
{/snippet}

<div {...attributes} bind:this={element} {id} role="tree" aria-multiselectable="true">
	{@render items(tree.nodes)}
</div>
