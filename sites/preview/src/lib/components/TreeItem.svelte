<script lang="ts">
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import { TreeItem } from "svelte-file-tree";
	import type { TreeItemProps } from "./types.js";

	const { item, dropDestination, onExpand, onCollapse }: TreeItemProps = $props();

	let dragged = $state.raw(false);
</script>

<TreeItem
	{item}
	class={[
		"relative flex items-center p-3 hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300",
		{
			"opacity-50": dragged,
			"before:pointer-events-none before:absolute before:inset-0 before:border-2 before:border-red-500":
				dropDestination === item.node,
		},
	]}
	style="padding-inline-start: calc(var(--spacing) * {item.depth * 6} + var(--spacing) * 3)"
	onDragStart={() => {
		dragged = true;
	}}
	onDrop={() => {
		dragged = false;
	}}
>
	<button
		type="button"
		aria-expanded={item.expanded}
		tabindex={-1}
		class={[
			"rounded-full transition-transform duration-200 hover:bg-current/8 active:bg-current/12",
			{
				invisible: item.node.type === "file",
				"-rotate-90": item.expanded,
			},
		]}
		onclick={(event) => {
			event.stopPropagation();

			if (item.expanded) {
				onCollapse();
			} else {
				onExpand();
			}
		}}
	>
		<span class="sr-only">Toggle expansion</span>
		<ChevronDownIcon role="presentation" size={20} />
	</button>

	<div class="ps-1">
		{#if item.node.type === "file"}
			<FileIcon role="presentation" />
		{:else if item.expanded}
			<FolderOpenIcon role="presentation" class="fill-blue-300" />
		{:else}
			<FolderIcon role="presentation" class="fill-blue-300" />
		{/if}
	</div>

	<div class="grow px-2">{item.node.name}</div>
</TreeItem>
