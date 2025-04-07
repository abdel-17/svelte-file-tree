<script lang="ts">
	import type { FolderNode, FileTree, FileTreeNode } from "$lib/tree.svelte";
	import {
		ClipboardPasteIcon,
		CopyIcon,
		PenIcon,
		PlusIcon,
		ScissorsIcon,
		TrashIcon,
		UploadIcon,
	} from "@lucide/svelte";
	import { ContextMenu } from "bits-ui";
	import type { Snippet } from "svelte";
	import type { PasteOperation, TreeItemState } from "svelte-file-tree";
	import type { EventHandler } from "svelte/elements";
	import ContextMenuItem from "./ContextMenuItem.svelte";

	const {
		tree,
		children,
		onRename,
		onCopy,
		onPaste,
		onRemove,
		onUploadFiles,
		onCreateFolder,
	}: {
		tree: FileTree;
		children: Snippet;
		onRename: (target: TreeItemState<FileTreeNode>) => void;
		onCopy: (target: TreeItemState<FileTreeNode>, operation: PasteOperation) => void;
		onPaste: (target: TreeItemState<FileTreeNode>) => void;
		onRemove: (target: TreeItemState<FileTreeNode>) => void;
		onUploadFiles: (target: FolderNode | FileTree, files: FileList) => void;
		onCreateFolder: (target: FolderNode | FileTree) => void;
	} = $props();

	type ShowArgs =
		| {
				type: "tree";
		  }
		| {
				type: "item";
				item: () => TreeItemState<FileTreeNode>;
		  };

	let showArgs: ShowArgs | undefined = $state.raw();
	let fileInput: HTMLInputElement | null = $state.raw(null);
	let onFilesSelected: ((files: FileList | null) => void) | undefined;

	export function open(): boolean {
		return showArgs !== undefined;
	}

	export function show(args: ShowArgs): void {
		showArgs = args;
	}

	export function close(): void {
		showArgs = undefined;
	}

	export function onItemDestroyed(item: TreeItemState<FileTreeNode>): void {
		// Don't leave the context menu open after the item is destroyed.
		if (showArgs?.type === "item" && showArgs.item() === item) {
			close();
		}
	}

	function handleOpenChange(open: boolean): void {
		if (!open) {
			close();
		}
	}

	const handleTriggerContextMenu: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		if (event.defaultPrevented) {
			return;
		}

		if (event.target instanceof Element && event.target.closest("[role='treeitem']") === null) {
			show({ type: "tree" });
		}
	};

	function handleCreateFolder(): void {
		if (showArgs === undefined) {
			throw new Error("Context menu is closed");
		}

		switch (showArgs.type) {
			case "tree": {
				onCreateFolder(tree);
				break;
			}
			case "item": {
				const item = showArgs.item();
				if (item.node.type === "file") {
					throw new Error("Cannot create a folder inside a file");
				}

				onCreateFolder(item.node);
				break;
			}
		}
	}

	function handleUploadFiles(): void {
		if (showArgs === undefined) {
			throw new Error("Context menu is closed");
		}

		if (fileInput === null) {
			throw new Error("File input is not mounted");
		}

		let target: FolderNode | FileTree;
		switch (showArgs.type) {
			case "tree": {
				target = tree;
				break;
			}
			case "item": {
				const item = showArgs.item();
				if (item.node.type === "file") {
					throw new Error("Cannot upload files inside a file");
				}

				target = item.node;
				break;
			}
		}

		onFilesSelected = (files) => {
			if (files === null || files.length === 0) {
				return;
			}

			onUploadFiles(target, files);
		};
		fileInput.click();
	}

	const handleFileInputChange: EventHandler<Event, HTMLInputElement> = (event) => {
		onFilesSelected?.(event.currentTarget.files);
		onFilesSelected = undefined;

		// Reset the input's "selected files" to prevent it from dispatching
		// the "cancel" event when the same files are reuploaded.
		event.currentTarget.value = "";
	};

	const handleFileInputCancel: EventHandler<Event, HTMLInputElement> = () => {
		onFilesSelected = undefined;
	};
</script>

<ContextMenu.Root bind:open={open, handleOpenChange}>
	<ContextMenu.Trigger
		class="grow overflow-y-auto rounded px-(--tree-inline-padding) py-2"
		oncontextmenu={handleTriggerContextMenu}
	>
		{@render children()}
	</ContextMenu.Trigger>

	<ContextMenu.Portal>
		<ContextMenu.Content
			class="z-50 w-[200px] rounded-xl border border-gray-300 bg-gray-50 p-2 shadow focus-visible:outline-none"
		>
			{#if showArgs?.type === "item"}
				{@const item = showArgs.item()}
				<ContextMenuItem onSelect={() => onRename(item)}>
					<PenIcon role="presentation" size={20} />
					<span>Rename</span>
				</ContextMenuItem>

				<ContextMenuItem onSelect={() => onCopy(item, "copy")}>
					<CopyIcon role="presentation" size={20} />
					<span>Copy</span>
				</ContextMenuItem>

				<ContextMenuItem onSelect={() => onCopy(item, "cut")}>
					<ScissorsIcon role="presentation" size={20} />
					<span>Cut</span>
				</ContextMenuItem>

				<ContextMenuItem onSelect={() => onPaste(item)}>
					<ClipboardPasteIcon role="presentation" size={20} />
					<span>Paste</span>
				</ContextMenuItem>

				<ContextMenuItem onSelect={() => onRemove(item)}>
					<TrashIcon role="presentation" size={20} />
					<span>Delete</span>
				</ContextMenuItem>
			{/if}

			{@const isFolder = showArgs?.type === "item" && showArgs.item().node.type === "folder"}
			{#if showArgs?.type === "tree" || isFolder}
				<ContextMenuItem onSelect={handleCreateFolder}>
					<PlusIcon role="presentation" size={20} />
					<span>New Folder</span>
				</ContextMenuItem>

				<ContextMenuItem onSelect={handleUploadFiles}>
					<UploadIcon role="presentation" size={20} />
					<span>Upload Files</span>
				</ContextMenuItem>
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
