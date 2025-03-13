<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import FileIcon from "@lucide/svelte/icons/file";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import FolderOpenIcon from "@lucide/svelte/icons/folder-open";
	import { TreeItem, TreeItemInput, type FileTreeNode } from "svelte-file-tree";
	import type { EventHandler } from "svelte/elements";

	const {
		node,
		depth,
		expanded,
		dragged,
		onExpand,
		onCollapse,
	}: {
		node: FileTreeNode;
		depth: number;
		expanded: boolean;
		dragged: boolean;
		onExpand: () => void;
		onCollapse: () => void;
	} = $props();

	const handleToggleButtonClick: EventHandler<MouseEvent> = (event) => {
		if (expanded) {
			onCollapse();
		} else {
			onExpand();
		}

		event.stopPropagation();
		event.currentTarget.parentElement?.focus();
	};
</script>

<TreeItem
	draggable
	class={({ dropPosition }) => [
		"relative flex items-center rounded-md border border-neutral-400 p-3 hover:bg-neutral-200 focus:outline-2 focus:outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:border-blue-400 aria-selected:bg-blue-100 aria-selected:text-blue-800 aria-selected:active:bg-blue-200",
		dragged && "opacity-50",
		dropPosition() !== undefined &&
			"before:pointer-events-none before:absolute before:-inset-[2px] before:rounded-[inherit] before:border-2",
		dropPosition() === "before" && "before:border-transparent before:border-t-red-500",
		dropPosition() === "after" && "before:border-transparent before:border-b-red-500",
		dropPosition() === "inside" && "before:border-red-500",
	]}
	style="margin-inline-start: {depth * 16}px;"
>
	{#snippet children({ editing })}
		<button
			aria-expanded={expanded}
			tabindex={-1}
			class={[
				"rounded-full transition-transform duration-200 hover:bg-current/8 active:bg-current/12",
				expanded && "-rotate-90",
				node.type === "file" && "invisible",
			]}
			onclick={handleToggleButtonClick}
		>
			<span class="sr-only">Toggle expansion</span>
			<ChevronDownIcon role="presentation" size={20} />
		</button>

		<div class="ms-1 me-3">
			{#if node.type === "file"}
				<FileIcon role="presentation" />
			{:else if expanded}
				<FolderOpenIcon role="presentation" class="fill-blue-300" />
			{:else}
				<FolderIcon role="presentation" class="fill-blue-300" />
			{/if}
		</div>

		{#if editing()}
			<TreeItemInput class="border bg-white focus:outline-none" />
		{:else}
			<span class="select-none">{node.name}</span>
		{/if}
	{/snippet}
</TreeItem>
