<script lang="ts">
	import { TreeContext, TreeItemProviderContext } from "../Tree/context.js";
	import { TreeItemContext } from "../TreeItem/context.js";
	import { createTreeItemInputState } from "./state.js";
	import type { TreeItemInputProps } from "./types.js";

	const { setEditing } = TreeItemContext.get();
	const { node, index, parent } = TreeItemProviderContext.get();
	const { treeState } = TreeContext.get();

	let {
		name = $bindable(node().name),
		element = $bindable(null),
		onfocus,
		onkeydown,
		onblur,
		...attributes
	}: TreeItemInputProps = $props();

	const { onInit, handleFocus, handleKeyDown, handleBlur } = createTreeItemInputState({
		treeState,
		node,
		index,
		parent,
		setEditing,
		name: () => name,
		onfocus: (event) => {
			onfocus?.(event);
		},
		onkeydown: (event) => {
			onkeydown?.(event);
		},
		onblur: (event) => {
			onblur?.(event);
		},
	});
</script>

<input
	bind:this={element}
	{...attributes}
	bind:value={name}
	onfocus={handleFocus}
	onkeydown={handleKeyDown}
	onblur={handleBlur}
	use:onInit
/>
