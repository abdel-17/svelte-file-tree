<script lang="ts">
	import { invalidate } from "$app/navigation";
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
		type DeleteItemsArgs,
		type FileTreeNode,
		type InsertItemsArgs,
		type MoveErrorArgs,
		type MoveItemsArgs,
		type NameConflictArgs,
		type NameConflictResolution,
		type RenameErrorArgs,
		type RenameItemArgs,
	} from "svelte-file-tree";
	import { toast, Toaster } from "svelte-sonner";
	import type { DeleteFilesBody } from "./api/files/delete/+server.js";
	import type { InsertFilesBody } from "./api/files/insert/+server.js";
	import type { MoveFilesBody } from "./api/files/move/+server.js";
	import type { RenameFileBody } from "./api/files/rename/+server.js";
	import { FILES_DEPENDENCY } from "./shared.js";

	const { data } = $props();

	const tree = new FileTree({
		children: (tree) =>
			data.files.map(function transform(file): FileTreeNode {
				switch (file.type) {
					case "file": {
						return new FileNode({
							tree,
							id: file.id.toString(),
							name: file.name,
						});
					}
					case "folder": {
						return new FolderNode({
							tree,
							id: file.id.toString(),
							name: file.name,
							children: file.children.map(transform),
						});
					}
				}
			}),
	});

	let mutationPending = $state(false);

	const createMutation = <TArgs extends unknown[]>(fn: (...args: TArgs) => Promise<void>) => {
		return async function (this: unknown, ...args: TArgs): Promise<void> {
			if (mutationPending) {
				throw new Error("Another mutation is already in progress");
			}

			mutationPending = true;
			try {
				await fn.apply(this, args);
			} finally {
				try {
					await invalidate(FILES_DEPENDENCY);
				} finally {
					mutationPending = false;
				}
			}
		};
	};

	const renameFile = createMutation(async (body: RenameFileBody): Promise<void> => {
		const response = await fetch("/api/files/rename", {
			method: "POST",
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw response;
		}
	});

	const onRenameItem = ({ target, name }: RenameItemArgs): boolean => {
		target.name = name;
		toast.promise(
			renameFile({
				id: Number(target.id),
				name,
			}),
			{
				loading: "Updating database",
				success: "Renamed item successfully",
				error: "Failed to rename item",
			},
		);
		return true;
	};

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

	const updatePositions = (updates: MoveItemsArgs["updates"]): MoveFilesBody["new_positions"] => {
		const newPositions: MoveFilesBody["new_positions"] = [];
		for (const { target, children } of updates) {
			const targetId = target instanceof FolderNode ? Number(target.id) : null;
			for (let i = 0; i < children.length; i++) {
				const child = children[i];
				if (child !== target.children[i]) {
					newPositions.push({
						id: Number(child.id),
						parent_id: targetId,
						index_in_parent: i,
					});
				}
			}
			target.children = children;
		}
		return newPositions;
	};

	const moveFiles = createMutation(async (body: MoveFilesBody): Promise<void> => {
		const response = await fetch("/api/files/move", {
			method: "POST",
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw response;
		}
	});

	const onMoveItems = ({ updates }: MoveItemsArgs): boolean => {
		const newPositions = updatePositions(updates);
		toast.promise(
			moveFiles({
				new_positions: newPositions,
			}),
			{
				loading: "Updating database",
				success: "Moved items successfully",
				error: "Failed to move items",
			},
		);
		return true;
	};

	const onMoveError = ({ target }: MoveErrorArgs): void => {
		toast.error(`Cannot move "${target.name}" into or next to itself`);
	};

	const forEachChild = (
		parent: FolderNode,
		callback: (child: FileTreeNode, index: number, parent: FolderNode) => void,
	): void => {
		for (let i = 0; i < parent.children.length; i++) {
			const child = parent.children[i];
			callback(child, i, parent);

			if (child.type === "folder") {
				forEachChild(child, callback);
			}
		}
	};

	const insertFiles = createMutation(async (body: InsertFilesBody): Promise<void> => {
		const response = await fetch("/api/files/insert", {
			method: "POST",
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw response;
		}
	});

	const onInsertItems = ({ target, inserted, index }: InsertItemsArgs): boolean => {
		const targetId = target instanceof FolderNode ? Number(target.id) : null;
		const allInserted: InsertFilesBody["inserted"] = [];
		for (let i = 0; i < inserted.length; i++) {
			const node = inserted[i];
			allInserted.push({
				name: node.name,
				type: node.type,
				parent_id: targetId,
				index_in_parent: index + i,
			});

			if (node.type === "folder") {
				forEachChild(node, (child, j, parent) => {
					allInserted.push({
						name: child.name,
						type: child.type,
						parent_id: Number(parent.id),
						index_in_parent: j,
					});
				});
			}
		}

		const newPositions: MoveFilesBody["new_positions"] = [];
		for (let i = index; i < target.children.length; i++) {
			const child = target.children[i];
			newPositions.push({
				id: Number(child.id),
				parent_id: targetId,
				index_in_parent: inserted.length + i,
			});
		}

		target.children.splice(index, 0, ...inserted);
		toast.promise(
			insertFiles({
				inserted: allInserted,
				new_positions: newPositions,
			}),
			{
				loading: "Updating database",
				success: "Inserted items successfully",
				error: "Failed to insert items",
			},
		);
		return true;
	};

	const onNameConflict = ({ target }: NameConflictArgs): NameConflictResolution => {
		toast.error(`An item with the name ${target.name} already exists`);
		return "cancel";
	};

	const deleteFiles = createMutation(async (body: DeleteFilesBody): Promise<void> => {
		const response = await fetch("/api/files/delete", {
			method: "POST",
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw response;
		}
	});

	const onDeleteItems = ({ updates, deleted }: DeleteItemsArgs): boolean => {
		const newPositions = updatePositions(updates);
		toast.promise(
			deleteFiles({
				deleted: deleted.map((node) => Number(node.id)),
				new_positions: newPositions,
			}),
			{
				loading: "Updating database",
				success: "Deleted items successfully",
				error: "Failed to delete items",
			},
		);
		return true;
	};
</script>

<main class="p-8">
	<Tree
		{tree}
		{onRenameItem}
		{onRenameError}
		{onMoveItems}
		{onMoveError}
		{onInsertItems}
		{onNameConflict}
		{onDeleteItems}
		class="space-y-4"
	>
		{#snippet item({ node, depth })}
			<TreeItem
				editable
				draggable
				disabled={mutationPending}
				class={({ dropPosition }) => [
					"relative flex items-center gap-2 rounded-md border border-neutral-400 p-3 hover:bg-neutral-200 focus:outline-2 focus:outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:border-blue-400 aria-selected:bg-blue-100 aria-selected:text-blue-800 aria-selected:active:bg-blue-200",
					dropPosition !== undefined &&
						"before:pointer-events-none before:absolute before:-inset-[2px] before:rounded-[inherit] before:border-2",
					dropPosition === "before" && "before:border-transparent before:border-t-red-500",
					dropPosition === "after" && "before:border-transparent before:border-b-red-500",
					dropPosition === "inside" && "before:border-red-500",
					mutationPending && "pointer-events-none opacity-50",
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
