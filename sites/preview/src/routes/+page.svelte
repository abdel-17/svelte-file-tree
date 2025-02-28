<script lang="ts">
	import { Dialog } from "bits-ui";
	import FileIcon from "lucide-svelte/icons/file";
	import FolderIcon from "lucide-svelte/icons/folder";
	import FolderOpenIcon from "lucide-svelte/icons/folder-open";
	import {
		FileNode,
		FileTree,
		FolderNode,
		Tree,
		TreeItem,
		TreeItemInput,
		type FileTreeNode,
		type MoveErrorArgs,
		type NameConflictArgs,
		type NameConflictResolution,
		type RenameErrorArgs,
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

	const { dialogData, openDialog, closeDialog, dialogOpen, onDialogOpenChange } = createDialogState<
		{
			title: string;
			description: string;
		},
		NameConflictResolution
	>({
		defaultResult: "cancel",
	});

	const onRenameError = ({ error, name }: RenameErrorArgs): void => {
		switch (error) {
			case "empty": {
				toast.error("Name cannot be empty");
				break;
			}
			case "already-exists": {
				toast.error(`An item with the name "${name}" already exists`);
				break;
			}
		}
	};

	const onMoveError = ({ target }: MoveErrorArgs): void => {
		toast.error(`Cannot move "${target.name}" into or next to itself`);
	};

	const onNameConflict = ({
		operation,
		target,
	}: NameConflictArgs): Promise<NameConflictResolution> => {
		const description = `An item with the name "${target.name}" already exists`;
		switch (operation) {
			case "move": {
				return openDialog({
					title: "Failed to move items",
					description,
				});
			}
			case "insert": {
				return openDialog({
					title: "Failed to paste items",
					description,
				});
			}
		}
	};
</script>

<main class="p-8">
	<Tree {tree} {onRenameError} {onMoveError} {onNameConflict} class="space-y-4">
		{#snippet item({ node, depth, dragged })}
			<TreeItem
				editable
				draggable
				class={({ dropPosition }) => [
					"relative flex items-center gap-2 rounded-md border border-neutral-400 p-3 hover:bg-neutral-200 focus:outline-2 focus:outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:border-blue-400 aria-selected:bg-blue-100 aria-selected:text-blue-800 aria-selected:active:bg-blue-200",
					dragged && "opacity-50",
					dropPosition !== undefined &&
						"before:pointer-events-none before:absolute before:-inset-[2px] before:rounded-[inherit] before:border-2",
					dropPosition === "before" && "before:border-transparent before:border-t-red-500",
					dropPosition === "after" && "before:border-transparent before:border-b-red-500",
					dropPosition === "inside" && "before:border-red-500",
				]}
				style="margin-inline-start: {depth * 16}px;"
			>
				{#snippet children({ editing })}
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

<Toaster richColors />

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
					{@const { title, description } = dialogData()!}
					<div {...props} transition:fly={{ y: "-100%" }}>
						<Dialog.Title class="text-center text-lg font-semibold tracking-tight">
							{title}
						</Dialog.Title>

						<Dialog.Description class="mt-2 text-sm text-gray-700">
							{description}
						</Dialog.Description>

						<div class="mt-5 flex justify-end gap-3">
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
