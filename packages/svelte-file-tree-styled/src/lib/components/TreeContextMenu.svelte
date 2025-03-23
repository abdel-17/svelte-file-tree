<script lang="ts">
	import {ClipboardPaste, Copy, Pen, Plus, Scissors, Trash} from 'lucide-svelte'

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
				<Pen size={20} />
				<span>Rename</span>
			</ContextMenu.Item>

			<ContextMenu.Item
				class="flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200"
				onSelect={() => onCopy("copy")}
			>
				<Copy size={20} />
				<span>Copy</span>
			</ContextMenu.Item>

			<ContextMenu.Item
				class="flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200"
				onSelect={() => onCopy("cut")}
			>
				<Scissors size={20} />
				<span>Cut</span>
			</ContextMenu.Item>

			<ContextMenu.Item
				class="flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200"
				onSelect={() => onPaste()}
			>
				<ClipboardPaste size={20} />
				<span>Paste</span>
			</ContextMenu.Item>

			<ContextMenu.Item
				class="flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200"
				onSelect={() => onDelete()}
			>
				<Trash size={20} />
				<span>Delete</span>
			</ContextMenu.Item>

			{#if item.node.type === "folder"}
				<ContextMenu.Item
					class="flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200"
					onSelect={() => onAdd()}
				>
					<Plus size={20} />
					<span>Add</span>
				</ContextMenu.Item>
			{/if}
		</ContextMenu.Content>
	</ContextMenu.Portal>
</ContextMenu.Root>
