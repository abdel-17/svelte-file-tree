<script lang="ts">
	import type { FileTreeNode } from "$lib/tree.svelte";
	import { formatSize } from "$lib/utils";
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import {
		TreeItem,
		TreeItemInput,
		type TreeItemProps,
		type TreeItemState,
	} from "svelte-file-tree";
	import type { EventHandler } from "svelte/elements";
	import ContextMenu from "./ContextMenu.svelte";

	interface Props extends Omit<TreeItemProps, "children"> {
		item: TreeItemState<FileTreeNode>;
		contextMenu: ContextMenu | null;
		onExpand: () => void;
		onCollapse: () => void;
	}

	let {
		item,
		contextMenu,
		onExpand,
		onCollapse,
		editing = $bindable(false),
		ref = $bindable(null),
		...rest
	}: Props = $props();

	const handleContextMenu: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		if (contextMenu === null) {
			throw new Error("Context menu is not mounted");
		}

		if (event.defaultPrevented) {
			return;
		}

		if (item.disabled) {
			event.preventDefault();
			return;
		}

		contextMenu.open({
			type: "item",
			item: () => item,
			edit: () => {
				editing = true;
			},
		});
	};

	const handleToggleClick: EventHandler<MouseEvent, HTMLButtonElement> = (event) => {
		if (ref === null) {
			throw new Error("Tree item is not mounted");
		}

		if (item.disabled) {
			event.preventDefault();
			return;
		}

		if (item.expanded) {
			onCollapse();
		} else {
			onExpand();
		}

		event.stopPropagation();
		ref.focus();
	};

	$effect(() => {
		return () => {
			contextMenu?.onItemDestroyed(item);
		};
	});
</script>

<TreeItem
	{...rest}
	bind:editing
	bind:ref
	class={({ dropPosition }) => [
		"relative grid grid-cols-(--grid-cols) gap-x-(--grid-gap) rounded-md p-(--grid-inline-padding) hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300 aria-selected:has-[+[aria-selected='true']]:rounded-b-none aria-selected:[&+[aria-selected='true']]:rounded-t-none",
		item.dragged && "opacity-50",
		dropPosition() !== undefined &&
			"before:pointer-events-none before:absolute before:-inset-0 before:rounded-[inherit] before:border-2",
		dropPosition() === "before" && "before:border-neutral-300 before:border-t-red-500",
		dropPosition() === "after" && "before:border-neutral-300 before:border-b-red-500",
		dropPosition() === "inside" && "before:border-red-500",
	]}
	oncontextmenu={handleContextMenu}
>
	<div
		class="flex items-center"
		style="padding-inline-start: calc(var(--spacing) * {item.depth * 6})"
	>
		<button
			aria-expanded={item.expanded}
			tabindex={-1}
			class={[
				"rounded-full transition-transform duration-200 hover:bg-current/8 active:bg-current/12",
				item.expanded && "-rotate-90",
				item.node.type === "file" && "invisible",
			]}
			onclick={handleToggleClick}
		>
			<span class="sr-only">Toggle expansion</span>
			<ChevronDownIcon role="presentation" size={20} />
		</button>

		<div class="ps-1 pe-2">
			{#if item.node.type === "file"}
				<FileIcon role="presentation" />
			{:else if item.expanded}
				<FolderOpenIcon role="presentation" class="fill-blue-300" />
			{:else}
				<FolderIcon role="presentation" class="fill-blue-300" />
			{/if}
		</div>

		{#if editing}
			<TreeItemInput class="border bg-white focus:outline-none" />
		{:else}
			<span>{item.node.name}</span>
		{/if}
	</div>
	<div>{formatSize(item.node.size)}</div>
	<div>{item.node.kind}</div>
</TreeItem>
