<script lang="ts">
	import { invalidate } from "$app/navigation";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import FileIcon from "@lucide/svelte/icons/file";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import FolderOpenIcon from "@lucide/svelte/icons/folder-open";
	import { SvelteSet } from "svelte/reactivity";
	import {
		FileNode,
		FileTree,
		FolderNode,
		Tree,
		TreeItem,
		TreeItemInput,
		type DeleteItemsArgs,
		type InsertItemsArgs,
		type MoveErrorArgs,
		type MoveItemsArgs,
		type NameConflictArgs,
		type NameConflictResolution,
		type RenameErrorArgs,
		type RenameItemArgs,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";
	import * as api from "./api.js";
	import { FILES_DEPENDENCY } from "./shared.js";

	const { data } = $props();

	const tree = new FileTree({
		children: (tree) =>
			data.files.map(function transform(file): FileTree.Node {
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

	const disabledIds = new SvelteSet<string>();

	async function mutate({
		affected,
		mutation,
	}: {
		affected: Array<FileTree.Node>;
		mutation: () => Promise<void>;
	}): Promise<void> {
		for (const node of affected) {
			disabledIds.add(node.id);
		}

		try {
			await mutation();
		} finally {
			try {
				await invalidate(FILES_DEPENDENCY);
			} finally {
				for (const node of affected) {
					disabledIds.delete(node.id);
				}
			}
		}
	}

	function onRenameItem({ target, name }: RenameItemArgs): boolean {
		target.name = name;
		toast.promise(
			mutate({
				affected: [target],
				mutation: async () => {
					await api.renameFile({
						id: Number(target.id),
						name,
					});
				},
			}),
			{
				loading: "Updating database",
				success: "Renamed item successfully",
				error: "Failed to rename item",
			},
		);
		return true;
	}

	function onRenameError({ error, name }: RenameErrorArgs): void {
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
	}

	function onMoveItems({ updates }: MoveItemsArgs): boolean {
		const body: api.MoveFilesBody = [];
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

		if (body.length === 0) {
			return false;
		}

		let affected: Array<FileTree.Node> = [];
		for (const { target } of updates) {
			if (target instanceof FileTree) {
				affected = target.children;
				break;
			}

			affected.push(target);
		}

		toast.promise(
			mutate({
				affected,
				mutation: async () => {
					await api.moveFiles(body);
				},
			}),
			{
				loading: "Updating database",
				success: "Moved items successfully",
				error: "Failed to move items",
			},
		);
		return true;
	}

	function onMoveError({ target }: MoveErrorArgs): void {
		toast.error(`Cannot move "${target.name}" into or next to itself`);
	}

	function onInsertItems({ target, start, inserted }: InsertItemsArgs): boolean {
		target.children.splice(start, 0, ...inserted);
		toast.promise(
			mutate({
				affected: target instanceof FileTree ? target.children : [target],
				mutation: async () => {
					await api.insertFiles({
						parentId: target instanceof FolderNode ? Number(target.id) : null,
						start,
						inserted: inserted.map((node) => node.toJSON()),
					});
				},
			}),
			{
				loading: "Updating database",
				success: "Inserted items successfully",
				error: "Failed to insert items",
			},
		);
		return true;
	}

	function onNameConflict({ target }: NameConflictArgs): NameConflictResolution {
		toast.error(`An item with the name "${target.name}" already exists`);
		return "cancel";
	}

	function onDeleteItems({ updates, deleted }: DeleteItemsArgs): boolean {
		for (const { target, children } of updates) {
			target.children = children;
		}

		let affected: Array<FileTree.Node> = [];
		for (const { target } of updates) {
			if (target instanceof FileTree) {
				affected = target.children;
				break;
			}

			affected.push(target);
		}

		toast.promise(
			mutate({
				affected,
				mutation: async () => {
					const deletedIds = deleted.map((node) => Number(node.id));
					await api.deleteFiles(deletedIds);
				},
			}),
			{
				loading: "Updating database",
				success: "Deleted items successfully",
				error: "Failed to delete items",
			},
		);
		return true;
	}
</script>

<main class="p-8">
	<Tree
		{tree}
		editable
		disabled={(node) => disabledIds.has(node.id)}
		{onRenameItem}
		{onRenameError}
		{onMoveItems}
		{onMoveError}
		{onInsertItems}
		{onNameConflict}
		{onDeleteItems}
		class="space-y-4"
	>
		{#snippet item({ node, depth, editing, disabled, dragged, dropPosition })}
			<TreeItem
				draggable
				class={[
					"relative flex items-center rounded-md border border-neutral-400 p-3 hover:bg-neutral-200 focus:outline-2 focus:outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:border-blue-400 aria-selected:bg-blue-100 aria-selected:text-blue-800 aria-selected:active:bg-blue-200",
					dragged && "opacity-50",
					dropPosition !== undefined &&
						"before:pointer-events-none before:absolute before:-inset-[2px] before:rounded-[inherit] before:border-2",
					dropPosition === "before" && "before:border-transparent before:border-t-red-500",
					dropPosition === "after" && "before:border-transparent before:border-b-red-500",
					dropPosition === "inside" && "before:border-red-500",
					disabled && "pointer-events-none opacity-50",
				]}
				style="margin-inline-start: {depth * 16}px;"
			>
				<ChevronDownIcon
					role="presentation"
					size={20}
					class={[
						"rounded-full p-0.25 transition-transform duration-200 hover:bg-current/8 active:bg-current/12",
						node.type === "folder" && node.expanded && "-rotate-90",
						node.type === "file" && "invisible",
					]}
					onclick={(event) => {
						if (node.type === "folder") {
							node.toggleExpanded();
						}

						event.stopPropagation();
					}}
				/>

				<div class="ms-1 me-3">
					{#if node.type === "file"}
						<FileIcon role="presentation" />
					{:else if node.expanded}
						<FolderOpenIcon role="presentation" class="fill-blue-300" />
					{:else}
						<FolderIcon role="presentation" class="fill-blue-300" />
					{/if}
				</div>

				{#if editing}
					<TreeItemInput class="border bg-white focus:outline-none" />
				{:else}
					<span class="select-none">{node.name}</span>
				{/if}
			</TreeItem>
		{/snippet}
	</Tree>
</main>
