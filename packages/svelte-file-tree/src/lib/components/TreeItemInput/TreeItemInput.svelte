<script lang="ts">
	import { composeEventHandlers } from "$lib/internal/helpers.svelte.js";
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
		onkeydown,
		onfocus,
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
	});
</script>

<input
	bind:this={element}
	{...attributes}
	bind:value={name}
	onfocus={composeEventHandlers(onfocus, handleFocus)}
	onkeydown={composeEventHandlers(onkeydown, handleKeyDown)}
	onblur={composeEventHandlers(onblur, handleBlur)}
	use:onInit
/>
