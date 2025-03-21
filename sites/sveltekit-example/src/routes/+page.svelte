<script lang="ts">
	import { invalidate } from "$app/navigation";
	import type { FileInsert } from "$lib/server/database/utils.js";
	import { SvelteSet } from "svelte/reactivity";
	import {
		FileNode,
		FileTree,
		FolderNode,
		type AlreadyExistsErrorArgs,
		type CircularReferenceErrorArgs,
		type CopyPasteItemsArgs,
		type FileTreeNode,
		type MoveItemsArgs,
		type RemoveItemsArgs,
		type RenameItemArgs,
	} from "svelte-file-tree";
	import { StyledTree, type AddItemsArgs } from "svelte-file-tree-styled";
	import { toast } from "svelte-sonner";
	import * as api from "./api.js";
	import { FILES_DEPENDENCY } from "./shared.js";

	const { data } = $props();

	const tree = $derived(
		new FileTree(
			data.files.map(function transform(file): FileTreeNode {
				switch (file.type) {
					case "file": {
						return new FileNode({
							id: file.id.toString(),
							data: {
								name: file.name,
							},
						});
					}
					case "folder": {
						return new FolderNode({
							id: file.id.toString(),
							data: {
								name: file.name,
							},
							children: file.children.map(transform),
						});
					}
				}
			}),
		),
	);

	const pendingIds = new SvelteSet<string>();

	async function mutate({
		mutated,
		mutation,
	}: {
		mutated: Array<FileTreeNode>;
		mutation: () => Promise<void>;
	}): Promise<void> {
		for (const node of mutated) {
			pendingIds.add(node.id);
		}

		try {
			await mutation();
		} finally {
			try {
				await invalidate(FILES_DEPENDENCY);
			} finally {
				for (const node of mutated) {
					pendingIds.delete(node.id);
				}
			}
		}
	}

	function handleRenameItem({ target, name }: RenameItemArgs): boolean {
		target.data.name = name;
		toast.promise(
			mutate({
				mutated: [target],
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

	function handleMoveItems({ updates }: MoveItemsArgs): boolean {
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

		let mutated: Array<FileTreeNode> = [];
		for (const { target } of updates) {
			if (target instanceof FileTree) {
				mutated = target.children;
				break;
			}

			mutated.push(target);
		}

		toast.promise(
			mutate({
				mutated,
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

	function toFileInsert(node: FileTreeNode): FileInsert {
		switch (node.type) {
			case "file": {
				return {
					type: "file",
					name: node.data.name,
				};
			}
			case "folder": {
				return {
					type: "folder",
					name: node.data.name,
					children: node.children.map(toFileInsert),
				};
			}
		}
	}

	function handleCopyPasteItems({ target, start, copies }: CopyPasteItemsArgs): boolean {
		target.children.splice(start, 0, ...copies);
		toast.promise(
			mutate({
				mutated: target instanceof FileTree ? target.children : [target],
				mutation: async () => {
					await api.insertFiles({
						parentId: target instanceof FolderNode ? Number(target.id) : null,
						start,
						inserted: copies.map(toFileInsert),
					});
				},
			}),
			{
				loading: "Updating database",
				success: "Pasted items successfully",
				error: "Failed to pasted items",
			},
		);
		return true;
	}

	function handleAddItems({ target, added }: AddItemsArgs): boolean {
		const start = target.children.push(...added) - 1;
		toast.promise(
			mutate({
				mutated: target instanceof FileTree ? target.children : [target],
				mutation: async () => {
					await api.insertFiles({
						parentId: target instanceof FolderNode ? Number(target.id) : null,
						start,
						inserted: added.map(toFileInsert),
					});
				},
			}),
			{
				loading: "Updating database",
				success: "Added items successfully",
				error: "Failed to add items",
			},
		);
		return true;
	}

	function handleRemoveItems({ updates, removed }: RemoveItemsArgs): boolean {
		for (const { target, children } of updates) {
			target.children = children;
		}

		let mutated: Array<FileTreeNode> = [];
		for (const { target } of updates) {
			if (target instanceof FileTree) {
				mutated = target.children;
				break;
			}

			mutated.push(target);
		}

		toast.promise(
			mutate({
				mutated,
				mutation: async () => {
					const deletedIds = removed.map((node) => Number(node.id));
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

	function handleAlreadyExistsError({ name }: AlreadyExistsErrorArgs): void {
		toast.error(`An item with the name "${name}" already exists`);
	}

	function handleCircularReferenceError({ target, position }: CircularReferenceErrorArgs): void {
		toast.error(`Cannot move "${target.data.name}" ${position} itself`);
	}
</script>

<main class="p-8">
	<StyledTree
		{tree}
		isItemEditable
		isItemDisabled={(node) => pendingIds.has(node.id)}
		onRenameItem={handleRenameItem}
		onMoveItems={handleMoveItems}
		onCopyPasteItems={handleCopyPasteItems}
		onAddItems={handleAddItems}
		onRemoveItems={handleRemoveItems}
		onAlreadyExistsError={handleAlreadyExistsError}
		onCircularReferenceError={handleCircularReferenceError}
	/>
</main>
