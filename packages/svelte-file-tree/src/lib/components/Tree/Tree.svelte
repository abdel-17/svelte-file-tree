<script lang="ts" generics="TData extends FileTreeNodeData">
	import type { FileTreeNodeData } from "$lib/tree.svelte.js";
	import { SvelteSet } from "svelte/reactivity";
	import TreeItemProvider from "./TreeItemProvider.svelte";
	import { createTreeState } from "./state.svelte.js";
	import type { TreeProps } from "./types.js";

	const defaultId = $props.id();
	let {
		tree,
		item,
		defaultSelectedIds,
		selectedIds = new SvelteSet(defaultSelectedIds),
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
		defaultClipboardIds,
		clipboardIds = new SvelteSet(defaultClipboardIds),
		pasteOperation = $bindable(),
		isItemEditable = false,
		isItemDisabled = false,
		id = defaultId,
		ref = $bindable(null),
		generateCopyId = () => crypto.randomUUID(),
		onRenameItem = ({ target, name }) => {
			target.data.name = name;
			return true;
		},
		onMoveItems = ({ updates }) => {
			for (const { target, children } of updates) {
				target.children = children;
			}
			return true;
		},
		onCopyPasteItems = ({ target, start, copies }) => {
			target.children.splice(start, 0, ...copies);
			return true;
		},
		onRemoveItems = ({ updates }) => {
			for (const { target, children } of updates) {
				target.children = children;
			}
			return true;
		},
		onResolveNameConflict = () => "cancel",
		onAlreadyExistsError,
		onCircularReferenceError,
		...rest
	}: TreeProps<TData> = $props();

	const treeState = createTreeState({
		tree: () => tree,
		selectedIds: () => selectedIds,
		expandedIds: () => expandedIds,
		clipboardIds: () => clipboardIds,
		pasteOperation: () => pasteOperation,
		setPasteOperation: (value) => {
			pasteOperation = value;
		},
		isItemEditable: (node) => {
			if (typeof isItemEditable === "function") {
				return isItemEditable(node);
			}

			return isItemEditable;
		},
		isItemDisabled: (node) => {
			if (typeof isItemDisabled === "function") {
				return isItemDisabled(node);
			}

			return isItemDisabled;
		},
		id: () => id,
		generateCopyId: () => generateCopyId(),
		onRenameItem: (args) => onRenameItem(args),
		onMoveItems: (args) => onMoveItems(args),
		onCopyPasteItems: (args) => onCopyPasteItems(args),
		onRemoveItems: (args) => onRemoveItems(args),
		onResolveNameConflict: (args) => onResolveNameConflict(args),
		onAlreadyExistsError: (args) => onAlreadyExistsError?.(args),
		onCircularReferenceError: (args) => onCircularReferenceError?.(args),
	});
</script>

<div {...rest} bind:this={ref} {id} role="tree" aria-multiselectable="true">
	{#each treeState.items() as i (i.node.id)}
		<TreeItemProvider {treeState} item={i}>
			{#if i.visible()}
				{@render item({
					item: i,
					rename: (name) => treeState.rename(i, name),
					paste: (position) => treeState.paste(i, position),
					remove: () => treeState.remove(i),
				})}
			{/if}
		</TreeItemProvider>
	{/each}
</div>
