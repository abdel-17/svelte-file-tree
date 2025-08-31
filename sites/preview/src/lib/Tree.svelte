<script lang="ts" module>
	import { AlertDialog } from "bits-ui";
	import { getContext, setContext, type Snippet } from "svelte";
	import type { ClassValue } from "svelte/elements";
	import { SvelteSet } from "svelte/reactivity";
	import { fade, scale } from "svelte/transition";
	import {
		FileNode,
		FileTree,
		FolderNode,
		Tree,
		type DragEventArgs,
		type FileTreeNode,
		type NameConflictResolution,
		type OnCircularReferenceArgs,
		type OnCopyArgs,
		type OnMoveArgs,
		type OnRemoveArgs,
		type OnResolveNameConflictArgs,
		type TreeChildrenSnippetArgs,
		type TreeItemState,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";

	const sortCollator = new Intl.Collator();

	function sortComparator(x: FileTreeNode, y: FileTreeNode) {
		return sortCollator.compare(x.name, y.name);
	}

	export type TreeProps = {
		children: Snippet<[args: TreeChildrenSnippetArgs]>;
		root: FileTree;
		class?: ClassValue;
		style?: string;
	};

	export type TreeContext = {
		draggedId: () => string | undefined;
		dropDestination: () => FolderNode | FileTree | undefined;
		onDragStart: (itemId: string) => void;
		onDragEnd: () => void;
		onDragLeave: () => void;
		onToggleExpansion: (item: TreeItemState) => void;
	};

	const CONTEXT_KEY = Symbol("TreeContext");

	export function getTreeContext(): TreeContext {
		return getContext(CONTEXT_KEY);
	}
</script>

<script lang="ts">
	const { children, root, class: className, style }: TreeProps = $props();

	const expandedIds = new SvelteSet<string>();

	let draggedId: string | undefined = $state.raw();
	let dropDestination: FolderNode | FileTree | undefined = $state.raw();

	let dialogOpen = $state.raw(false);
	let dialogTitle = $state.raw("");
	let dialogDescription = $state.raw("");
	let dialogConfirmLabel = $state.raw("");
	let dialogOnClose: (() => void) | undefined;
	let dialogDidConfirm = false;

	function onDialogOpenChangeComplete(open: boolean) {
		if (!open) {
			dialogTitle = "";
			dialogDescription = "";
			dialogConfirmLabel = "";
			dialogOnClose?.();
			dialogOnClose = undefined;
			dialogDidConfirm = false;
		}
	}

	function onDialogConfirm() {
		dialogOpen = false;
		dialogDidConfirm = true;
	}

	async function onResolveNameConflict({ operation, name }: OnResolveNameConflictArgs) {
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

			dialogOpen = true;
			dialogTitle = title;
			dialogDescription = `An item named "${name}" already exists in this location. Do you want to skip it or cancel the operation entirely?`;
			dialogConfirmLabel = "Skip";
			dialogOnClose = () => {
				resolve(dialogDidConfirm ? "skip" : "cancel");
			};
		});
	}

	function onCircularReference({ source }: OnCircularReferenceArgs) {
		toast.error(`Cannot move "${source.node.name}" inside itself`);
	}

	function onCopy({ destination }: OnCopyArgs) {
		destination.children.sort(sortComparator);
	}

	function onMove({ destination }: OnMoveArgs) {
		destination.children.sort(sortComparator);
	}

	function canRemove({ removed }: OnRemoveArgs) {
		return new Promise<boolean>((resolve) => {
			dialogOpen = true;
			dialogTitle = `Are you sure you want to delete ${removed.length} item(s)?`;
			dialogDescription = "They will be permanently deleted. This action cannot be undone.";
			dialogConfirmLabel = "Confirm";
			dialogOnClose = () => {
				resolve(dialogDidConfirm);
			};
		});
	}

	function onDragStart(itemId: string) {
		draggedId = itemId;
	}

	function onDragEnd() {
		draggedId = undefined;
	}

	function onDrag({ destination }: DragEventArgs) {
		dropDestination = destination;
	}

	function onDragLeave() {
		dropDestination = undefined;
	}

	function onDrop({ type, items, destination }: DragEventArgs) {
		dropDestination = undefined;

		if (type !== "external") {
			return;
		}

		const uniqueNames = new Set();
		for (const child of destination.children) {
			uniqueNames.add(child.name);
		}

		const files: Array<FileNode> = [];
		for (const item of items) {
			const file = item.getAsFile();
			if (file === null) {
				continue;
			}

			const fileName = file.name;
			if (uniqueNames.has(fileName)) {
				toast.error(`An item named "${fileName}" already exists in this location`);
				return;
			}

			files.push(
				new FileNode({
					id: crypto.randomUUID(),
					name: fileName,
				}),
			);
		}

		destination.children.push(...files);
		destination.children.sort(sortComparator);
	}

	function onToggleExpansion(item: TreeItemState) {
		if (item.expanded) {
			expandedIds.delete(item.node.id);
		} else {
			expandedIds.add(item.node.id);
		}
	}

	const context: TreeContext = {
		draggedId: () => draggedId,
		dropDestination: () => dropDestination,
		onDragStart,
		onDragLeave,
		onDragEnd,
		onToggleExpansion,
	};
	setContext(CONTEXT_KEY, context);
</script>

<Tree
	{children}
	{root}
	{expandedIds}
	{onResolveNameConflict}
	{onCircularReference}
	{onCopy}
	{onMove}
	{canRemove}
	{onDrag}
	{onDragLeave}
	{onDrop}
	class={className}
	{style}
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
