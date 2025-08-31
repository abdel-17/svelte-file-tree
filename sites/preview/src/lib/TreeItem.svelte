<script lang="ts" module>
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import type { ClassValue } from "svelte/elements";
	import { TreeItem, type TreeItemState } from "svelte-file-tree";
	import { getTreeContext } from "./Tree.svelte";

	export type TreeItemProps = {
		item: TreeItemState;
		class?: ClassValue;
		style?: string;
	};
</script>

<script lang="ts">
	const treeContext = getTreeContext();

	const { item, class: className, style }: TreeItemProps = $props();

	const defaultStyle = $derived(`--depth: ${item.depth};`);
</script>

<TreeItem
	{item}
	onDragLeave={() => treeContext.onDragLeave()}
	data-dragged={treeContext.draggedId() === item.node.id ? true : undefined}
	data-drop-destination={treeContext.dropDestination() === item.node ? true : undefined}
	style={style ? `${defaultStyle} ${style}` : defaultStyle}
	class={[
		"group relative flex items-center bg-white p-3 ps-[calc(3*var(--spacing)+var(--depth)*6*var(--spacing))] before:pointer-events-none before:absolute before:inset-0 before:border-2 before:border-transparent before:transition-colors after:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-transparent after:transition-colors hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300 data-dragged:opacity-50 data-drop-destination:before:border-red-500",
		className,
	]}
	ondragstart={() => treeContext.onDragStart(item.node.id)}
	ondragend={() => treeContext.onDragEnd()}
>
	<ChevronDownIcon
		role="presentation"
		data-invisible={item.node.type === "file" ? true : undefined}
		class="size-5 rounded-full transition-transform duration-200 group-aria-expanded:-rotate-90 hover:bg-current/8 active:bg-current/12 data-invisible:invisible"
		onclick={(event) => {
			event.preventDefault();
			treeContext.onToggleExpansion(item);
		}}
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
