<script lang="ts">
	import { composeEventHandlers } from "$lib/internal/helpers.svelte.js";
	import { TreeContext, TreeItemProviderContext } from "../Tree/context.js";
	import { TreeItemContext } from "./context.js";
	import { createTreeItemState } from "./state.svelte.js";
	import type { TreeItemChildrenSnippetProps, TreeItemProps } from "./types.js";

	const { node, index, depth, parent } = TreeItemProviderContext.get();
	const { treeState } = TreeContext.get();

	let {
		children,
		editable = false,
		editing = $bindable(false),
		element = $bindable(null),
		class: className,
		style,
		onfocusin,
		onkeydown,
		onpointerdown,
		ondragstart,
		ondragover,
		ondragleave,
		ondrop,
		ondragend,
		...attributes
	}: TreeItemProps = $props();

	const setEditing = (value: boolean): void => {
		editing = value;
	};

	const {
		treeItemId,
		ariaSelected,
		ariaExpanded,
		ariaLevel,
		ariaPosInSet,
		ariaSetSize,
		tabIndex,
		dragged,
		dropPosition,
		handleFocusIn,
		handleKeyDown,
		handlePointerDown,
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd,
	} = createTreeItemState({
		treeState,
		node,
		index,
		depth,
		parent,
		editable: () => editable,
		setEditing,
	});

	TreeItemContext.set({ setEditing });

	const childrenProps: TreeItemChildrenSnippetProps = $derived({
		editing,
		dragged: dragged(),
		dropPosition: dropPosition(),
	});
</script>

<div
	bind:this={element}
	{...attributes}
	id={treeItemId()}
	role="treeitem"
	aria-selected={ariaSelected()}
	aria-expanded={ariaExpanded()}
	aria-level={ariaLevel()}
	aria-posinset={ariaPosInSet()}
	aria-setsize={ariaSetSize()}
	tabindex={tabIndex()}
	class={typeof className === "function" ? className(childrenProps) : className}
	style={typeof style === "function" ? style(childrenProps) : style}
	onfocusin={composeEventHandlers(onfocusin, handleFocusIn)}
	onkeydown={composeEventHandlers(onkeydown, handleKeyDown)}
	onpointerdown={composeEventHandlers(onpointerdown, handlePointerDown)}
	ondragstart={composeEventHandlers(ondragstart, handleDragStart)}
	ondragover={composeEventHandlers(ondragover, handleDragOver)}
	ondragleave={composeEventHandlers(ondragleave, handleDragLeave)}
	ondrop={composeEventHandlers(ondrop, handleDrop)}
	ondragend={composeEventHandlers(ondragend, handleDragEnd)}
>
	{@render children(childrenProps)}
</div>
