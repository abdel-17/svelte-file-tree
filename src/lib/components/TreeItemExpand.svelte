<script lang="ts" strictEvents>
	import type { HTMLAttributes } from "svelte/elements";
	import { getTreeItemContext } from "./TreeItem.svelte";
	import { getTreeContext } from "./TreeView.svelte";

	type $$Props = HTMLAttributes<HTMLDivElement>;

	const { expandedIds } = getTreeContext();
	const { id } = getTreeItemContext();

	function handleClick(event: MouseEvent) {
		if (event.defaultPrevented) {
			return;
		}

		expandedIds.toggle($id);
		event.stopPropagation();
	}
</script>

<div
	role="presentation"
	data-tree-item-expand
	{...$$restProps}
	on:click
	on:click={handleClick}
>
	<slot />
</div>
