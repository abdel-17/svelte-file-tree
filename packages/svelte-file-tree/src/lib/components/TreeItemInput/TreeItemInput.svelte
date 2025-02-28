<script lang="ts">
	import { composeEventHandlers } from "$lib/internal/helpers.svelte.js";
	import { getTreeContext } from "../Tree/Tree.svelte";
	import { getTreeItemProviderContext } from "../Tree/TreeItemProvider.svelte";
	import { getTreeItemContext } from "../TreeItem/TreeItem.svelte";
	import { TreeItemInputAttributes } from "./state.svelte.js";
	import type { TreeItemInputProps } from "./types.js";

	const itemContext = getTreeItemContext();
	const itemProviderContext = getTreeItemProviderContext();
	const treeContext = getTreeContext();

	let {
		name = $bindable(itemProviderContext.node.name),
		element = $bindable(null),
		onfocus,
		onkeydown,
		onblur,
		...rest
	}: TreeItemInputProps = $props();

	const attributes = new TreeItemInputAttributes({
		treeContext,
		itemProviderContext,
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
