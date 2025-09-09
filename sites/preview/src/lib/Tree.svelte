<script lang="ts" module>
	import { AlertDialog } from "bits-ui";
	import { getContext, setContext, type Snippet } from "svelte";
	import type { ClassValue, EventHandler } from "svelte/elements";
	import { SvelteSet } from "svelte/reactivity";
	import { fade, scale } from "svelte/transition";
	import {
		Tree,
		type NameConflictResolution,
		type OnCircularReferenceArgs,
		type OnCopyArgs,
		type OnMoveArgs,
		type OnRemoveArgs,
		type OnResolveNameConflictArgs,
		type TreeChildrenSnippetArgs,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";
	import {
		FileNode,
		FolderNode,
		type FileTree,
		type FileTreeNode,
		type TreeItemState,
	} from "./tree.svelte.js";

	const sortCollator = new Intl.Collator();

	function sortComparator(x: FileTreeNode, y: FileTreeNode) {
		return sortCollator.compare(x.name, y.name);
	}

	export type TreeProps = {
		children: Snippet<[args: TreeChildrenSnippetArgs<FileNode, FolderNode>]>;
		root: FileTree;
		class?: ClassValue;
		style?: string;
	};

	export type TreeContext = {
		getSelectedIds: () => Set<string>;
		getExpandedIds: () => Set<string>;
		getDraggedId: () => string | undefined;
		setDraggedId: (value: string | undefined) => void;
		getDropDestinationId: () => string | undefined;
		setDropDestinationId: (value: string | undefined) => void;
	};

	const CONTEXT_KEY = Symbol("TreeContext");

	export function getTreeContext(): TreeContext {
		return getContext(CONTEXT_KEY);
	}
</script>

<script lang="ts">
	const { children, root, class: className, style }: TreeProps = $props();

	let tree: Tree<FileNode, FolderNode> | null = $state.raw(null);
	const selectedIds = new SvelteSet<string>();
	const expandedIds = new SvelteSet<string>();

	let draggedId: string | undefined = $state.raw();
	let dropDestinationId: string | undefined = $state.raw();

	let dialogOpen = $state.raw(false);
	let dialogTitle = $state.raw("");
	let dialogDescription = $state.raw("");
	let dialogConfirmLabel = $state.raw("");
	let dialogTrigger: HTMLElement | null = null;
	let dialogDidConfirm = false;
	let dialogOnClose: (() => void) | undefined;

	function showDialog({
		title,
		description,
		confirmLabel,
		onClose,
	}: {
		title: string;
		description: string;
		confirmLabel: string;
		onClose: () => void;
	}) {
		dialogOpen = true;
		dialogTitle = title;
		dialogDescription = description;
		dialogConfirmLabel = confirmLabel;
		dialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		dialogDidConfirm = false;
		dialogOnClose = onClose;
	}

	function onDialogOpenChangeComplete(open: boolean) {
		if (!open) {
			dialogTitle = "";
			dialogDescription = "";
			dialogConfirmLabel = "";
			dialogTrigger?.focus();
			dialogTrigger = null;
			dialogOnClose?.();
			dialogOnClose = undefined;
		}
	}

	function onDialogConfirm() {
		dialogOpen = false;
		dialogDidConfirm = true;
	}

	function copyNode(node: FileNode | FolderNode): FileNode | FolderNode {
		switch (node.type) {
			case "file": {
				return new FileNode({
					id: crypto.randomUUID(),
					name: node.name,
					size: node.size,
				});
			}
			case "folder": {
				return new FolderNode({
					id: crypto.randomUUID(),
					name: node.name,
					children: node.children.map(copyNode),
				});
			}
		}
	}

	async function onResolveNameConflict({
		operation,
		name,
	}: OnResolveNameConflictArgs<FileNode, FolderNode>) {
		return new Promise<NameConflictResolution>((resolve) => {
			let title;
			switch (operation) {
				case "copy": {
					title = "Failed to copy items";
					break;
				}
				case "move": {
					title = "Failed to move items";
					break;
				}
			}

			showDialog({
				title,
				description: `An item named "${name}" already exists in this location. Do you want to skip it or cancel the operation entirely?`,
				confirmLabel: "Skip",
				onClose: () => {
					resolve(dialogDidConfirm ? "skip" : "cancel");
				},
			});
		});
	}

	function onCircularReference({ source }: OnCircularReferenceArgs<FileNode, FolderNode>) {
		toast.error(`Cannot move "${source.node.name}" inside itself`);
	}

	function onCopy({ destination }: OnCopyArgs<FileNode, FolderNode>) {
		const owner = destination?.node ?? root;
		owner.children.sort(sortComparator);
	}

	function onMove({ destination }: OnMoveArgs<FileNode, FolderNode>) {
		const owner = destination?.node ?? root;
		owner.children.sort(sortComparator);
	}

	function canRemove({ removed }: OnRemoveArgs<FileNode, FolderNode>) {
		return new Promise<boolean>((resolve) => {
			showDialog({
				title: `Are you sure you want to delete ${removed.length} item(s)?`,
				description: "They will be permanently deleted. This action cannot be undone.",
				confirmLabel: "Confirm",
				onClose: () => {
					resolve(dialogDidConfirm);
				},
			});
		});
	}

	const handleDragEnterOrOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		if (event.target !== event.currentTarget) {
			return;
		}

		event.preventDefault();

		if (draggedId !== undefined && event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}
	};

	async function dropItems(draggedId: string, destination: TreeItemState | undefined) {
		if (destination?.node.type === "file") {
			throw new Error("Cannot drop on a file");
		}

		const movedIds = new Set(selectedIds).add(draggedId);
		const didMove = await tree!.move(movedIds, destination);
		if (!didMove) {
			return;
		}

		let focusTargetOrder;
		if (destination === undefined || destination.expanded) {
			focusTargetOrder = tree!.getVisibleItems().findIndex((item) => item.node.id === draggedId);
		} else {
			focusTargetOrder = tree!
				.getVisibleItems()
				.findIndex((item) => item.node.id === destination.node.id);
		}

		if (focusTargetOrder !== -1) {
			tree!.focusItem(focusTargetOrder);
		}
	}

	async function dropFiles(items: DataTransferItemList, destination: TreeItemState | undefined) {
		if (destination?.node.type === "file") {
			throw new Error("Cannot drop on a file");
		}

		const owner = destination?.node ?? root;
		const uniqueNames = new Set();
		for (const child of owner.children) {
			uniqueNames.add(child.name);
		}

		const entries: Array<FileSystemEntry> = [];
		for (const item of items) {
			const entry = item.webkitGetAsEntry();
			if (entry === null) {
				continue;
			}

			const firstSegment = entry.name.split("/")[0];
			if (uniqueNames.has(firstSegment)) {
				toast.error(`An item named "${firstSegment}" already exists in this location`);
				return;
			}

			entries.push(entry);
		}

		const files: Array<{
			file: File;
			relativePath: string;
		}> = [];

		async function readEntry(entry: FileSystemEntry) {
			if (entry.isFile) {
				files.push({
					file: await new Promise((resolve, reject) => {
						(entry as FileSystemFileEntry).file(resolve, reject);
					}),
					relativePath: entry.fullPath.slice(1),
				});
			} else if (entry.isDirectory) {
				const reader = (entry as FileSystemDirectoryEntry).createReader();
				let entries: Array<FileSystemEntry>;
				do {
					entries = await new Promise((resolve, reject) => {
						reader.readEntries(resolve, reject);
					});
					await Promise.all(entries.map(readEntry));
				} while (entries.length > 0);
			}
		}

		try {
			await Promise.all(entries.map(readEntry));
		} catch (error) {
			console.error(error);
			toast.error("Failed to read uploaded files");
			return;
		}

		const nodes = new Map<string, FileNode | FolderNode>();
		const uniqueOwners = new Set<FolderNode | FileTree>().add(owner);
		for (const { file, relativePath } of files) {
			const segments = relativePath.split("/");
			let currentOwner = owner;
			for (let i = 0; i < segments.length; i++) {
				const segment = segments[i]!;

				let node = nodes.get(segment);
				if (node === undefined) {
					if (i === segments.length - 1) {
						node = new FileNode({
							id: crypto.randomUUID(),
							name: segment,
							size: file.size,
						});
					} else {
						node = new FolderNode({
							id: crypto.randomUUID(),
							name: segment,
							children: [],
						});
						uniqueOwners.add(node);
					}

					nodes.set(segment, node);
					currentOwner.children.push(node);
				}

				if (node.type === "folder") {
					currentOwner = node;
				}
			}
		}

		for (const owner of uniqueOwners) {
			owner.children.sort(sortComparator);
		}
	}

	const handleDrop: EventHandler<DragEvent> = (event) => {
		event.preventDefault();

		let dropDestination;
		if (dropDestinationId !== undefined) {
			dropDestination = tree!.getItem(dropDestinationId);
		}

		if (draggedId !== undefined) {
			dropItems(draggedId, dropDestination);
		} else if (event.dataTransfer?.types.includes("Files")) {
			dropFiles(event.dataTransfer.items, dropDestination);
		}

		dropDestinationId = undefined;
	};

	const context: TreeContext = {
		getSelectedIds: () => selectedIds,
		getExpandedIds: () => expandedIds,
		getDraggedId: () => draggedId,
		setDraggedId: (value) => {
			draggedId = value;
		},
		getDropDestinationId: () => dropDestinationId,
		setDropDestinationId: (value) => {
			dropDestinationId = value;
		},
	};
	setContext(CONTEXT_KEY, context);
