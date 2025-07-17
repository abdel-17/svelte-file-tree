<script lang="ts">
	import { flip } from "svelte/animate";
	import { SvelteSet } from "svelte/reactivity";
	import {
		FileNode,
		Tree,
		type DragEventArgs,
		type FileTree,
		type FileTreeNode,
		type FolderNode,
		type OnCircularReferenceArgs,
		type OnMoveArgs,
		type OnRemoveArgs,
		type OnResolveNameConflictArgs,
		type TreeItemState,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";
	import ConfirmDialog from "./ConfirmDialog.svelte";
	import TreeItem from "./TreeItem.svelte";
	import type { TreeProps } from "./types.js";

	const { root }: TreeProps = $props();

	const expandedIds = new SvelteSet<string>();
	let dropDestination: FolderNode | FileTree | undefined = $state.raw();

	let borderAnimationTargetId: string | undefined = $state.raw();
	let borderAnimationTimeout: number | undefined;

	let confirmDialog: ConfirmDialog | null = $state.raw(null);

	function startBorderAnimation(targetId: string) {
		if (borderAnimationTimeout !== undefined) {
			window.clearTimeout(borderAnimationTimeout);
		}

		borderAnimationTargetId = targetId;
		borderAnimationTimeout = window.setTimeout(() => {
			borderAnimationTargetId = undefined;
		}, 1000);
	}

	function sortByName(nodes: Array<FileTreeNode>) {
		nodes.sort((a, b) => a.name.localeCompare(b.name));
	}

	async function onResolveNameConflict({ operation, name }: OnResolveNameConflictArgs) {
		let title: string;
		switch (operation) {
			case "copy": {
				title = "Failed to copy items";
				break;
			}
			case "move": {
				title = "Failed to move items";
				break;
			}
		}

		const didConfirm = await confirmDialog!.show({
			title,
			description: `An item named "${name}" already exists in this location. Do you want to skip it or cancel the operation entirely?`,
			confirmLabel: "Skip",
		});
		return didConfirm ? "skip" : "cancel";
	}

	function onCircularReference({ source }: OnCircularReferenceArgs) {
		toast.error(`Cannot move "${source.node.name}" inside itself`);
	}

	function canRemove({ removed }: OnRemoveArgs) {
		return confirmDialog!.show({
			title: `Are you sure you want to delete ${removed.length} item(s)?`,
			description: "They will be permanently deleted. This action cannot be undone.",
			confirmLabel: "Confirm",
		});
	}

	function onCopy({ destination }: OnMoveArgs) {
		sortByName(destination.children);

		if (destination.type === "folder") {
			startBorderAnimation(destination.id);
		}
	}

	function onMove({ destination }: OnMoveArgs) {
		sortByName(destination.children);

		if (destination.type === "folder") {
			startBorderAnimation(destination.id);
		}
	}

	function onDrag({ destination }: DragEventArgs) {
		dropDestination = destination;
	}

	function onDragLeave() {
		dropDestination = undefined;
	}

	function onDrop({ type, items, destination }: DragEventArgs) {
		dropDestination = undefined;

		if (type !== "external") {
			return;
		}

		const uniqueNames = new Set();
		for (const child of destination.children) {
			uniqueNames.add(child.name);
		}

		const files: Array<FileNode> = [];
		for (const item of items) {
			const file = item.getAsFile();
			if (file === null) {
				continue;
			}

			const fileName = file.name;
			if (uniqueNames.has(fileName)) {
				toast.error(`An item named "${fileName}" already exists in this location`);
				return;
			}

			files.push(
				new FileNode({
					id: crypto.randomUUID(),
					name: fileName,
				}),
			);
		}

		destination.children.push(...files);
		sortByName(destination.children);

		if (destination.type === "folder") {
			startBorderAnimation(destination.id);
		}
	}

	function onExpand(item: TreeItemState) {
		expandedIds.add(item.node.id);
	}

	function onCollapse(item: TreeItemState) {
		expandedIds.delete(item.node.id);
	}

	function onRename(item: TreeItemState, name: string) {
		if (name.length === 0) {
			toast.error("Name cannot be empty");
			return false;
		}

		if (name.includes("/")) {
			toast.error("The name cannot contain a slash");
			return false;
		}

		const node = item.node;
		const siblings = item.parent?.node.children ?? root.children;
		for (const sibling of siblings) {
			if (sibling !== node && sibling.name === name) {
				toast.error(`An item named "${name}" already exists in this location`);
				return false;
			}
		}

		node.name = name;
		return true;
	}
</script>

<div class="flex min-h-svh p-4">
	<Tree
		{root}
		{expandedIds}
		{onResolveNameConflict}
		{onCircularReference}
		{canRemove}
		{onCopy}
		{onMove}
		{onDrag}
		{onDragLeave}
		{onDrop}
		data-drop-destination={dropDestination === root ? true : undefined}
		class="relative grow p-6 before:pointer-events-none before:absolute before:inset-0 before:border-2 before:border-transparent before:transition-colors focus-visible:outline-2 focus-visible:outline-current data-drop-destination:before:border-red-500"
	>
		{#snippet children({ items })}
			{#each items.filter((item) => item.visible) as item (item.node.id)}
				<div animate:flip={{ duration: 300 }}>
					<TreeItem
						{item}
						{onDragLeave}
						{onExpand}
						{onCollapse}
						{onRename}
						isDropDestination={dropDestination === item.node}
						isBorderAnimationTarget={borderAnimationTargetId === item.node.id}
					/>
				</div>
			{/each}
		{/snippet}
	</Tree>
</div>

<ConfirmDialog bind:this={confirmDialog} />
