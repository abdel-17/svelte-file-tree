<script lang="ts">
	import type { FolderNode, FileTree, FileTreeNode } from "$lib/tree.svelte";
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
		switch (showArgs!.type) {
			case "tree": {
				onCreateFolder(tree);
				break;
			}
			case "item": {
				const item = showArgs!.item();
				if (item.node.type === "file") {
					throw new Error("Cannot create a folder inside a file");
				}

				onCreateFolder(item.node);
				break;
			}
		}
	}

	function handleUploadFiles(): void {
		let target: FolderNode | FileTree;
		switch (showArgs!.type) {
			case "tree": {
				target = tree;
				break;
			}
			case "item": {
				const item = showArgs!.item();
				if (item.node.type === "file") {
					throw new Error("Cannot upload files inside a file");
				}

				target = item.node;
				break;
			}
		}

		onFilesSelected = (files) => {
			if (files === null) {
				return;
			}

			onUploadFiles(target, files);
		};
		fileInput!.click();
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
	<ContextMenu.Trigger class="grow overflow-y-auto" oncontextmenu={handleTriggerContextMenu}>
		{@render children()}
	</ContextMenu.Trigger>

	<ContextMenu.Portal>
		<ContextMenu.Content
			class="z-50 w-60 rounded-md border border-gray-300 bg-gray-50 p-2 shadow focus-visible:outline-none"
		>
			{#if showArgs?.type === "item"}
				{@const item = showArgs.item()}
				<ContextMenuItem onSelect={() => onRename(item)}>
					<span>Rename</span>
					<kbd>F2</kbd>
				</ContextMenuItem>

				<ContextMenuItem onSelect={() => onCopy(item, "copy")}>
					<span>Copy</span>
					<kbd>
						<kdb>⌘</kdb> + <kdb>C</kdb>
					</kbd>
				</ContextMenuItem>

				<ContextMenuItem onSelect={() => onCopy(item, "cut")}>
					<span>Cut</span>
					<kbd>
						<kdb>⌘</kdb> + <kdb>X</kdb>
					</kbd>
				</ContextMenuItem>

				<ContextMenuItem onSelect={() => onPaste(item)}>
					<span>Paste</span>
					<kbd>
						<kdb>⌘</kdb> + <kdb>V</kdb>
					</kbd>
				</ContextMenuItem>

				<ContextMenuItem onSelect={() => onRemove(item)}>
					<span>Delete</span>
					<kbd>⌫</kbd>
				</ContextMenuItem>
			{/if}

			{@const isFolder = showArgs?.type === "item" && showArgs.item().node.type === "folder"}
			{#if showArgs?.type === "tree" || isFolder}
				<ContextMenuItem onSelect={handleCreateFolder}>
					<span>New Folder</span>
				</ContextMenuItem>

				<ContextMenuItem onSelect={handleUploadFiles}>
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
