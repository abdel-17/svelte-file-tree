<script lang="ts">
	import { invalidate } from "$app/navigation";
	import { SvelteSet } from "svelte/reactivity";
	import {
		FileNode,
		FileTree,
		FolderNode,
		type DeleteItemsArgs,
		type FileTreeNode,
		type InsertItemsArgs,
		type MoveItemsArgs,
		type RenameItemArgs,
	} from "svelte-file-tree";
	import { Tree } from "svelte-file-tree-styled";
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
							name: file.name,
						});
					}
					case "folder": {
						return new FolderNode({
							id: file.id.toString(),
							name: file.name,
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

	function onRenameItem({ target, name }: RenameItemArgs): boolean {
		target.name = name;
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

	function onInsertItems({ target, start, inserted }: InsertItemsArgs): boolean {
		target.children.splice(start, 0, ...inserted);
		toast.promise(
			mutate({
				mutated: target instanceof FileTree ? target.children : [target],
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

	function onDeleteItems({ updates, deleted }: DeleteItemsArgs): boolean {
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
		{onRenameItem}
		{onMoveItems}
		{onInsertItems}
		{onDeleteItems}
		isItemEditable
		isItemDisabled={(node) => pendingIds.has(node.id)}
	/>
</main>
