<script lang="ts">
	import { FileNode, FolderNode, type FileTree, type FileTreeNode } from "$lib/tree.svelte";
	import { formatSize } from "$lib/utils";
	import {
		Tree,
		type AlreadyExistsErrorArgs,
		type CircularReferenceErrorArgs,
		type NameConflictResolution,
		type PasteOperation,
		type ResolveNameConflictArgs,
		type TreeItemState,
		type TreeProps,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";
	import { SvelteSet } from "svelte/reactivity";
	import ContextMenu from "./ContextMenu.svelte";
	import NameConflictDialog from "./NameConflictDialog.svelte";
	import NewFolderDialog from "./NewFolderDialog.svelte";
	import TreeItem from "./TreeItem.svelte";

	interface Props
		extends Omit<
			TreeProps<FileTreeNode>,
			| "tree"
			| "item"
			| "copyNode"
			| "onResolveNameConflict"
			| "onAlreadyExistsError"
			| "onCircularReferenceError"
		> {
		tree: FileTree;
	}

	let {
		tree,
		defaultSelectedIds,
		selectedIds = new SvelteSet(defaultSelectedIds),
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
		defaultClipboardIds,
		clipboardIds = new SvelteSet(defaultClipboardIds),
		pasteOperation = $bindable(),
		ref = $bindable(null),
		...rest
	}: Props = $props();

	let treeComponent: Tree<FileTreeNode> | null = $state.raw(null);
	let contextMenu: ContextMenu | null = $state.raw(null);
	let nameConflictDialog: NameConflictDialog | null = $state.raw(null);
	let newFolderDialog: NewFolderDialog | null = $state.raw(null);
	let focusedItem: TreeItemState<FileTreeNode> | undefined = $state.raw();

	const pasteDirection: string | undefined = $derived.by(() => {
		if (pasteOperation === undefined || focusedItem === undefined) {
			return;
		}

		if (focusedItem.node.type === "folder" && focusedItem.expanded()) {
			return "Inside";
		}

		return "After";
	});

	function handleResolveNameConflict({
		operation,
		name,
	}: ResolveNameConflictArgs): Promise<NameConflictResolution> {
		return new Promise((resolve) => {
			if (nameConflictDialog === null) {
				throw new Error("Dialog is not mounted");
			}

			let title: string;
			switch (operation) {
				case "move": {
					title = "Failed to move items";
					break;
				}
				case "copy-paste": {
					title = "Failed to paste items";
					break;
				}
			}

			nameConflictDialog.open({
				title,
				description: `An item with the name "${name}" already exists`,
				onClose: resolve,
			});
		});
	}

	function handleAlreadyExistsError({ name }: AlreadyExistsErrorArgs): void {
		toast.error(`An item with the name "${name}" already exists`);
	}

	function handleCircularReferenceError({
		target,
		position,
	}: CircularReferenceErrorArgs<FileTreeNode>): void {
		toast.error(`Cannot move "${target.name}" ${position} itself`);
	}

	function handleCopy(target: TreeItemState<FileTreeNode>, operation: PasteOperation): void {
		if (treeComponent === null) {
			throw new Error("Tree is not mounted");
		}

		treeComponent.copy(target, operation);
	}

	function handlePaste(target: TreeItemState<FileTreeNode>): void {
		if (treeComponent === null) {
			throw new Error("Tree is not mounted");
		}

		treeComponent.paste(target);
	}

	function handleRemove(target: TreeItemState<FileTreeNode>): void {
		if (treeComponent === null) {
			throw new Error("Tree is not mounted");
		}

		treeComponent.remove(target);
	}

	function handleUploadFiles(target: FolderNode | FileTree, files: FileList): void {
		for (const file of files) {
			const node = new FileNode({
				id: crypto.randomUUID(),
				name: file.name,
				size: file.size,
			});
			target.children.push(node);
		}
	}

	function handleCreateFolder(target: FolderNode | FileTree): void {
		if (newFolderDialog === null) {
			throw new Error("Dialog is not mounted");
		}

		newFolderDialog.open({
			onSubmit: (name) => {
				for (const child of target.children) {
					if (child.name === name) {
						handleAlreadyExistsError({ name });
						return;
					}
				}

				const node = new FolderNode({
					id: crypto.randomUUID(),
					name,
					children: [],
				});
				target.children.push(node);
				newFolderDialog?.close();
			},
		});
	}
</script>

<div class="root flex h-svh flex-col">
	<div
		class="grid grid-cols-(--grid-cols) gap-x-(--grid-gap) border-b border-gray-300 px-[calc(var(--tree-inline-padding)+var(--grid-inline-padding))] py-3 text-sm font-semibold"
	>
		<div>Name</div>
		<div>Size</div>
		<div>Kind</div>
	</div>

	<ContextMenu
		{tree}
		bind:this={contextMenu}
		onCopy={handleCopy}
		onPaste={handlePaste}
		onRemove={handleRemove}
		onUploadFiles={handleUploadFiles}
		onCreateFolder={handleCreateFolder}
	>
		<Tree
			{...rest}
			{tree}
			{selectedIds}
			{expandedIds}
			{clipboardIds}
			bind:this={treeComponent}
			bind:pasteOperation
			bind:ref
			copyNode={(node) => node.copy()}
			onResolveNameConflict={handleResolveNameConflict}
			onAlreadyExistsError={handleAlreadyExistsError}
			onCircularReferenceError={handleCircularReferenceError}
			onfocusout={() => {
				focusedItem = undefined;
			}}
		>
			{#snippet item({ item })}
				<TreeItem
					{item}
					{contextMenu}
					onExpand={() => expandedIds.add(item.node.id)}
					onCollapse={() => expandedIds.delete(item.node.id)}
					onfocusin={() => {
						focusedItem = item;
					}}
				/>
			{/snippet}
		</Tree>
	</ContextMenu>

	<div class="grid shrink-0 grid-cols-5 place-items-center bg-gray-200 p-2 text-sm">
		<div>
			<span class="font-medium text-gray-700">Items:</span>
			<span class="font-semibold text-gray-900">{tree.count}</span>
		</div>

		<div>
			<span class="font-medium text-gray-700">Selected:</span>
			<span class="font-semibold text-gray-900">{selectedIds.size}</span>
		</div>

		<div>
			<span class="font-medium text-gray-700">Clipboard:</span>
			<span class="font-semibold text-gray-900">{clipboardIds.size}</span>
		</div>

		<div>
			<span class="font-medium text-gray-700">Paste:</span>
			<span class="font-semibold text-gray-900">{pasteDirection}</span>
		</div>

		<div>
			<span class="font-medium text-gray-700">Total Size:</span>
			<span class="font-semibold text-gray-900">{formatSize(tree.size)}</span>
		</div>
	</div>
</div>

<NameConflictDialog bind:this={nameConflictDialog} />
<NewFolderDialog bind:this={newFolderDialog} />

<style>
	.root {
		--grid-cols: 5fr 1fr 2fr;
		--grid-gap: calc(var(--spacing) * 4);
		--grid-inline-padding: calc(var(--spacing) * 3);
		--tree-inline-padding: calc(var(--spacing) * 6);
	}
</style>
