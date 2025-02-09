<script lang="ts">
	import { Dialog } from "bits-ui";
	import FileIcon from "lucide-svelte/icons/file";
	import FolderIcon from "lucide-svelte/icons/folder";
	import FolderOpenIcon from "lucide-svelte/icons/folder-open";
	import {
		type CircularReferenceErrorEvent,
		type CopyPasteItemsEvent,
		type DeleteItemsEvent,
		FileTree,
		type NameConflictEvent,
		type NameConflictResolution,
		type RenameErrorEvent,
		type RenameItemEvent,
		type ReorderItemsEvent,
		Tree,
		TreeItem,
		TreeItemInput,
	} from "svelte-file-tree";
	import { Toaster, toast } from "svelte-sonner";
	import { fade, fly } from "svelte/transition";
	import { createDialogState } from "./state.svelte.js";

	const { data } = $props();

	const tree = new FileTree({
		children: data.children,
	});

	const { dialogData, dialogOpen, onDialogOpenChange, openDialog, closeDialog } = createDialogState<
		{
			title: string;
			description: string;
			closeButtonLabel?: string;
		},
		NameConflictResolution
	>();

	const onRenameItem = (event: RenameItemEvent): void => {
		console.info("onRenameItem", $state.snapshot(event));
	};

	const onRenameError = (event: RenameErrorEvent): void => {
		console.error("onRenameError", $state.snapshot(event));

		switch (event.error) {
			case "empty": {
				toast.error("Name cannot be empty");
				break;
			}
			case "already-exists": {
				toast.error(`An item with the name "${event.name}" already exists`);
				break;
			}
		}
	};

	const onReorderItems = (event: ReorderItemsEvent): void => {
		console.info("onReorderItems", $state.snapshot(event));
	};

	const onCopyPasteItems = (event: CopyPasteItemsEvent): void => {
		console.info("onCopyPasteItems", $state.snapshot(event));
	};

	const onCircularReferenceError = (event: CircularReferenceErrorEvent): void => {
		console.error("onCircularReferenceError", $state.snapshot(event));

		switch (event.operation) {
			case "reorder": {
				toast.error(`Cannot move "${event.target.name}" into itself`);
				break;
			}
			case "copy-paste": {
				toast.error(`Cannot paste "${event.target.name}" into itself`);
				break;
			}
		}
	};

	const onNameConflict = async (
		event: NameConflictEvent,
	): Promise<NameConflictResolution | undefined> => {
		console.info("onNameConflict", $state.snapshot(event));

		const description = `An item with the name "${event.target.name} already exists`;
		switch (event.operation) {
			case "reorder": {
				return openDialog({
					title: "Failed to move items",
					description,
				});
			}
			case "copy-paste": {
				return openDialog({
					title: "Failed to paste items",
					description,
					closeButtonLabel: "Generate new name",
				});
			}
		}
	};

	const onDeleteItems = (event: DeleteItemsEvent): void => {
		console.info("onDeleteItems", $state.snapshot(event));
	};
</script>

<main class="p-8">
	<Tree
		{tree}
		{onRenameItem}
		{onRenameError}
		{onReorderItems}
		{onCopyPasteItems}
		{onCircularReferenceError}
		{onNameConflict}
		{onDeleteItems}
		class="space-y-4"
	>
		{#snippet item({ node, depth })}
			<TreeItem
				editable
				draggable
				style="margin-inline-start: {depth * 16}px;"
				class="relative flex items-center gap-2 rounded-md border border-neutral-400 p-3 hover:bg-neutral-200 focus:outline-2 focus:outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:border-blue-400 aria-selected:bg-blue-100 aria-selected:text-blue-800 aria-selected:active:bg-blue-200"
			>
				{#snippet children({ editing, dropPosition })}
					<div
						aria-hidden="true"
						data-drop-position={dropPosition}
						class="pointer-events-none absolute -inset-[2px] rounded-[inherit] border-2 border-transparent data-[drop-position='after']:border-b-red-500 data-[drop-position='before']:border-t-red-500 data-[drop-position='inside']:border-red-500"
					></div>

					{#if node.type === "file"}
						<FileIcon role="presentation" />
					{:else if node.expanded}
						<FolderOpenIcon
							role="presentation"
							class="fill-blue-300"
							onclick={() => node.collapse()}
						/>
					{:else}
						<FolderIcon role="presentation" class="fill-blue-300" onclick={() => node.expand()} />
					{/if}

					{#if editing}
						<TreeItemInput class="border bg-white focus:outline-none" />
					{:else}
						<span class="select-none">{node.name}</span>
					{/if}
				{/snippet}
			</TreeItem>
		{/snippet}
	</Tree>
</main>

<Dialog.Root bind:open={dialogOpen, onDialogOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay forceMount class="fixed inset-0 z-50 bg-black/50">
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:fade={{ duration: 200 }}></div>
				{/if}
			{/snippet}
		</Dialog.Overlay>

		<Dialog.Content
			forceMount
			interactOutsideBehavior="ignore"
			class="fixed top-0 left-1/2 z-50 w-xs -translate-x-1/2 rounded-b-lg bg-neutral-200 p-4 md:w-md"
		>
			{#snippet child({ props, open })}
				{#if open}
					{@const { title, description, closeButtonLabel } = dialogData()!}
					<div {...props} transition:fly={{ y: "-100%" }}>
						<Dialog.Title class="text-center text-lg font-semibold tracking-tight">
							{title}
						</Dialog.Title>

						<Dialog.Description class="mt-2 text-sm text-gray-700">
							{description}
						</Dialog.Description>

						<div class="mt-5 flex justify-end gap-3">
							{#if closeButtonLabel !== undefined}
								<Dialog.Close
									class="rounded-md border-1 border-current bg-neutral-100 px-3 py-1.5 text-sm leading-5 font-semibold text-neutral-800 hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-neutral-300"
								>
									{closeButtonLabel}
								</Dialog.Close>
							{/if}
							<button
								class="rounded-md border-1 border-current bg-neutral-100 px-3 py-1.5 text-sm leading-5 font-semibold text-neutral-800 hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-neutral-300"
								onclick={() => closeDialog("skip")}
							>
								Skip
							</button>
							<button
								class="rounded-md border-1 border-current bg-red-100 px-3 py-1.5 text-sm leading-5 font-semibold text-red-800 hover:bg-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-red-300"
								onclick={() => closeDialog("cancel")}
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<Toaster richColors />
