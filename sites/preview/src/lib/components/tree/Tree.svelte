<script lang="ts">
	import { FileNode, FolderNode, type FileTree, type FileTreeNode } from "$lib/tree.svelte.js";
	import { composeEventHandlers, formatSize } from "$lib/utils.js";
	import { FolderIcon } from "@lucide/svelte";
	import { ContextMenu } from "bits-ui";
	import {
		Tree,
		type CircularReferenceErrorArgs,
		type NameConflictResolution,
		type ResolveNameConflictArgs,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";
	import type { EventHandler } from "svelte/elements";
	import { SvelteSet } from "svelte/reactivity";
	import { fly } from "svelte/transition";
	import NameConflictDialog from "./NameConflictDialog.svelte";
	import NameFormDialog from "./NameFormDialog.svelte";
	import TreeContextMenu from "./TreeContextMenu.svelte";
	import TreeItem from "./TreeItem.svelte";
	import { NameConflictDialogState, NameFormDialogState } from "./state.svelte.js";
	import type { FileDropState, TreeContextMenuState, TreeItemState, TreeProps } from "./types.js";

	let {
		tree,
		onRenameItem = ({ target, name }) => {
			target.node.name = name;
			return true;
		},
		defaultSelectedIds,
		selectedIds = new SvelteSet(defaultSelectedIds),
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
		defaultClipboardIds,
		clipboardIds = new SvelteSet(defaultClipboardIds),
		pasteOperation = $bindable(),
		ref = $bindable(null),
		onfocusout,
		...rest
	}: TreeProps = $props();

	let treeComponent: Tree<FileTreeNode> | null = $state.raw(null);
	let menuState: TreeContextMenuState | undefined = $state.raw();
	let focusedItemId: string | undefined = $state.raw();
	let fileDropState: FileDropState | undefined = $state.raw();

	const nameConflictDialogState = new NameConflictDialogState();
	const nameFormDialogState = new NameFormDialogState();

	const pasteDirection: string | undefined = $derived.by(() => {
		if (pasteOperation === undefined || focusedItemId === undefined) {
			return;
		}

		if (expandedIds.has(focusedItemId)) {
			return "Inside";
		}

		return "After";
	});

	function handleResolveNameConflict({
		operation,
		name,
	}: ResolveNameConflictArgs): Promise<NameConflictResolution> {
		return new Promise((resolve) => {
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

			nameConflictDialogState.show({
				title,
				description: `An item with the name "${name}" already exists`,
				onClose: resolve,
			});
		});
	}

	function handleCircularReferenceError({
		target,
		position,
	}: CircularReferenceErrorArgs<FileTreeNode>): void {
		toast.error(`Cannot move "${target.name}" ${position} itself`);
	}

	const handleTriggerContextMenu: EventHandler<Event, HTMLDivElement> = (event) => {
		if (event.defaultPrevented) {
			// A tree item handled the event.
			return;
		}

		if (event.target instanceof Element && event.target.closest("[role='treeitem']") === null) {
			menuState = {
				type: "tree",
			};
		}
	};

	function showAlreadyExistsToast(name: string): void {
		toast.error(`An item with the name "${name}" already exists`);
	}

	function handleRename(target: TreeItemState): void {
		nameFormDialogState.name = target.node.name;
		nameFormDialogState.show({
			title: "Rename",
			onSubmit: async (name) => {
				if (name === target.node.name) {
					nameFormDialogState.close();
					return;
				}

				const owner = target.parent?.node ?? tree;
				for (const child of owner.children) {
					if (child !== target.node && child.name === name) {
						showAlreadyExistsToast(name);
						return;
					}
				}

				const didRename = await onRenameItem({ target, name });
				if (didRename) {
					nameFormDialogState.close();
				}
			},
		});
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
		nameFormDialogState.show({
			title: "New Folder",
			onSubmit: (name) => {
				for (const child of target.children) {
					if (child.name === name) {
						showAlreadyExistsToast(name);
						return;
					}
				}

				const node = new FolderNode({
					id: crypto.randomUUID(),
					name,
					children: [],
				});
				target.children.push(node);
				nameFormDialogState.close();
			},
		});
	}

	function handleExpand(target: TreeItemState): void {
		expandedIds.add(target.node.id);
	}

	function handleCollapse(target: TreeItemState): void {
		expandedIds.delete(target.node.id);
	}

	function handleItemFocusIn(target: TreeItemState): void {
		focusedItemId = target.node.id;
	}

	const handleFocusOut: EventHandler<FocusEvent, HTMLDivElement> = () => {
		focusedItemId = undefined;
	};

	const handleTriggerDragOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		if (event.defaultPrevented) {
			// A tree item handled the event.
			return;
		}

		if (event.dataTransfer?.types.includes("Files")) {
			fileDropState = {
				type: "tree",
			};
			event.preventDefault();
		}
	};

	const handleTriggerDragLeave: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
			// Ignore if the files are dragged to a different element inside the tree.
			return;
		}

		fileDropState = undefined;
	};

	const handleTriggerDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		fileDropState = undefined;

		if (event.defaultPrevented) {
			// A tree item handled the event.
			return;
		}

		const files = event.dataTransfer?.files;
		if (files === undefined || files.length === 0) {
			return;
		}

		handleUploadFiles(tree, files);
		event.preventDefault();
	};

	function handleCleanup(target: TreeItemState): void {
		if (menuState?.type === "item" && menuState.item() === target) {
			menuState = undefined;
		}

		if (focusedItemId === target.node.id) {
			focusedItemId = undefined;
		}

		if (fileDropState?.type === "item" && fileDropState.item() === target) {
			fileDropState = undefined;
		}
	}
