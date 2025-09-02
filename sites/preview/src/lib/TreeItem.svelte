<script lang="ts" module>
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import type { ClassValue, EventHandler } from "svelte/elements";
	import { TreeItem, type TreeItemState } from "svelte-file-tree";
	import { getTreeContext } from "./Tree.svelte";

	export type TreeItemProps = {
		item: TreeItemState;
		order: number;
		class?: ClassValue;
		style?: string;
	};
</script>

<script lang="ts">
	const treeContext = getTreeContext();

	const { item, order, class: className, style }: TreeItemProps = $props();

	const handleDragStart: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		if (item.disabled) {
			event.preventDefault();
			return;
		}

		treeContext.setDraggedId(item.node.id);

		if (!item.selected) {
			const selectedIds = treeContext.getSelectedIds();
			selectedIds.clear();
			selectedIds.add(item.node.id);
		}
	};

	const handleDragEnd: EventHandler<DragEvent, HTMLDivElement> = () => {
		treeContext.setDraggedId(undefined);
	};

	const handleDragEnterOrOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		const draggedId = treeContext.getDraggedId();
		if (item.disabled || item.node.id === draggedId) {
			treeContext.setDropDestinationId(undefined);
			return;
		}

		let destination;
		switch (item.node.type) {
			case "file": {
				destination = item.parent;
				break;
			}
			case "folder": {
				destination = item;
				break;
			}
		}

		for (let current = destination; current !== undefined; current = current.parent) {
			if (current.node.id === draggedId || current.selected) {
				// Prevent moving a folder into itself.
				treeContext.setDropDestinationId(undefined);
				return;
			}
		}

		event.preventDefault();

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}

		treeContext.setDropDestinationId(destination?.node.id);
	};

	const handleDragLeave: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
			return;
		}

		treeContext.setDropDestinationId(undefined);
	};

	const handleToggleClick: EventHandler<MouseEvent> = (event) => {
		event.preventDefault();

		if (item.disabled) {
			return;
		}

		const expandedIds = treeContext.getExpandedIds();
		if (item.expanded) {
			expandedIds.delete(item.node.id);
		} else {
			expandedIds.add(item.node.id);
		}
	};
</script>

<TreeItem
	{item}
	{order}
	draggable
	data-dragged={treeContext.getDraggedId() === item.node.id ? true : undefined}
	data-drop-destination={treeContext.getDropDestinationId() === item.node.id ? true : undefined}
	class={[
		"group relative flex items-center bg-white p-3 ps-[calc(3*var(--spacing)+var(--depth)*6*var(--spacing))] before:pointer-events-none before:absolute before:inset-0 before:border-2 before:border-transparent before:transition-colors after:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-transparent after:transition-colors hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300 data-dragged:opacity-50 data-drop-destination:before:border-red-500",
		className,
	]}
	{style}
	--depth={item.depth.toString()}
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	ondragenter={handleDragEnterOrOver}
	ondragover={handleDragEnterOrOver}
	ondragleave={handleDragLeave}
>
	<ChevronDownIcon
		role="presentation"
		data-invisible={item.node.type === "file" ? true : undefined}
		class="size-5 rounded-full transition-transform duration-200 group-aria-expanded:-rotate-90 hover:bg-current/8 active:bg-current/12 data-invisible:invisible"
		onclick={handleToggleClick}
	/>

	<div class="ps-1 pe-2">
		{#if item.node.type === "file"}
			<FileIcon role="presentation" />
		{:else if item.expanded}
			<FolderOpenIcon role="presentation" class="fill-blue-300" />
		{:else}
			<FolderIcon role="presentation" class="fill-blue-300" />
		{/if}
	</div>

	{item.node.name}
</TreeItem>
