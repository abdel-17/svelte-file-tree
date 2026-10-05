<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";
	import type { FlatTreeItem } from "./flat-tree.js";
	import { get_tree_context } from "./Tree.svelte";

	export interface TreeItemProps<T> extends HTMLAttributes<HTMLDivElement> {
		item: FlatTreeItem<T>,
		index: number,
		selected: boolean,
		expanded: boolean,
		disabled?: boolean,
		ref?: HTMLDivElement | null,
	};
</script>

<script lang="ts" generics="T">
	let {
		item,
		index,
		selected,
		expanded,
		disabled = false,
		ref = $bindable(null),
		children,
		...rest
	}: TreeItemProps<T> = $props();

	const context = get_tree_context<T>();

	$effect.pre(() => {
		if (context.get_tabbable_id() === undefined) {
			context.set_tabbable_id(item.id);
		}
	});

	$effect(() => {
		return () => {
			if (context.get_tabbable_id() === item.id) {
				context.set_tabbable_id(undefined);
			}
		};
	});
</script>

<div
	{...rest}
	bind:this={ref}
	role="treeitem"
	id={context.get_item_element_id_prefix() + item.id}
	data-index={index}
	tabindex={context.get_tabbable_id() === item.id ? 0 : -1}
	aria-selected={selected}
	aria-expanded={context.has_children(item.data) ? expanded : undefined}
	aria-disabled={disabled}
	aria-level={item.depth + 1}
	aria-posinset={item.parent_children_index + 1}
	aria-setsize={item.parent_children.length}
>
	{@render children?.()}
</div>
