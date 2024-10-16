<script lang="ts">
	import { getContext, hasContext } from "svelte";
	import type { EventHandler, HTMLInputAttributes } from "svelte/elements";
	import { composeHandlers, keys } from "$lib/helpers.js";
	import { TreeItemContext } from "./TreeItem.svelte";

	interface Props extends HTMLInputAttributes {
		ref?: HTMLInputElement;
		onCommit?: (value: string) => void;
	}

	let {
		ref = $bindable(),
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

	function focus(element: HTMLInputElement) {
		element.focus();
	}

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (
		event,
	) => {
		if (event.key === keys.ESCAPE) {
			value = originalValue;
		}
	};

	const handleBlur: EventHandler<FocusEvent, HTMLInputElement> = (event) => {
		if (onCommit !== undefined && value !== originalValue) {
			// Use the value from the input directly because the bound value
			// may not be a string, depending on the `type` attribute.
			onCommit(event.currentTarget.value);
		}

		itemContext.editing = false;
	};
</script>

<input
	{...props}
	bind:this={ref}
	bind:value
	data-tree-item-input=""
	use:focus
	onkeydown={composeHandlers(handleKeyDown, onkeydown)}
	onblur={composeHandlers(handleBlur, onblur)}
/>
