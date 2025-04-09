<script lang="ts">
	import type { FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
	import { ContextMenu } from "bits-ui";
	import type { Snippet } from "svelte";
	import type { PasteOperation, TreeItemState } from "svelte-file-tree";
	import type { EventHandler } from "svelte/elements";
	import TreeContextMenuItem from "./TreeContextMenuItem.svelte";
	import type { TreeContextMenuState } from "./types.js";

	let {
		tree,
		state: menuState = $bindable(),
		children,
		onRename,
		onCopy,
		onPaste,
		onRemove,
		onUploadFiles,
		onCreateFolder,
	}: {
		tree: FileTree;
		state: TreeContextMenuState | undefined;
		children: Snippet;
		onRename: (target: TreeItemState<FileTreeNode>) => void;
		onCopy: (target: TreeItemState<FileTreeNode>, operation: PasteOperation) => void;
		onPaste: (target: TreeItemState<FileTreeNode>) => void;
		onRemove: (target: TreeItemState<FileTreeNode>) => void;
		onUploadFiles: (target: FolderNode | FileTree, files: FileList) => void;
		onCreateFolder: (target: FolderNode | FileTree) => void;
	} = $props();

	let fileInput: HTMLInputElement | null = $state.raw(null);
	let uploadTarget: FolderNode | FileTree | undefined;

	function open(): boolean {
		return menuState !== undefined;
	}

	function handleOpenChange(open: boolean): void {
		if (!open) {
			menuState = undefined;
		}
	}

	function handleCreateFolder(): void {
		switch (menuState!.type) {
			case "tree": {
				onCreateFolder(tree);
				break;
			}
			case "item": {
				const item = menuState!.item();
				if (item.node.type === "file") {
					throw new Error("Cannot create a folder inside a file");
				}

				onCreateFolder(item.node);
				break;
			}
		}
	}

	function handleUploadFiles(): void {
		switch (menuState!.type) {
			case "tree": {
				uploadTarget = tree;
				break;
			}
			case "item": {
				const item = menuState!.item();
				if (item.node.type === "file") {
					throw new Error("Cannot upload files inside a file");
				}

				uploadTarget = item.node;
				break;
			}
		}

		fileInput!.click();
	}

	const handleFileInputChange: EventHandler<Event, HTMLInputElement> = (event) => {
		if (uploadTarget !== undefined) {
			const { files } = event.currentTarget;
			if (files !== null && files.length !== 0) {
				onUploadFiles(uploadTarget, files);
			}
			uploadTarget = undefined;
		}

		// Reset the input's "selected files" to prevent it from dispatching
		// the "cancel" event when the same files are reuploaded.
		event.currentTarget.value = "";
	};

	const handleFileInputCancel: EventHandler<Event, HTMLInputElement> = () => {
		uploadTarget = undefined;
	};
</script>

<ContextMenu.Root bind:open={open, handleOpenChange}>
	{@render children()}

	<ContextMenu.Portal>
		<ContextMenu.Content
			class="z-50 w-60 rounded-md border border-gray-300 bg-gray-50 p-2 shadow focus-visible:outline-none"
		>
			{#if menuState?.type === "item"}
				{@const item = menuState.item()}
				<TreeContextMenuItem onSelect={() => onRename(item)}>
					<span>Rename</span>
					<kbd>F2</kbd>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={() => onCopy(item, "copy")}>
					<span>Copy</span>
					<kbd>
						<kdb>⌘</kdb> + <kdb>C</kdb>
					</kbd>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={() => onCopy(item, "cut")}>
					<span>Cut</span>
					<kbd>
						<kdb>⌘</kdb> + <kdb>X</kdb>
					</kbd>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={() => onPaste(item)}>
					<span>Paste</span>
					<kbd>
						<kdb>⌘</kdb> + <kdb>V</kdb>
					</kbd>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={() => onRemove(item)}>
					<span>Delete</span>
					<kbd>⌫</kbd>
				</TreeContextMenuItem>
			{/if}

			{@const isFolder = menuState?.type === "item" && menuState.item().node.type === "folder"}
			{#if menuState?.type === "tree" || isFolder}
				<TreeContextMenuItem onSelect={handleCreateFolder}>
					<span>New Folder</span>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={handleUploadFiles}>
					<span>Upload Files</span>
				</TreeContextMenuItem>
			{/if}
		</ContextMenu.Content>
	</ContextMenu.Portal>
</ContextMenu.Root>

<input
	bind:this={fileInput}
	type="file"
	multiple
	class="hidden"
	onchange={handleFileInputChange}
	oncancel={handleFileInputCancel}
/>
