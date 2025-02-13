<script lang="ts">
	import { Dialog } from "bits-ui";
	import FileIcon from "lucide-svelte/icons/file";
	import FolderIcon from "lucide-svelte/icons/folder";
	import FolderOpenIcon from "lucide-svelte/icons/folder-open";
	import {
		type CopyPasteItemsEvent,
		type DeleteItemsEvent,
		FileNode,
		FileTree,
		type FileTreeNode,
		FolderNode,
		type NameConflictEvent,
		type NameConflictResolution,
		type RenameErrorEvent,
		type RenameItemEvent,
		type ReorderErrorEvent,
		type ReorderItemsEvent,
		Tree,
		TreeItem,
		TreeItemInput,
	} from "svelte-file-tree";
	import { Toaster, toast } from "svelte-sonner";
	import { fade, fly } from "svelte/transition";
	import data from "./data.json" with { type: "json" };
	import { createDialogState } from "./state.svelte.js";

	const tree = new FileTree({
		children: (tree) =>
			data.map(function transform(item): FileTreeNode {
				if (item.children === undefined) {
					return new FileNode({
						tree,
						id: item.id,
						name: item.name,
					});
				}

				return new FolderNode({
					tree,
					id: item.id,
					name: item.name,
					children: item.children.map(transform),
				});
			}),
	});

	type DialogButton = {
		result: NameConflictResolution;
		type: "neutral" | "error";
		label: string;
	};

	const { dialogData, openDialog, closeDialog, dialogOpen, onDialogOpenChange } = createDialogState<
		{
			title: string;
			description: string;
			buttons: ReadonlyArray<DialogButton>;
		},
		NameConflictResolution
	>({
		closeResult: "cancel",
	});

	const dialogButtonClasses = {
		neutral:
			"rounded-md border-1 border-current bg-neutral-100 px-3 py-1.5 text-sm leading-5 font-semibold text-neutral-800 hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-neutral-300",
		error:
			"rounded-md border-1 border-current bg-red-100 px-3 py-1.5 text-sm leading-5 font-semibold text-red-800 hover:bg-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-red-300",
	};

	const dialogGenerateNameButton: DialogButton = {
		result: "default",
		type: "neutral",
		label: "Generate Name",
	};

	const dialogSkipButton: DialogButton = {
		result: "skip",
		type: "neutral",
		label: "Skip",
	};

	const dialogCancelButton: DialogButton = {
		result: "cancel",
		type: "error",
		label: "Cancel",
	};

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

	const onReorderError = (event: ReorderErrorEvent): void => {
		console.error("onReorderError", $state.snapshot(event));

		toast.error(`Cannot move "${event.target.name}" into or next to itself`);
	};

	const onCopyPasteItems = (event: CopyPasteItemsEvent): void => {
		console.info("onCopyPasteItems", $state.snapshot(event));
	};

	const onNameConflict = async (event: NameConflictEvent): Promise<NameConflictResolution> => {
		console.info("onNameConflict", $state.snapshot(event));

		const description = `An item with the name "${event.target.name}" already exists`;
		switch (event.operation) {
			case "reorder": {
				return openDialog({
					title: "Failed to move items",
					description,
					buttons: [dialogSkipButton, dialogCancelButton],
				});
			}
			case "copy-paste": {
				return openDialog({
					title: "Failed to paste items",
					description,
					buttons: [dialogGenerateNameButton, dialogSkipButton, dialogCancelButton],
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
		{onReorderError}
		{onCopyPasteItems}
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
			class="fixed top-0 left-1/2 z-50 w-xs -translate-x-1/2 rounded-b-lg bg-neutral-200 p-4 md:w-md"
		>
			{#snippet child({ props, open })}
				{#if open}
					{@const { title, description, buttons } = dialogData()!}
					<div {...props} transition:fly={{ y: "-100%" }}>
						<Dialog.Title class="text-center text-lg font-semibold tracking-tight">
							{title}
						</Dialog.Title>

						<Dialog.Description class="mt-2 text-sm text-gray-700">
							{description}
						</Dialog.Description>

						<div class="mt-5 flex justify-end gap-3">
							{#each buttons as button}
								<button
									class={dialogButtonClasses[button.type]}
									onclick={() => closeDialog(button.result)}
								>
									{button.label}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<Toaster richColors />
