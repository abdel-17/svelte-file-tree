<script lang="ts" module>
	import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext } from "svelte";
	import TreeItemProvider from "./TreeItemProvider.svelte";
	import { TreeContext } from "./state.svelte.js";
	import type { TreeItemProviderContext, TreeProps } from "./types.js";

	const CONTEXT_KEY = Symbol("Tree");

	export function getTreeContext(): TreeContext {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <Tree> found");
		}
		return getContext(CONTEXT_KEY);
	}
</script>

<script lang="ts">
	const defaultId = $props.id();
	let {
		tree,
		item,
		pasteOperation = $bindable(),
		id = defaultId,
		element = $bindable(null),
		generateCopyId = () => crypto.randomUUID(),
		onRenameItem = (args) => {
			args.target.name = args.name;
			return true;
		},
		onRenameError,
		onMoveItems = (args) => {
			for (const { target, children } of args.updates) {
				target.children = children;
			}
			return true;
		},
		onMoveError,
		onInsertItems = (args) => {
			args.target.children.splice(args.start, 0, ...args.inserted);
			return true;
		},
		onNameConflict = () => "cancel",
		onDeleteItems = (args) => {
			for (const { target, children } of args.updates) {
				target.children = children;
			}
			return true;
		},
		...rest
	}: TreeProps = $props();

	const treeContext = new TreeContext({
		tree: () => tree,
		pasteOperation: () => pasteOperation,
		setPasteOperation: (value) => {
			pasteOperation = value;
		},
		id: () => id,
		generateCopyId: () => generateCopyId(),
		onRenameItem: (args) => onRenameItem(args),
		onRenameError: (args) => onRenameError?.(args),
		onMoveItems: (args) => onMoveItems(args),
		onMoveError: (args) => onMoveError?.(args),
		onInsertItems: (args) => onInsertItems(args),
		onNameConflict: (args) => onNameConflict(args),
		onDeleteItems: (args) => onDeleteItems(args),
	});
	setContext(CONTEXT_KEY, treeContext);
</script>

{#snippet items(
	nodes: Array<FileTreeNode> = tree.children,
	parent?: TreeItemProviderContext<FolderNode>,
)}
	{#each nodes as node, index (node.id)}
		<TreeItemProvider {node} {index} {parent}>
			{#snippet children(context)}
				{@render item(context)}

				{#if node.type === "folder" && node.expanded}
					{@render items(node.children, context as TreeItemProviderContext<FolderNode>)}
				{/if}
			{/snippet}
		</TreeItemProvider>
	{/each}
{/snippet}

<div bind:this={element} {...rest} {id} role="tree" aria-multiselectable="true">
	{@render items()}
</div>
