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
	import { arabicNumbers } from "./utils.js";

	const sortCollator = new Intl.Collator();

	function sortComparator(x: FileTreeNode, y: FileTreeNode) {
		return sortCollator.compare(x.name, y.name);
	}

	const translations = {
		toast: {
			cannotMoveInsideItself: {
				en: (name: string) => `Cannot move "${name}" inside itself`,
				ar: (name: string) => `لا يمكن نقل "${name}" داخل نفسه`,
			},
			itemAlreadyExists: {
				en: (name: string) => `An item named "${name}" already exists in this location`,
				ar: (name: string) => `عنصر باسم "${name}" موجود بالفعل في هذا الموقع`,
			},
			failedToReadFiles: {
				en: "Failed to read uploaded files",
				ar: "فشل قراءة الملفات المرفوعة",
			},
		},
		dialog: {
			failedToMoveItems: {
				en: "Failed to move items",
				ar: "فشل نقل العناصر",
			},
			nameConflictDescription: {
				en: (name: string) =>
					`An item named "${name}" already exists in this location. Do you want to skip it or cancel the operation entirely?`,
				ar: (name: string) =>
					`عنصر باسم "${name}" موجود بالفعل في هذا الموقع. هل تريد تخطيه أو إلغاء العملية بالكامل؟`,
			},
			skip: {
				en: "Skip",
				ar: "تخطي",
			},
			deleteConfirmTitle: {
				en: (count: number) => `Are you sure you want to delete ${count} item(s)?`,
				ar: (count: number) =>
					`هل أنت متأكد أنك تريد حذف ${arabicNumbers(count.toString())} عناصر؟`,
			},
			deleteConfirmDescription: {
				en: "They will be permanently deleted. This action cannot be undone.",
				ar: "سيتم حذفها نهائياً. لا يمكن التراجع عن هذا الإجراء.",
			},
			confirm: {
				en: "Confirm",
				ar: "تأكيد",
			},
			cancel: {
				en: "Cancel",
				ar: "إلغاء",
			},
		},
	};

	export type TreeProps = {
		children: Snippet<[args: TreeChildrenSnippetArgs<FileNode, FolderNode>]>;
		root: FileTree;
		lang?: "en" | "ar";
		class?: ClassValue;
		style?: string;
	};

	export type TreeContext = {
		getLang: () => "en" | "ar";
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
	const { children, root, lang = "en", class: className, style }: TreeProps = $props();

	let tree: Tree<FileNode, FolderNode> | null = $state.raw(null);
	const selectedIds = new SvelteSet<string>();
	const expandedIds = new SvelteSet<string>();

	let draggedId: string | undefined = $state.raw();
	let dropDestinationId: string | undefined = $state.raw();

	let dialogOpen = $state.raw(false);
	let dialogTitle = $state.raw("");
	let dialogDescription = $state.raw("");
	let dialogConfirmLabel = $state.raw("");
	let dialogCancelLabel = $state.raw("");
	let dialogTrigger: HTMLElement | null = null;
	let dialogDidConfirm = false;
	let dialogOnClose: (() => void) | undefined;

	function showDialog({
		title,
		description,
		confirmLabel,
		cancelLabel,
		onClose,
	}: {
		title: string;
		description: string;
		confirmLabel: string;
		cancelLabel: string;
		onClose: () => void;
	}) {
		dialogOpen = true;
		dialogTitle = title;
		dialogDescription = description;
		dialogConfirmLabel = confirmLabel;
		dialogCancelLabel = cancelLabel;
		dialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		dialogDidConfirm = false;
		dialogOnClose = onClose;
	}

	function onDialogOpenChangeComplete(open: boolean) {
		if (!open) {
			dialogTitle = "";
			dialogDescription = "";
			dialogConfirmLabel = "";
			dialogCancelLabel = "";
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
		if (operation === "copy") {
			return "default";
		}

		return new Promise<NameConflictResolution>((resolve) => {
			showDialog({
				title: translations.dialog.failedToMoveItems[lang],
				description: translations.dialog.nameConflictDescription[lang](name),
				confirmLabel: translations.dialog.skip[lang],
				cancelLabel: translations.dialog.cancel[lang],
				onClose: () => {
					resolve(dialogDidConfirm ? "skip" : "cancel");
				},
			});
		});
	}

	function onCircularReference({ source }: OnCircularReferenceArgs<FileNode, FolderNode>) {
		toast.error(translations.toast.cannotMoveInsideItself[lang](source.node.name));
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
				title: translations.dialog.deleteConfirmTitle[lang](removed.length),
				description: translations.dialog.deleteConfirmDescription[lang],
				confirmLabel: translations.dialog.confirm[lang],
				cancelLabel: translations.dialog.cancel[lang],
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

			const firstSegment = entry.name.split("/")[0]!;
			if (uniqueNames.has(firstSegment)) {
				toast.error(translations.toast.itemAlreadyExists[lang](firstSegment));
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
			toast.error(translations.toast.failedToReadFiles[lang]);
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
		getLang: () => lang,
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
	{lang}
	dir="auto"
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
								{dialogCancelLabel}
							</AlertDialog.Cancel>
						</div>
					</div>
				{/if}
			{/snippet}
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
