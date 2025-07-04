<script lang="ts">
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import type { FocusEventHandler, KeyboardEventHandler, MouseEventHandler } from "svelte/elements";
	import { TreeItem } from "svelte-file-tree";
	import type { TreeItemProps } from "./types.js";

	const {
		item,
		isDropDestination,
		isBorderAnimationTarget,
		onDragLeave,
		onExpand,
		onCollapse,
		onRename,
	}: TreeItemProps = $props();

	let ref: HTMLDivElement | null = $state.raw(null);
	let dragged = $state.raw(false);
	let editing = $state.raw(false);

	function onDragStart() {
		dragged = true;
	}

	function onDragEnd() {
		dragged = false;
	}

	const onKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
		if (event.key === "F2") {
			event.preventDefault();
			editing = true;
		}
	};

	const onToggleClick: MouseEventHandler<SVGElement> = (event) => {
		event.preventDefault();

		if (item.expanded) {
			onCollapse(item);
		} else {
			onExpand(item);
		}
	};

	function onInputInit(input: HTMLInputElement) {
		input.focus();
		input.select();
	}

	const onInputKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
		switch (event.key) {
			case "Enter": {
				const didRename = onRename(item, event.currentTarget.value);
				if (didRename) {
					editing = false;
					ref!.focus();
				}
				break;
			}
			case "Escape": {
				editing = false;
				ref!.focus();
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	const onInputBlur: FocusEventHandler<HTMLInputElement> = () => {
		editing = false;
	};
</script>

<TreeItem
	{item}
	{onDragLeave}
	bind:ref
	data-dragged={dragged ? true : undefined}
	data-drop-destination={isDropDestination ? true : undefined}
	data-animation-target={isBorderAnimationTarget ? true : undefined}
	class="group relative flex items-center bg-white p-3 before:pointer-events-none before:absolute before:inset-0 before:border-2 before:border-transparent before:transition-colors after:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-transparent after:transition-colors hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300 data-animation-target:after:border-pink-500 data-animation-target:after:bg-pink-500/10 data-dragged:opacity-50 data-drop-destination:before:border-red-500"
	style="padding-inline-start: calc(var(--spacing) * {item.depth * 6} + var(--spacing) * 3)"
	ondragstart={onDragStart}
	ondragend={onDragEnd}
	onkeydown={onKeyDown}
>
	<ChevronDownIcon
		role="presentation"
		size={20}
		data-invisible={item.node.type === "file" ? true : undefined}
		class="rounded-full transition-transform duration-200 group-aria-expanded:-rotate-90 hover:bg-current/8 active:bg-current/12 data-invisible:invisible"
		onclick={onToggleClick}
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

	{#if editing}
		<input
			value={item.node.name}
			autocomplete="off"
			class="bg-white text-black focus-visible:outline-2 focus-visible:outline-current"
			onkeydown={onInputKeyDown}
			onblur={onInputBlur}
			{@attach onInputInit}
		/>
	{:else}
		<span>{item.node.name}</span>
	{/if}
</TreeItem>
