<script lang="ts">
	import { ContextMenu } from "bits-ui";
	import type { Snippet } from "svelte";
	import TreeContextMenuItem from "./TreeContextMenuItem.svelte";
	import type { ContextMenuTarget } from "./state.svelte.js";

	const {
		target,
		children,
		onRename,
		onCopy,
		onCut,
		onPaste,
		onRemove,
		onCreateFolder,
		onUploadFiles,
		onClose,
	}: {
		target: ContextMenuTarget | undefined;
		children: Snippet;
		onRename: () => void;
		onCopy: () => void;
		onCut: () => void;
		onPaste: () => void;
		onRemove: () => void;
		onCreateFolder: () => void;
		onUploadFiles: () => void;
		onClose: () => void;
	} = $props();

	function open() {
		return target !== undefined;
	}

	function handleOpenChange(open: boolean) {
		if (!open) {
			onClose();
		}
	}
</script>

<ContextMenu.Root bind:open={open, handleOpenChange}>
	{@render children()}

	<ContextMenu.Portal>
		<ContextMenu.Content
			class="z-50 w-60 rounded-md border border-gray-300 bg-gray-50 p-2 shadow focus-visible:outline-none"
		>
			{#if target?.type === "item"}
				<TreeContextMenuItem onSelect={onRename}>
					<span>Rename</span>
					<kbd>F2</kbd>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={onCopy}>
					<span>Copy</span>
					<kbd>
						<kbd>⌘</kbd> + <kbd>C</kbd>
					</kbd>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={onCut}>
					<span>Cut</span>
					<kbd>
						<kbd>⌘</kbd> + <kbd>X</kbd>
					</kbd>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={onPaste}>
					<span>Paste</span>
					<kbd>
						<kbd>⌘</kbd> + <kbd>V</kbd>
					</kbd>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={onRemove}>
					<span>Delete</span>
					<kbd>⌫</kbd>
				</TreeContextMenuItem>
			{/if}

			{@const isFolder = target?.type === "item" && target.item().node.type === "folder"}
			{#if target?.type === "tree" || isFolder}
				<TreeContextMenuItem onSelect={onCreateFolder}>
					<span>New Folder</span>
				</TreeContextMenuItem>

				<TreeContextMenuItem onSelect={onUploadFiles}>
					<span>Upload Files</span>
				</TreeContextMenuItem>
			{/if}
		</ContextMenu.Content>
	</ContextMenu.Portal>
</ContextMenu.Root>
