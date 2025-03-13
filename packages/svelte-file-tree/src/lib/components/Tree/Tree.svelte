<script lang="ts">
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
		...rest
	}: TreeProps = $props();

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
		onRenameError: (args) => onRenameError?.(args),
		onMoveItems: (args) => onMoveItems(args),
		onMoveError: (args) => onMoveError?.(args),
		onInsertItems: (args) => onInsertItems(args),
		onNameConflict: (args) => onNameConflict(args),
		onDeleteItems: (args) => onDeleteItems(args),
	});
</script>

<div {...rest} bind:this={ref} {id} role="tree" aria-multiselectable="true">
	{#each treeState.items() as i (i.node.id)}
		<TreeItemProvider {treeState} item={i}>
			{#if i.visible()}
				{@render item(i)}
			{/if}
		</TreeItemProvider>
	{/each}
</div>
