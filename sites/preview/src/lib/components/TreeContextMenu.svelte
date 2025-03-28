<script lang="ts" module>
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
	import { getContext, hasContext, setContext, type Snippet } from "svelte";
	import type { FileTree, FileTreeNodeData, FolderNode, TreeItemState } from "svelte-file-tree";
	import type { EventHandler } from "svelte/elements";
	import TreeContextMenuItem from "./TreeContextMenuItem.svelte";

	const CONTEXT_KEY = Symbol("TreeContextMenu");

	export type TreeContextMenuState<TData extends FileTreeNodeData = FileTreeNodeData> =
		| {
				type: "tree";
		  }
		| {
				type: "item";
				item: () => TreeItemState<TData>;
				onRename: () => void;
				onCopy: () => void;
				onCut: () => void;
				onPaste: () => void;
				onDelete: () => void;
		  };

	export type TreeContextMenuContext<TData extends FileTreeNodeData = FileTreeNodeData> = {
		state: () => TreeContextMenuState<TData> | undefined;
		show: (args: TreeContextMenuState<TData>) => void;
		close: () => void;
	};

	export function getTreeContextMenuContext(): TreeContextMenuContext {
		if (!hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <TreeContextMenu> found");
		}

		return getContext(CONTEXT_KEY);
	}
</script>

<script lang="ts" generics="TData extends FileTreeNodeData = FileTreeNodeData">
	import NewFolderDialog from "./NewFolderDialog.svelte";
	import { toast } from "svelte-sonner";

	type UploadFileArgs = {
		target: FolderNode<TData> | FileTree<TData>;
		files: FileList;
	};

	type CreateNewFolderArgs = {
		target: FolderNode<TData> | FileTree<TData>;
		name: string;
	};

	const {
		tree,
		children,
		onUploadFiles,
		onCreateNewFolder,
	}: {
		tree: FileTree<TData>;
		children: Snippet;
		onUploadFiles: (args: UploadFileArgs) => void;
		onCreateNewFolder: (args: CreateNewFolderArgs) => void;
	} = $props();

	let menuState: TreeContextMenuState<TData> | undefined = $state.raw();
	let trapFocus = $state.raw(true);
	let preventCloseAutofocus = false;
	let fileInput: HTMLInputElement | null = $state.raw(null);
	let onFilesSelected: ((files: FileList | null) => void) | undefined;
	let newFolderDialog: NewFolderDialog | null = $state.raw(null);

	function show(args: TreeContextMenuState<TData>): void {
		// Restore default behavior.
		trapFocus = true;
		preventCloseAutofocus = false;

		switch (args.type) {
			case "tree": {
				menuState = args;
				break;
			}
			case "item": {
				menuState = {
					...args,
					onRename: () => {
						// Disable focus management to allow the input to be focused.
						trapFocus = false;
						preventCloseAutofocus = true;
						args.onRename();
					},
				};
			}
		}
	}

	function close(): void {
		menuState = undefined;
	}

	const context: TreeContextMenuContext<TData> = {
		state: () => menuState,
		show,
		close,
	};
	setContext(CONTEXT_KEY, context);

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

	function handleCreateNewFolder(): void {
		if (menuState === undefined) {
			throw new Error("Context menu is closed");
		}

		if (newFolderDialog === null) {
			throw new Error("Dialog is not mounted");
		}

		let target: FolderNode<TData> | FileTree<TData>;
		switch (menuState.type) {
			case "tree": {
				target = tree;
				break;
			}
			case "item": {
				const item = menuState.item();
				if (item.node.type === "file") {
					throw new Error("Cannot create a folder inside a file");
				}

				target = item.node;
				break;
			}
		}

		newFolderDialog.show({
			onSubmit: (name) => {
				for (const child of target.children) {
					if (child.data.name === name) {
						toast.error(`An item with the name "${name}" already exists`);
						return false;
					}
				}

				onCreateNewFolder({
					target,
					name,
				});
				return true;
			},
		});
	}

	function handleUploadFile(): void {
		if (menuState === undefined) {
			throw new Error("Context menu is closed");
		}

		if (fileInput === null) {
			throw new Error("File input is not mounted");
		}

		let target: FolderNode<TData> | FileTree<TData>;
		switch (menuState.type) {
			case "tree": {
				target = tree;
				break;
			}
			case "item": {
				const item = menuState.item();
				if (item.node.type === "file") {
					throw new Error("Cannot upload files inside a file");
				}

				target = item.node;
				break;
			}
		}

		fileInput.click();
		onFilesSelected = (files) => {
			if (files === null || files.length === 0) {
				return;
			}

			onUploadFiles({
				target,
				files,
			});
		};
	}

	const handleFileInputChange: EventHandler<Event, HTMLInputElement> = (event) => {
		onFilesSelected?.(event.currentTarget.files);
		onFilesSelected = undefined;
	};

	const handleFileInputCancel: EventHandler<Event, HTMLInputElement> = () => {
		onFilesSelected = undefined;
	};
</script>

<ContextMenu.Root bind:open={() => menuState !== undefined, handleOpenChange}>
	{@render children()}

	<ContextMenu.Portal>
		<ContextMenu.Content
			{trapFocus}
			class="w-[200px] rounded-xl border border-gray-300 bg-gray-50 p-2 shadow focus-visible:outline-none"
			onCloseAutoFocus={handleContentCloseAutoFocus}
		>
			{#if menuState?.type === "item"}
				{#if menuState.item().editable()}
					<TreeContextMenuItem onSelect={menuState.onRename}>
						<PenIcon role="presentation" size={20} />
						<span>Rename</span>
					</TreeContextMenuItem>
				{/if}

				<TreeContextMenuItem onSelect={menuState.onCopy}>
					<CopyIcon role="presentation" size={20} />
					<span>Copy</span>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={menuState.onCut}>
					<ScissorsIcon role="presentation" size={20} />
					<span>Cut</span>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={menuState.onPaste}>
					<ClipboardPasteIcon role="presentation" size={20} />
					<span>Paste</span>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={menuState.onDelete}>
					<TrashIcon role="presentation" size={20} />
					<span>Delete</span>
				</TreeContextMenuItem>
			{/if}

			{@const isFolder = menuState?.type === "item" && menuState.item().node.type === "folder"}
			{#if menuState?.type === "tree" || isFolder}
				<TreeContextMenuItem onSelect={handleCreateNewFolder}>
					<PlusIcon role="presentation" size={20} />
					<span>New Folder</span>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={handleUploadFile}>
					<UploadIcon role="presentation" size={20} />
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

<NewFolderDialog bind:this={newFolderDialog} />
