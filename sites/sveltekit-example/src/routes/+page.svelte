<script lang="ts">
	import { invalidate } from "$app/navigation";
	import type { UpdateFilePosition } from "$lib/server/database.js";
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
		type CopyPasteItemsEvent,
		type DeleteItemsEvent,
		type FileTreeNode,
		type NameConflictEvent,
		type NameConflictResolution,
		type RenameErrorEvent,
		type RenameItemEvent,
		type Reorder,
		type ReorderErrorEvent,
		type ReorderItemsEvent,
	} from "svelte-file-tree";
	import { Toaster, toast } from "svelte-sonner";
	import type { DeleteFilesBody } from "./api/files/delete/+server.js";
	import type { InsertFilesBody } from "./api/files/insert/+server.js";
	import type { UpdateFileNamesBody } from "./api/files/update/name/+server.js";
	import type { UpdateFilePositionsBody } from "./api/files/update/position/+server.js";
	import { FILES_DEPENDENCY } from "./shared.js";

	const { data } = $props();

	const tree = new FileTree({
		children: (tree) =>
			data.files.map(function transform(file): FileTreeNode {
				if (file.type === "file") {
					return new FileNode({
						tree,
						id: file.id,
						name: file.name,
					});
				}

				return new FolderNode({
					tree,
					id: file.id,
					name: file.name,
					children: file.children.map(transform),
				});
			}),
	});

	const renameItem = async (event: RenameItemEvent): Promise<void> => {
		try {
			const body: UpdateFileNamesBody = [
				{
					id: Number(event.target.id),
					name: event.name,
				},
			];
			const response = await fetch("/api/files/update/name", {
				method: "POST",
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw response;
			}
		} catch (error) {
			await invalidate(FILES_DEPENDENCY);
			throw error;
		}
	};

	const onRenameItem = (event: RenameItemEvent): void => {
		toast.promise(renameItem(event), {
			loading: "Updating database",
			success: "Renamed item",
			error: "Failed to rename item",
		});
	};

	const onRenameError = (event: RenameErrorEvent): void => {
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

	const serializeReorder = (reorder: Reorder): UpdateFilePosition => ({
		id: Number(reorder.target.id),
		parent_id: reorder.parentNode !== undefined ? Number(reorder.parentNode.id) : null,
		index_in_parent: reorder.index,
	});

	const reorderItems = async (event: ReorderItemsEvent): Promise<void> => {
		try {
			const body: UpdateFilePositionsBody = event.reorders.map(serializeReorder);
			const response = await fetch("/api/files/update/position", {
				method: "POST",
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw response;
			}
		} catch (error) {
			await invalidate(FILES_DEPENDENCY);
			throw error;
		}
	};

	const onReorderItems = (event: ReorderItemsEvent): void => {
		toast.promise(reorderItems(event), {
			loading: "Updating database",
			success: "Reordered items",
			error: "Failed to reorder items",
		});
	};

	const onReorderError = (event: ReorderErrorEvent): void => {
		toast.error(`Cannot move "${event.target.name}" into or next to itself`);
	};

	const copyPasteItems = async (event: CopyPasteItemsEvent): Promise<void> => {
		try {
			const body: InsertFilesBody = {
				inserted: event.copies.map((copy, i) => ({
					type: copy.type,
					name: copy.name,
					parent_id: event.parentNode !== undefined ? Number(event.parentNode.id) : null,
					index_in_parent: event.start + i,
				})),
				reorders: event.reorders.map(serializeReorder),
			};
			const response = await fetch("/api/files/insert", {
				method: "POST",
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw response;
			}
		} catch (error) {
			await invalidate(FILES_DEPENDENCY);
			throw error;
		}
	};

	const onCopyPasteItems = (event: CopyPasteItemsEvent): void => {
		toast.promise(copyPasteItems(event), {
			loading: "Updating database",
			success: "Copied paste items",
			error: "Failed to copy paste items",
		});
	};

	const onNameConflict = (event: NameConflictEvent): NameConflictResolution => {
		toast.error(`An item with the name ${event.target.name} already exists`);
		return "cancel";
	};

	const deleteItems = async (event: DeleteItemsEvent): Promise<void> => {
		try {
			const body: DeleteFilesBody = {
				deleted: event.deleted.map((node) => Number(node.id)),
				reorders: event.reorders.map(serializeReorder),
			};
			const response = await fetch("/api/files/delete", {
				method: "POST",
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw response;
			}
		} catch (error) {
			await invalidate(FILES_DEPENDENCY);
			throw error;
		}
	};

	const onDeleteItems = (event: DeleteItemsEvent): void => {
		toast.promise(deleteItems(event), {
			loading: "Updating database",
			success: "Deleted items",
			error: "Failed to delete items",
		});
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
				class={({ dropPosition }) => [
					"relative flex items-center gap-2 rounded-md border border-neutral-400 p-3 before:pointer-events-none before:absolute before:-inset-[2px] before:rounded-[inherit] hover:bg-neutral-200 focus:outline-2 focus:outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:border-blue-400 aria-selected:bg-blue-100 aria-selected:text-blue-800 aria-selected:active:bg-blue-200",
					dropPosition !== undefined && "before:border-2",
					dropPosition === "before" && "before:border-transparent before:border-t-red-500",
					dropPosition === "inside" && "before:border-red-500",
					dropPosition === "after" && "before:border-transparent before:border-b-red-500",
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
