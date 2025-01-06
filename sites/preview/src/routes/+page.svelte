<script lang="ts">
	import FileWarningIcon from "lucide-svelte/icons/file-warning";
	import FileIcon from "lucide-svelte/icons/file";
	import FolderIcon from "lucide-svelte/icons/folder";
	import FolderOpenIcon from "lucide-svelte/icons/folder-open";
	import {
		type DeleteItemsArgs,
		FileTree,
		type FileTreeNode,
		type InsertItemsArgs,
		type MoveCircularReferenceErrorArgs,
		type MoveItemsArgs,
		type MoveNameConflictErrorArgs,
		type MoveNameConflictResolution,
		type RenameErrorArgs,
		type RenameItemArgs,
		Tree,
		TreeItem,
		TreeItemInput,
	} from "svelte-file-tree";
	import { Toaster, toast } from "svelte-sonner";
	import data from "./data.json";

	const tree = new FileTree();

	function createTreeNodes(items: typeof data): FileTreeNode[] {
		return items.map(({ id, name, children }) => {
			if (children === undefined) {
				return tree.createFile({ id, name });
			}
			return tree.createFolder({
				id,
				name,
				children: createTreeNodes(children),
			});
		});
	}

	tree.children = createTreeNodes(data);

	let dialog: HTMLDialogElement | null = $state(null);
	let dialogTitle = $state("");

	function onMoveItems(args: MoveItemsArgs): void {
		console.info("onMoveItems", args);
	}

	function onMoveNameConflictError(
		args: MoveNameConflictErrorArgs,
	): Promise<MoveNameConflictResolution> {
		console.error("onMoveNameConflictError", args);

		return new Promise((resolve) => {
			dialogTitle = `An item with the name "${args.node.name}" already exists`;
			dialog!.showModal();
			dialog!.addEventListener(
				"close",
				function () {
					switch (this.returnValue) {
						case "skip":
						case "stop": {
							resolve(this.returnValue);
							break;
						}
						default: {
							resolve("stop");
							break;
						}
					}
				},
				{ once: true },
			);
		});
	}

	function onMoveCircularReferenceError(args: MoveCircularReferenceErrorArgs) {
		console.error("onMoveNameConflictError", args);

		toast.error(`Cannot move the item "${args.node.name}" into itself`);
	}

	function onInsertItems(args: InsertItemsArgs) {
		console.info("onInsertItems", args);
	}

	function onDeleteItems(args: DeleteItemsArgs) {
		console.info("onDeleteItems", args);
	}

	function onRenameItem(args: RenameItemArgs) {
		console.info("onRenameItem", args);
	}

	function onRenameError(args: RenameErrorArgs) {
		console.error("onRenameError", args);

		switch (args.reason) {
			case "empty": {
				toast.error("The item's name cannot be empty");
				break;
			}
			case "conflict": {
				toast.error(`An item with the name "${args.name}" already exists`);
				break;
			}
		}
	}
</script>

<Toaster richColors />
<main class="p-8">
	<Tree
		{tree}
		{onMoveItems}
		{onMoveNameConflictError}
		{onMoveCircularReferenceError}
		{onInsertItems}
		{onDeleteItems}
		{onRenameItem}
		{onRenameError}
		class="space-y-4"
	>
		{#snippet item({ node, depth, editing, dropPosition })}
			<TreeItem
				editable
				draggable
				style="--depth: {depth}"
				class="relative ms-[calc(var(--spacing)*var(--depth)*4)] flex items-center gap-2 rounded-md border border-neutral-400 p-3 hover:bg-neutral-200 focus:outline-2 focus:outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:border-blue-400 aria-selected:bg-blue-200 aria-selected:text-blue-800"
			>
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
			</TreeItem>
		{/snippet}
	</Tree>
</main>
<dialog bind:this={dialog}>
	<form method="dialog" class="fixed left-1/2 max-w-sm -translate-x-1/2 rounded-b-xl bg-white p-4">
		<div class="flex items-center gap-3">
			<FileWarningIcon class="shrink-0 text-red-600" />
			<h1>{dialogTitle}</h1>
		</div>
		<div class="mt-5 flex items-center justify-end gap-4">
			<button
				type="submit"
				value="skip"
				class="rounded-sm bg-neutral-200 px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-current"
			>
				Skip
			</button>
			<button
				type="submit"
				value="stop"
				class="rounded-sm bg-neutral-200 px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-current"
			>
				Stop
			</button>
		</div>
	</form>
</dialog>