</script>

<div class="root flex h-full flex-col">
	<div
		class="grid grid-cols-(--grid-cols) gap-x-(--grid-gap) border-b border-gray-300 px-[calc(var(--tree-inline-padding)+var(--grid-inline-padding))] py-2 text-sm font-semibold"
	>
		<div>Name</div>
		<div>Size</div>
		<div>Kind</div>
	</div>

	<TreeContextMenu
		{tree}
		bind:state={menuState}
		onRename={handleRename}
		onCopy={(target, operation) => treeComponent!.copy(target, operation)}
		onPaste={(target) => treeComponent!.paste(target)}
		onRemove={(target) => treeComponent!.remove(target)}
		onUploadFiles={handleUploadFiles}
		onCreateFolder={handleCreateFolder}
	>
		<ContextMenu.Trigger
			class="relative grow overflow-y-auto"
			oncontextmenu={handleTriggerContextMenu}
			ondragover={handleTriggerDragOver}
			ondragleave={handleTriggerDragLeave}
			ondrop={handleTriggerDrop}
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
				class="h-full px-(--tree-inline-padding) py-2"
				copyNode={(node) => node.copy()}
				onResolveNameConflict={handleResolveNameConflict}
				onCircularReferenceError={handleCircularReferenceError}
				onfocusout={composeEventHandlers(onfocusout, handleFocusOut)}
			>
				{#snippet item({ item })}
					<TreeItem
						{item}
						bind:menuState
						bind:fileDropState
						onExpand={handleExpand}
						onCollapse={handleCollapse}
						onRename={handleRename}
						onUploadFiles={handleUploadFiles}
						onCleanup={handleCleanup}
						onfocusin={() => handleItemFocusIn(item)}
					/>
				{/snippet}
			</Tree>

			{#if fileDropState !== undefined}
				<div
					class="absolute start-4 bottom-4 z-50 rounded-lg bg-blue-200 px-6 py-3 shadow"
					transition:fly={{ x: "-100%" }}
				>
					<div>Drop files to upload them to</div>
					<div class="mt-1 flex items-center justify-center gap-2">
						<FolderIcon role="presentation" size={16} strokeWidth={3} />
						<span class="font-semibold">
							{#if fileDropState.type === "tree"}
								/
							{:else}
								{fileDropState.item().node.name}
							{/if}
						</span>
					</div>
				</div>
			{/if}
		</ContextMenu.Trigger>
	</TreeContextMenu>

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

<NameConflictDialog
	open={nameConflictDialogState.open}
	title={nameConflictDialogState.title}
	description={nameConflictDialogState.description}
	onClose={(result) => nameConflictDialogState.close(result)}
/>

<NameFormDialog
	bind:name={nameFormDialogState.name}
	open={nameFormDialogState.open}
	title={nameFormDialogState.title}
	onSubmit={() => nameFormDialogState.submit()}
	onClose={() => nameFormDialogState.close()}
/>

<style>
	.root {
		--grid-cols: 5fr 1fr 2fr;
		--grid-gap: calc(var(--spacing) * 4);
		--grid-inline-padding: calc(var(--spacing) * 3);
		--tree-inline-padding: calc(var(--spacing) * 6);
	}
</style>
