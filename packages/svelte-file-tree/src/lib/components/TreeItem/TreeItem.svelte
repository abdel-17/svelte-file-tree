<script lang="ts">
	import { composeEventHandlers } from "$lib/internal/helpers.svelte.js";
	import { getTreeContext } from "../Tree/Tree.svelte";
	import { getTreeItemContext } from "../Tree/TreeItemContextProvider.svelte";
	import { TreeItemAttributes } from "./state.svelte.js";
	import type { TreeItemProps } from "./types.js";

	const itemContext = getTreeItemContext();
	const treeContext = getTreeContext();

	let {
		children,
		editable = false,
		disabled = false,
		element = $bindable(null),
		onfocusin,
		onkeydown,
		onclick,
		ondragstart,
		ondragover,
		ondragleave,
		ondrop,
		ondragend,
		...rest
	}: TreeItemProps = $props();

	$effect(() => {
		treeContext.onSetItem(itemContext);
	});

	$effect(() => {
		return () => {
			itemContext.onDestroy();
			treeContext.onDestroyItem(itemContext.node.id);
		};
	});

	const attributes = new TreeItemAttributes({
		treeContext,
		itemContext,
		editable: () => editable,
		disabled: () => disabled,
	});
</script>

<div
	bind:this={element}
	{...rest}
	id={attributes.id}
	role="treeitem"
	aria-selected={attributes.ariaSelected}
	aria-expanded={attributes.ariaExpanded}
	aria-level={attributes.ariaLevel}
	aria-posinset={attributes.ariaPosInSet}
	aria-setsize={attributes.ariaSetSize}
	tabindex={attributes.tabIndex}
	onfocusin={composeEventHandlers(onfocusin, attributes.onfocusin)}
	onkeydown={composeEventHandlers(onkeydown, attributes.onkeydown)}
	onclick={composeEventHandlers(onclick, attributes.onclick)}
	ondragstart={composeEventHandlers(ondragstart, attributes.ondragstart)}
	ondragover={composeEventHandlers(ondragover, attributes.ondragover)}
	ondragleave={composeEventHandlers(ondragleave, attributes.ondragleave)}
	ondrop={composeEventHandlers(ondrop, attributes.ondrop)}
	ondragend={composeEventHandlers(ondragend, attributes.ondragend)}
>
	{@render children()}
</div>
