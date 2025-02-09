<script lang="ts">
	import { composeEventHandlers } from "$lib/internal/helpers.js";
	import { TreeContext, TreeItemProviderContext } from "../Tree/context.js";
	import { TreeItemContext } from "./context.js";
	import { createTreeItemState } from "./state.svelte.js";
	import type { TreeItemProps } from "./types.js";

	const { node, index, depth, parent } = TreeItemProviderContext.get();
	const { treeState } = TreeContext.get();

	let {
		children,
		editable = false,
		editing = $bindable(false),
		element = $bindable(null),
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
	onfocusin={composeEventHandlers(onfocusin, handleFocusIn)}
	onkeydown={composeEventHandlers(onkeydown, handleKeyDown)}
	onpointerdown={composeEventHandlers(onpointerdown, handlePointerDown)}
	ondragstart={composeEventHandlers(ondragstart, handleDragStart)}
	ondragover={composeEventHandlers(ondragover, handleDragOver)}
	ondragleave={composeEventHandlers(ondragleave, handleDragLeave)}
	ondrop={composeEventHandlers(ondrop, handleDrop)}
	ondragend={composeEventHandlers(ondragend, handleDragEnd)}
>
	{@render children({
		editing,
		dragged: dragged(),
		dropPosition: dropPosition(),
	})}
</div>
