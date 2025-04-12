<script lang="ts">
	import { composeEventHandlers, formatSize } from "$lib/utils.js";
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import { TreeItem, type TreeItemProps } from "svelte-file-tree";
	import type { EventHandler } from "svelte/elements";
	import type { ContextMenuTarget, FileDropToastTarget } from "./state.svelte.js";
	import type { TreeItemState, UploadFilesArgs } from "./types.js";

	interface Props extends Omit<TreeItemProps, "children"> {
		item: TreeItemState;
		fileDropToastTarget: FileDropToastTarget | undefined;
		onFileDropToastTargetChange: (value: FileDropToastTarget) => void;
		onDismissFileDropToast: () => void;
		onExpand: (target: TreeItemState) => void;
		onCollapse: (target: TreeItemState) => void;
		onRename: (target: TreeItemState) => void;
		onContextMenuTargetChange: (value: ContextMenuTarget) => void;
		onUploadFiles: (args: UploadFilesArgs) => void;
		onCleanup: (target: TreeItemState) => void;
	}

	let {
		item,
		fileDropToastTarget,
		onFileDropToastTargetChange,
		onDismissFileDropToast,
		onExpand,
		onCollapse,
		onRename,
		onContextMenuTargetChange,
		onUploadFiles,
		onCleanup,
		ref = $bindable(null),
		class: className,
		onkeydown,
		oncontextmenu,
		ondragover,
		ondrop,
		...rest
	}: Props = $props();

	const isFileDropToastTarget = $derived(
		fileDropToastTarget?.type === "item" && fileDropToastTarget.item() === item,
	);

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
		if (item.disabled) {
			return;
		}

		if (event.key === "F2") {
			onRename(item);
			event.preventDefault();
		}
	};

	const handleContextMenu: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		if (item.disabled) {
			event.preventDefault();
			return;
		}

		onContextMenuTargetChange({
			type: "item",
			item: () => item,
		});
	};

	const handleDragOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		if (!event.dataTransfer?.types.includes("Files")) {
			return;
		}

		event.preventDefault();

		if (item.disabled || item.node.type === "file") {
			onDismissFileDropToast();
			return;
		}

		onFileDropToastTargetChange({
			type: "item",
			item: () => item,
		});
	};

	const handleDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		const files = event.dataTransfer?.files;
		if (files === undefined || files.length === 0) {
			return;
		}

		onDismissFileDropToast();
		event.preventDefault();

		if (item.disabled || item.node.type === "file") {
			return;
		}

		onUploadFiles({
			target: item.node,
			files,
		});
	};

	const handleToggleClick: EventHandler<MouseEvent, HTMLButtonElement> = (event) => {
		if (item.disabled) {
			return;
		}

		if (item.expanded) {
			onCollapse(item);
		} else {
			onExpand(item);
		}

		ref!.focus();
		event.stopPropagation();
	};

	$effect(() => {
		return () => {
			onCleanup(item);
		};
	});
</script>

<TreeItem
	{...rest}
	bind:ref
	class={({ dropPosition }) => [
		"relative grid grid-cols-(--grid-cols) gap-x-(--grid-gap) rounded-md p-(--grid-inline-padding) hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300 aria-selected:has-[+[aria-selected='true']]:rounded-b-none aria-selected:[&+[aria-selected='true']]:rounded-t-none",
		{
			"opacity-50": item.dragged,
			"before:pointer-events-none before:absolute before:-inset-0 before:rounded-[inherit] before:border-2":
				dropPosition !== undefined || isFileDropToastTarget,
			"before:border-neutral-300 before:border-t-red-500": dropPosition === "before",
			"before:border-neutral-300 before:border-b-red-500": dropPosition === "after",
			"before:border-red-500": dropPosition === "inside" || isFileDropToastTarget,
		},
		className,
	]}
	onkeydown={composeEventHandlers(onkeydown, handleKeyDown)}
	oncontextmenu={composeEventHandlers(oncontextmenu, handleContextMenu)}
	ondragover={composeEventHandlers(ondragover, handleDragOver)}
	ondrop={composeEventHandlers(ondrop, handleDrop)}
>
	<div
		class="flex items-center"
		style="padding-inline-start: calc(var(--spacing) * {item.depth * 6})"
	>
		<button
			type="button"
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

		<span>{item.node.name}</span>
	</div>
	<div>{formatSize(item.node.size)}</div>
	<div>{item.node.kind}</div>
</TreeItem>
