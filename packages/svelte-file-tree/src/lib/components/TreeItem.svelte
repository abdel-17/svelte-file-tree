<script
	lang="ts"
	generics="TFile extends FileNode, TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>"
>
	import {
		draggable,
		dropTargetForElements,
	} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
	import type { EventHandler } from "svelte/elements";
	import { composeEventHandlers, noop } from "$lib/helpers.js";
	import type { DefaultTFolder, FileNode, FolderNode } from "$lib/tree.svelte.js";
	import { getTreeContext } from "./context.js";
	import type { TreeItemProps } from "./types.js";

	const context = getTreeContext<TFile, TFolder>();

	let {
		children,
		item,
		ref = $bindable(null),
		onDragStart = noop,
		onDrop = noop,
		onfocusin,
		onkeydown,
		onclick,
		...rest
	}: TreeItemProps<TFile, TFolder> = $props();

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
			getInitialData: () => ({ id: item.node.id }),
			canDrag: (args) => context.canDrag(item, args),
			onDragStart: (args) => {
				context.onDragStart(item, args);
				onDragStart();
			},
			onDrop: () => onDrop(),
		});
	});

	$effect(() => {
		return dropTargetForElements({
			element: ref!,
			getData: () => ({ id: item.node.id }),
			canDrop: (args) => {
				const canDrop = context.canDrop(item, args);
				Object.defineProperty(args.input, "__canDrop", {
					value: canDrop,
					configurable: true,
				});
				return canDrop;
			},
		});
	});

	$effect(() => {
		return () => context.onDestroyItem(item);
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
