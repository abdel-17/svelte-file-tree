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
	import * as api from "./api.js";
	import type { MoveFilesBody } from "./api.js";
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

	const createMutation = <TArgs extends Array<unknown>>(fn: (...args: TArgs) => Promise<void>) => {
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

	const optimisticRenameItem = createMutation(
		async ({ target, name }: RenameItemArgs): Promise<void> => {
			target.name = name;

			await api.renameFile({
				id: Number(target.id),
				name,
			});
		},
	);

	const onRenameItem = (args: RenameItemArgs): boolean => {
		toast.promise(optimisticRenameItem(args), {
			loading: "Updating database",
			success: "Renamed item successfully",
			error: "Failed to rename item",
		});
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

	const optimisticMoveItems = createMutation(async ({ updates }: MoveItemsArgs): Promise<void> => {
		const body: MoveFilesBody = [];
		for (const { target, children } of updates) {
			const targetId = target instanceof FolderNode ? Number(target.id) : null;
			for (let i = 0; i < children.length; i++) {
				const child = children[i];
				if (child !== target.children[i]) {
					body.push({
						id: Number(child.id),
						parentId: targetId,
						index: i,
					});
				}
			}

			target.children = children;
		}

		await api.moveFiles(body);
	});

	const onMoveItems = (args: MoveItemsArgs): boolean => {
		toast.promise(optimisticMoveItems(args), {
			loading: "Updating database",
			success: "Moved items successfully",
			error: "Failed to move items",
		});
		return true;
	};

	const onMoveError = ({ target }: MoveErrorArgs): void => {
		toast.error(`Cannot move "${target.name}" into or next to itself`);
	};

	const optimisticInsertItems = createMutation(
		async ({ target, start, inserted }: InsertItemsArgs): Promise<void> => {
			target.children.splice(start, 0, ...inserted);

			await api.insertFiles({
				parentId: target instanceof FolderNode ? Number(target.id) : null,
				start,
				inserted: inserted.map((node) => node.toJSON()),
			});
		},
	);

	const onInsertItems = (args: InsertItemsArgs): boolean => {
		toast.promise(optimisticInsertItems(args), {
			loading: "Updating database",
			success: "Inserted items successfully",
			error: "Failed to insert items",
		});
		return true;
	};

	const onNameConflict = ({ target }: NameConflictArgs): NameConflictResolution => {
		toast.error(`An item with the name "${target.name}" already exists`);
		return "cancel";
	};

	const optimisticDeleteItems = createMutation(
		async ({ updates, deleted }: DeleteItemsArgs): Promise<void> => {
			for (const { target, children } of updates) {
				target.children = children;
			}

			const deletedIds = deleted.map((node) => Number(node.id));
			await api.deleteFiles(deletedIds);
		},
	);

	const onDeleteItems = (args: DeleteItemsArgs): boolean => {
		toast.promise(optimisticDeleteItems(args), {
			loading: "Updating database",
			success: "Deleted items successfully",
			error: "Failed to delete items",
		});
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
