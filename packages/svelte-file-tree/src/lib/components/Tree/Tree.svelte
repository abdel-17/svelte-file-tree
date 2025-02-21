<script lang="ts">
	import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
	import TreeItemProvider from "./TreeItemProvider.svelte";
	import { TreeContext } from "./context.js";
	import { createTreeState } from "./state.svelte.js";
	import type { TreeItemSnippetProps, TreeProps } from "./types.js";

	let {
		tree,
		item,
		pasteOperation = $bindable(),
		id = crypto.randomUUID(),
		element = $bindable(null),
		generateCopyId = () => crypto.randomUUID(),
		onRenameItem = ({ target, name }) => {
			target.name = name;
			return true;
		},
		onRenameError,
		onMoveItems = ({ updates }) => {
			for (const { target, children } of updates) {
				target.children = children;
			}
			return true;
		},
		onMoveError,
		onInsertItems = ({ target, start, inserted }) => {
			target.children.splice(start, 0, ...inserted);
			return true;
		},
		onNameConflict = () => "cancel",
		onDeleteItems = ({ updates }) => {
			for (const { target, children } of updates) {
				target.children = children;
			}
			return true;
		},
		...attributes
	}: TreeProps = $props();

	const treeState = createTreeState({
		tree: () => tree,
		pasteOperation: () => pasteOperation,
		setPasteOperation: (value) => {
			pasteOperation = value;
		},
		treeId: () => id,
		generateCopyId: () => generateCopyId(),
		onRenameItem: (event) => onRenameItem(event),
		onRenameError: (event) => onRenameError?.(event),
		onMoveItems: (event) => onMoveItems(event),
		onMoveError: (event) => onMoveError?.(event),
		onInsertItems: (event) => onInsertItems(event),
		onNameConflict: (event) => onNameConflict(event),
		onDeleteItems: (event) => onDeleteItems(event),
	});

	TreeContext.set({ treeState });
</script>

{#snippet items(
	nodes: Array<FileTreeNode> = tree.children,
	depth: number = 0,
	parent?: TreeItemSnippetProps<FolderNode>,
)}
	{#each nodes as node, index (node.id)}
		{@const props = { node, index, depth, parent }}
		<TreeItemProvider {node} {index} {depth} {parent}>
			{@render item(props)}
		</TreeItemProvider>

		{#if node.type === "folder" && node.expanded}
			{@render items(node.children, depth + 1, props as TreeItemSnippetProps<FolderNode>)}
		{/if}
	{/each}
{/snippet}

<div bind:this={element} {...attributes} {id} role="tree" aria-multiselectable="true">
	{@render items()}
</div>
