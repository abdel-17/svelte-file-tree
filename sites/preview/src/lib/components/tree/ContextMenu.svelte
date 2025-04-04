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
		onCopy,
		onPaste,
		onRemove,
		onUploadFiles,
		onCreateFolder,
	}: {
		tree: FileTree;
		children: Snippet;
		onCopy: (target: TreeItemState<FileTreeNode>, operation: PasteOperation) => void;
		onPaste: (target: TreeItemState<FileTreeNode>) => void;
		onRemove: (target: TreeItemState<FileTreeNode>) => void;
		onUploadFiles: (target: FolderNode | FileTree, files: FileList) => void;
		onCreateFolder: (target: FolderNode | FileTree) => void;
	} = $props();

	type OpenArgs =
		| {
				type: "tree";
		  }
		| {
				type: "item";
				item: () => TreeItemState<FileTreeNode>;
				edit: () => void;
		  };

	let openArgs: OpenArgs | undefined = $state.raw();
	let trapFocus = $state.raw(true);
	let preventCloseAutofocus = false;
	let fileInput: HTMLInputElement | null = $state.raw(null);
	let onFilesSelected: ((files: FileList | null) => void) | undefined;

	export function open(args: OpenArgs): void {
		// Restore default behavior.
		trapFocus = true;
		preventCloseAutofocus = false;
		openArgs = args;
	}

	export function close(): void {
		openArgs = undefined;
	}

	export function onItemDestroyed(item: TreeItemState<FileTreeNode>): void {
		// Don't leave the context menu open after the item is destroyed.
		if (openArgs?.type === "item" && openArgs.item() === item) {
			close();
		}
	}

	function handleOpenChange(open: boolean): void {
		if (!open) {
			close();
		}
	}

	function handleContentCloseAutoFocus(event: Event): void {
		if (preventCloseAutofocus) {
			event.preventDefault();
		}
	}

	const handleTriggerContextMenu: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		if (event.defaultPrevented) {
			return;
		}

		if (event.target instanceof Element && event.target.closest("[role='treeitem']") === null) {
			open({ type: "tree" });
		}
	};

	function handleRename(): void {
		if (openArgs === undefined) {
			throw new Error("Context menu is closed");
		}

		if (openArgs.type === "tree") {
			throw new Error("Cannot rename the tree");
		}

		// Disable focus management to allow the input to be focused.
		trapFocus = false;
		preventCloseAutofocus = true;
		openArgs.edit();
	}

	function handleCreateFolder(): void {
		if (openArgs === undefined) {
			throw new Error("Context menu is closed");
		}

		switch (openArgs.type) {
			case "tree": {
				onCreateFolder(tree);
				break;
			}
			case "item": {
				const item = openArgs.item();
				if (item.node.type === "file") {
					throw new Error("Cannot create a folder inside a file");
				}

				onCreateFolder(item.node);
				break;
			}
		}
	}

	function handleUploadFiles(): void {
		if (openArgs === undefined) {
			throw new Error("Context menu is closed");
		}

		if (fileInput === null) {
			throw new Error("File input is not mounted");
		}

		let target: FolderNode | FileTree;
		switch (openArgs.type) {
			case "tree": {
				target = tree;
				break;
			}
			case "item": {
				const item = openArgs.item();
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
	};

	const handleFileInputCancel: EventHandler<Event, HTMLInputElement> = () => {
		onFilesSelected = undefined;
	};
</script>

<ContextMenu.Root bind:open={() => openArgs !== undefined, handleOpenChange}>
	<ContextMenu.Trigger
		class="grow overflow-y-auto rounded px-(--tree-inline-padding) py-2"
		oncontextmenu={handleTriggerContextMenu}
	>
		{@render children()}
	</ContextMenu.Trigger>

	<ContextMenu.Portal>
		<ContextMenu.Content
			{trapFocus}
			class="z-50 w-[200px] rounded-xl border border-gray-300 bg-gray-50 p-2 shadow focus-visible:outline-none"
			onCloseAutoFocus={handleContentCloseAutoFocus}
		>
			{#if openArgs?.type === "item"}
				{@const item = openArgs.item()}
				{#if item.editable()}
					<ContextMenuItem onSelect={handleRename}>
						<PenIcon role="presentation" size={20} />
						<span>Rename</span>
					</ContextMenuItem>
				{/if}

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

			{@const isFolder = openArgs?.type === "item" && openArgs.item().node.type === "folder"}
			{#if openArgs?.type === "tree" || isFolder}
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
