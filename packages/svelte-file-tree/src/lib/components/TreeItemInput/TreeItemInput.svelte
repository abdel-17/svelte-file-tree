<script lang="ts">
	import { composeEventHandlers } from "$lib/internal/helpers.svelte.js";
	import { getTreeContext } from "../Tree/Tree.svelte";
	import { getTreeItemContext } from "../Tree/TreeItemContextProvider.svelte";
	import { TreeItemInputAttributes } from "./state.svelte.js";
	import type { TreeItemInputProps } from "./types.js";

	const itemContext = getTreeItemContext();
	const treeContext = getTreeContext();

	let {
		name = $bindable(itemContext.node.name),
		element = $bindable(null),
		onfocus,
		onkeydown,
		onblur,
		...rest
	}: TreeItemInputProps = $props();

	const attributes = new TreeItemInputAttributes({
		treeContext,
		itemContext,
		name: () => name,
	});
</script>

<input
	bind:this={element}
	{...rest}
	bind:value={name}
	onfocus={composeEventHandlers(onfocus, attributes.onfocus)}
	onkeydown={composeEventHandlers(onkeydown, attributes.onkeydown)}
	onblur={composeEventHandlers(onblur, attributes.onblur)}
	use:attributes.onMount
/>
