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
	import { composeEventHandlers, noop } from "$lib/helpers.js";
	import type { DefaultTFolder, FileNode, FileTree, FolderNode } from "$lib/tree.svelte.js";
	import { getTreeContext } from "./context.js";
	import type { TreeItemProps } from "./types.js";

	const context = getTreeContext<TFile, TFolder, TTree>();

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
		context.onFocusIn(item, event);
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
		context.onKeyDown(item, event);
	};

	const handleClick: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		context.onClick(item, event);
	};

	$effect(() => {
		return draggable({
			element: ref!,
			getInitialData: () => context.getDragData(item.node.id),
			canDrag: (args) => context.canDrag(item, args),
			onDragStart: (args) => {
				context.onDragStart(item, args);
			},
		});
	});

	$effect(() => {
		return dropTargetForElements({
			element: ref!,
			getData: () => context.getDragData(item.node.id),
			canDrop: (args) => context.canDrop(item, args),
			onDragEnter: (args) => {
				const source = context.getItemFromDragData(args.source.data);
				if (source === undefined) {
					return;
				}

				onDragEnter({
					type: "item",
					input: args.location.current.input,
					source,
					destination: context.getDropDestination(item),
				});
			},
			onDragLeave: (args) => {
				const source = context.getItemFromDragData(args.source.data);
				if (source === undefined) {
					return;
				}

				onDragLeave({
					type: "item",
					input: args.location.current.input,
					source,
					destination: context.getDropDestination(item),
				});
			},
			onDrag: (args) => {
				const source = context.getItemFromDragData(args.source.data);
				if (source === undefined) {
					return;
				}

				onDrag({
					type: "item",
					input: args.location.current.input,
					source,
					destination: context.getDropDestination(item),
				});
			},
			onDrop: (args) => {
				const source = context.getItemFromDragData(args.source.data);
				if (source === undefined) {
					return;
				}

				onDrop({
					type: "item",
					input: args.location.current.input,
					source,
					destination: context.getDropDestination(item),
				});
			},
		});
	});

	$effect(() => {
		return dropTargetForExternal({
			element: ref!,
			getData: () => context.getDragData(item.node.id),
			onDragEnter: (args) => {
				onDragEnter({
					type: "external",
					input: args.location.current.input,
					items: args.source.items,
					destination: context.getDropDestination(item),
				});
			},
			onDragLeave: (args) => {
				onDragLeave({
					type: "external",
					input: args.location.current.input,
					items: args.source.items,
					destination: context.getDropDestination(item),
				});
			},
			onDrag: (args) => {
				onDrag({
					type: "external",
					input: args.location.current.input,
					items: args.source.items,
					destination: context.getDropDestination(item),
				});
			},
			onDrop: (args) => {
				onDrop({
					type: "external",
					input: args.location.current.input,
					items: args.source.items,
					destination: context.getDropDestination(item),
				});
			},
		});
	});

	$effect(() => {
		return () => {
			context.onDestroyItem(item);
		};
	});
</script>

<div
	{...rest}
	bind:this={ref}
	id={context.getItemElementId(item.node.id)}
	role="treeitem"
	aria-selected={item.selected}
	aria-expanded={item.node.type === "folder" && item.node.children.length !== 0
		? item.expanded
		: undefined}
	aria-level={item.depth + 1}
	aria-posinset={item.index + 1}
	aria-setsize={item.parent?.node.children.length ?? context.root().children.length}
	tabindex={context.tabbableId() === item.node.id ? 0 : -1}
	onfocusin={composeEventHandlers(onfocusin, handleFocusIn)}
	onkeydown={composeEventHandlers(onkeydown, handleKeyDown)}
	onclick={composeEventHandlers(onclick, handleClick)}
>
	{@render children()}
</div>
