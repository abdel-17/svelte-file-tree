<script lang="ts">
	import ClipboardPasteIcon from "@lucide/svelte/icons/clipboard-paste";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import PenIcon from "@lucide/svelte/icons/pen";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import ScissorsIcon from "@lucide/svelte/icons/scissors";
	import { ContextMenu } from "bits-ui";
	import type { Snippet } from "svelte";
	import type { PasteOperation, TreeItemState } from "svelte-file-tree";

	let {
		item,
		editing = $bindable(),
		children,
		onCopy,
		onPaste,
		onDelete,
		onAdd,
	}: {
		item: TreeItemState;
		editing: boolean;
		children: Snippet;
		onCopy: (operation: PasteOperation) => void;
		onPaste: () => void;
		onDelete: () => void;
		onAdd: () => void;
	} = $props();

	let trapFocus = $state.raw(true);

	function handleOpenChange(open: boolean): void {
		if (open) {
			trapFocus = true;
		}
	}

	function handleCloseAutoFocus(event: Event): void {
		if (editing) {
			// By default, the context menu will focus the trigger when it's closed,
			// but we want to keep the input focused.
			event.preventDefault();
		}
	}

	function handleRename(): void {
		// Disable focus trapping to allow the input to be focused.
		trapFocus = false;
		editing = true;
	}
</script>

<ContextMenu.Root onOpenChange={handleOpenChange}>
	<ContextMenu.Trigger disabled={item.disabled()} style="margin-inline-start: {item.depth * 16}px">
		{@render children()}
	</ContextMenu.Trigger>

	<ContextMenu.Portal>
		<ContextMenu.Content
			{trapFocus}
			class="w-[200px] rounded-xl border border-gray-300 bg-gray-50 p-2 shadow focus-visible:outline-none"
			onCloseAutoFocus={handleCloseAutoFocus}
		>
			<ContextMenu.Item
				class="flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200"
				onSelect={handleRename}
			>
				<PenIcon size={20} />
				<span>Rename</span>
			</ContextMenu.Item>

			<ContextMenu.Item
				class="flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200"
				onSelect={() => onCopy("copy")}
			>
				<CopyIcon size={20} />
				<span>Copy</span>
			</ContextMenu.Item>

			<ContextMenu.Item
				class="flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200"
				onSelect={() => onCopy("cut")}
			>
				<ScissorsIcon size={20} />
				<span>Cut</span>
			</ContextMenu.Item>

			<ContextMenu.Item
				class="flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200"
				onSelect={onPaste}
			>
				<ClipboardPasteIcon size={20} />
				<span>Paste</span>
			</ContextMenu.Item>

			<ContextMenu.Item
				class="flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200"
				onSelect={onDelete}
			>
				<TrashIcon size={20} />
				<span>Delete</span>
			</ContextMenu.Item>

			{#if item.node.type === "folder"}
				<ContextMenu.Item
					class="flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200"
					onSelect={onAdd}
				>
					<PlusIcon size={20} />
					<span>Add</span>
				</ContextMenu.Item>
			{/if}
		</ContextMenu.Content>
	</ContextMenu.Portal>
</ContextMenu.Root>
