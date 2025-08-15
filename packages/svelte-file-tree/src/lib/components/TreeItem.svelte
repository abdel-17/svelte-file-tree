<script
	lang="ts"
	generics="TFile extends FileNode = FileNode, TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>, TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>"
>
	import {
		draggable,
		dropTargetForElements,
	} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
	import { dropTargetForExternal } from "@atlaskit/pragmatic-drag-and-drop/external/adapter";
	import type { EventHandler } from "svelte/elements";
	import { noop } from "$lib/internal/helpers.js";
	import type { DefaultTFolder, FileNode, FileTree, FolderNode } from "$lib/tree.svelte.js";
	import { getTreeContext } from "./Tree.svelte";
	import { DragData } from "./data.js";
	import type { TreeItemProps } from "./types.js";

	const treeContext = getTreeContext<TFile, TFolder, TTree>();

	let {
		children,
		item,
		ref = $bindable(null),
		onDragEnter = noop,
		onDragLeave = noop,
		onDrag = noop,
		onDrop = noop,
		onfocusin,
		onkeydown,
		onclick,
		...rest
	}: TreeItemProps<TFile, TFolder, TTree> = $props();

	const handleFocusIn: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		onfocusin?.(event);
		treeContext.onFocusIn(item, event);
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
		onkeydown?.(event);
		treeContext.onKeyDown(item, event);
	};

	const handleClick: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		onclick?.(event);
		treeContext.onClick(item, event);
	};

	function getItem() {
		return item;
	}

	function getDragData() {
		return new DragData(getItem);
	}

	$effect(() => {
		return draggable({
			element: ref!,
			getInitialData: getDragData,
			canDrag: (args) => treeContext.canDrag(item, args),
			onDragStart: (args) => {
				treeContext.onDragStart(item, args);
			},
		});
	});

	$effect(() => {
		return dropTargetForElements({
			element: ref!,
			getData: getDragData,
			canDrop: (args) => treeContext.canDropElement(item, args),
			onDragEnter: (args) => {
				const dragData = args.source.data;
				if (!(dragData instanceof DragData)) {
					return;
				}
				const source = dragData.item();

				onDragEnter({
					type: "item",
					input: args.location.current.input,
					source,
					destination: treeContext.getDropDestination(item),
				});
			},
			onDragLeave: (args) => {
				const dragData = args.source.data;
				if (!(dragData instanceof DragData)) {
					return;
				}
				const source = dragData.item();

				onDragLeave({
					type: "item",
					input: args.location.current.input,
					source,
					destination: treeContext.getDropDestination(item),
				});
			},
			onDrag: (args) => {
				const dragData = args.source.data;
				if (!(dragData instanceof DragData)) {
					return;
				}
				const source = dragData.item();

				onDrag({
					type: "item",
					input: args.location.current.input,
					source,
					destination: treeContext.getDropDestination(item),
				});
			},
			onDrop: (args) => {
				const dragData = args.source.data;
				if (!(dragData instanceof DragData)) {
					return;
				}
				const source = dragData.item();

				onDrop({
					type: "item",
					input: args.location.current.input,
					source,
					destination: treeContext.getDropDestination(item),
				});
			},
		});
	});

	$effect(() => {
		return dropTargetForExternal({
			element: ref!,
			getData: getDragData,
			canDrop: (args) => treeContext.canDropExternal(item, args),
			onDragEnter: (args) => {
				onDragEnter({
					type: "external",
					input: args.location.current.input,
					items: args.source.items,
					destination: treeContext.getDropDestination(item),
				});
			},
			onDragLeave: (args) => {
				onDragLeave({
					type: "external",
					input: args.location.current.input,
					items: args.source.items,
					destination: treeContext.getDropDestination(item),
				});
			},
			onDrag: (args) => {
				onDrag({
					type: "external",
					input: args.location.current.input,
					items: args.source.items,
					destination: treeContext.getDropDestination(item),
				});
			},
			onDrop: (args) => {
				onDrop({
					type: "external",
					input: args.location.current.input,
					items: args.source.items,
					destination: treeContext.getDropDestination(item),
				});
			},
		});
	});

	$effect(() => {
		return () => {
			treeContext.onDestroyItem(item);
		};
	});
</script>

<div
	{...rest}
	bind:this={ref}
	id={treeContext.getItemElementId(item.node.id)}
	role="treeitem"
	aria-selected={item.selected}
	aria-expanded={item.node.type === "folder" && item.node.children.length !== 0
		? item.expanded
		: undefined}
	aria-level={item.depth + 1}
	aria-posinset={item.index + 1}
	aria-setsize={item.parent?.node.children.length ?? treeContext.root().children.length}
	aria-disabled={item.disabled}
	tabindex={treeContext.tabbableId() === item.node.id ? 0 : -1}
	onfocusin={handleFocusIn}
	onkeydown={handleKeyDown}
	onclick={handleClick}
>
	{@render children()}
</div>
