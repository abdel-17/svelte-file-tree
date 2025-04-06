<script lang="ts" generics="TNode extends FileNode | FolderNode<TNode> = FileTreeNode">
	import { FileNode, FolderNode, type FileTreeNode } from "$lib/tree.svelte.js";
	import { DEV } from "esm-env";
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
		isItemEditable = true,
		isItemDisabled = false,
		id = defaultId,
		ref = $bindable(null),
		copyNode = function copyNode(node): TNode {
			if (DEV && node.constructor !== FileNode && node.constructor !== FolderNode) {
				throw new Error(
					"Cannot copy an object that extends from `FileNode` or `FolderNode`. Pass a `copyNode` prop to specify how the object should be copied.",
				);
			}

			switch (node.type) {
				case "file": {
					return new FileNode({
						id: crypto.randomUUID(),
						name: node.name,
					}) as TNode;
				}
				case "folder": {
					return new FolderNode({
						id: crypto.randomUUID(),
						name: node.name,
						children: node.children.map(copyNode),
					}) as TNode;
				}
			}
		},
		onRenameItem = ({ target, name }) => {
			target.name = name;
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
	}: TreeProps<TNode> = $props();

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
		copyNode: (node) => copyNode(node),
		onRenameItem: (args) => onRenameItem(args),
		onMoveItems: (args) => onMoveItems(args),
		onCopyPasteItems: (args) => onCopyPasteItems(args),
		onRemoveItems: (args) => onRemoveItems(args),
		onResolveNameConflict: (args) => onResolveNameConflict(args),
		onAlreadyExistsError: (args) => onAlreadyExistsError?.(args),
		onCircularReferenceError: (args) => onCircularReferenceError?.(args),
	});

	export const { rename, copy, paste, remove } = treeState;
</script>

<div {...rest} bind:this={ref} {id} role="tree" aria-multiselectable="true">
	{#each treeState.items() as i (i.node.id)}
		<TreeItemProvider {treeState} item={i}>
			{#if i.visible}
				{@render item({ item: i })}
			{/if}
		</TreeItemProvider>
	{/each}
</div>
