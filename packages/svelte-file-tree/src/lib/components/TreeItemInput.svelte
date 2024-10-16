<script lang="ts">
	import { getContext, hasContext } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { composeHandlers, keys } from "$lib/helpers.js";
	import { TreeItemContext } from "./TreeItem.svelte";

	interface Props extends HTMLInputAttributes {
		onCommit?: (value: string) => void;
	}

	let {
		onCommit,
		value = $bindable(),
		onkeydown,
		onblur,
		...props
	}: Props = $props();

	if (!hasContext(TreeItemContext.key)) {
		throw new Error(
			"<TreeItemInput> must be used within a <TreeItem> component.",
		);
	}
	const itemContext: TreeItemContext = getContext(TreeItemContext.key);

	const originalValue = value;
	let cancelled = false;

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === keys.ESCAPE) {
			cancelled = true;
			value = originalValue;
		}
	}

	function handleBlur() {
		if (!cancelled && value !== originalValue) {
			// Use the value from the input directly because the bound value
			// may not be a string, depending on the `type` attribute.
			onCommit?.(itemContext.input!.value);
		}

		itemContext.editing = false;
	}
</script>

<input
	{...props}
	bind:this={itemContext.input}
	bind:value
	data-tree-item-input=""
	onkeydown={composeHandlers(handleKeyDown, onkeydown)}
	onblur={composeHandlers(handleBlur, onblur)}
/>
