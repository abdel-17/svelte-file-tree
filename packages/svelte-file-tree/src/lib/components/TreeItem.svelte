<script lang="ts" generics="T">
	import { get_tree_state } from "./Tree.svelte";
	import type { TreeItemProps } from "./types.js";

	let {
		item,
		ref = $bindable(null),
		children,
		onfocusin,
		onkeydown,
		onclick,
		...rest
	}: TreeItemProps<T> = $props();

	const tree_state = get_tree_state<T>();
	const item_state = tree_state.create_item_state(() => item);
</script>

<div
	{...rest}
	bind:this={ref}
	id={item.elementId}
	role="treeitem"
	tabindex={tree_state.tabbable_id() === item.id ? 0 : -1}
	aria-selected={item.selected}
	aria-expanded={item.hasChildren ? item.expanded : undefined}
	aria-disabled={item.disabled}
	aria-level={item.depth + 1}
	aria-posinset={item.indexInChildren + 1}
	aria-setsize={item.parentChildren.length}
	onfocusin={(event) => {
		onfocusin?.(event);
		item_state.onfocusin(event);
	}}
	onkeydown={(event) => {
		onkeydown?.(event);
		item_state.onkeydown(event);
	}}
	onclick={(event) => {
		onclick?.(event);
		item_state.onclick(event);
	}}
>
	{@render children?.()}
</div>