</script>

<Tree
	bind:this={tree}
	{children}
	{root}
	{selectedIds}
	{expandedIds}
	{copyNode}
	{onResolveNameConflict}
	{onCircularReference}
	{onCopy}
	{onMove}
	{canRemove}
	class={className}
	{style}
	ondragenter={handleDragEnterOrOver}
	ondragover={handleDragEnterOrOver}
	ondrop={handleDrop}
/>

<AlertDialog.Root bind:open={dialogOpen} onOpenChangeComplete={onDialogOpenChangeComplete}>
	<AlertDialog.Portal>
		<AlertDialog.Overlay forceMount class="fixed inset-0 z-50 bg-black/80">
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:fade={{ duration: 200 }}></div>
				{/if}
			{/snippet}
		</AlertDialog.Overlay>

		<AlertDialog.Content
			forceMount
			class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-7 text-black shadow"
		>
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:scale={{ duration: 200 }}>
						<AlertDialog.Title class="text-lg font-semibold tracking-tight">
							{dialogTitle}
						</AlertDialog.Title>

						<AlertDialog.Description class="mt-2 text-sm text-gray-700">
							{dialogDescription}
						</AlertDialog.Description>

						<div class="mt-4 flex justify-end gap-2">
							<AlertDialog.Action
								class="inline-flex h-10 items-center justify-center rounded bg-gray-700 px-6 text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 active:scale-95"
								onclick={onDialogConfirm}
							>
								{dialogConfirmLabel}
							</AlertDialog.Action>

							<AlertDialog.Cancel
								class="inline-flex h-10 items-center justify-center rounded bg-gray-200 px-6 text-sm font-medium hover:bg-gray-300 focus-visible:outline-2 focus-visible:outline-current active:scale-95"
							>
								Cancel
							</AlertDialog.Cancel>
						</div>
					</div>
				{/if}
			{/snippet}
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
