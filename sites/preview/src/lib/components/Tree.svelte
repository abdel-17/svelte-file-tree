<script lang="ts">
	import {
		Tree,
		type FileTree,
		type FolderNode,
		type OnChildrenChangeArgs,
		type OnCircularReferenceArgs,
		type OnDropDestinationChangeArgs,
		type OnMoveArgs,
		type OnRemoveArgs,
		type OnResolveNameConflictArgs,
		type TreeItemState,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";
	import { flip } from "svelte/animate";
	import { SvelteSet } from "svelte/reactivity";
	import ConfirmRemoveDialog from "./ConfirmRemoveDialog.svelte";
	import ResolveConflictDialog from "./ResolveConflictDialog.svelte";
	import TreeItem from "./TreeItem.svelte";
	import type { TreeProps } from "./types.js";

	const { root }: TreeProps = $props();

	const expandedIds = new SvelteSet<string>();
	let dropDestination: FolderNode | FileTree | undefined = $state.raw();

	let borderAnimationTargetId: string | undefined = $state.raw();
	let borderAnimationTimeout: number | undefined;

	let confirmRemoveDialog: ConfirmRemoveDialog | null = $state.raw(null);
	let resolveConflictDialog: ResolveConflictDialog | null = $state.raw(null);

	function startBorderAnimation(targetId: string) {
		if (borderAnimationTimeout !== undefined) {
			window.clearTimeout(borderAnimationTimeout);
		}

		borderAnimationTargetId = targetId;
		borderAnimationTimeout = window.setTimeout(() => {
			borderAnimationTargetId = undefined;
		}, 1000);
	}

	function onChildrenChange(args: OnChildrenChangeArgs) {
		if (args.operation === "insert") {
			args.children.sort((a, b) => a.name.localeCompare(b.name));
		}
	}

	function onDropDestinationChange(args: OnDropDestinationChangeArgs) {
		dropDestination = args.dropDestination;
	}

	function onResolveNameConflict(args: OnResolveNameConflictArgs) {
		let title: string;
		switch (args.operation) {
			case "copy": {
				title = "Failed to copy items";
				break;
			}
			case "move": {
				title = "Failed to move items";
				break;
			}
		}

		return resolveConflictDialog!.show({
			title,
			description: `An item named "${args.name}" already exists in this location. Do you want to skip it or cancel the operation entirely?`,
		});
	}

	function onCircularReference(args: OnCircularReferenceArgs) {
		toast.error(`Cannot move "${args.source.node.name}" inside itself`);
	}

	function canRemove(args: OnRemoveArgs) {
		return confirmRemoveDialog!.show({
			title: `Are you sure you want to delete ${args.removed.length} item(s)?`,
			description: "They will be permanently deleted. This action cannot be undone.",
		});
	}

	function onCopy(args: OnMoveArgs) {
		if (args.destination.type === "folder") {
			startBorderAnimation(args.destination.id);
		}
	}

	function onMove(args: OnMoveArgs) {
		if (args.destination.type === "folder") {
			startBorderAnimation(args.destination.id);
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

<div class="flex min-h-svh p-2">
	<Tree
		{root}
		{expandedIds}
		{onChildrenChange}
		{onDropDestinationChange}
		{onResolveNameConflict}
		{onCircularReference}
		{canRemove}
		{onCopy}
		{onMove}
		data-drop-destination={dropDestination === root ? true : undefined}
		class="relative grow p-6 before:pointer-events-none before:absolute before:inset-0 before:border-2 before:border-transparent before:transition-colors focus-visible:outline-2 focus-visible:outline-current data-drop-destination:before:border-red-500"
	>
		{#snippet children({ items })}
			{#each items.filter((item) => item.visible) as item (item.node.id)}
				<div animate:flip={{ duration: 300 }}>
					<TreeItem
						{item}
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

<ConfirmRemoveDialog bind:this={confirmRemoveDialog} />
<ResolveConflictDialog bind:this={resolveConflictDialog} />
