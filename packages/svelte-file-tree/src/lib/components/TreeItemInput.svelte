<script lang="ts">
	import { getContext, hasContext } from "svelte";
	import type { EventHandler, HTMLInputAttributes } from "svelte/elements";
	import { composeHandlers, keys } from "$lib/helpers.js";
	import { TreeItemContext } from "./TreeItem.svelte";
	import { TreeViewContext } from "./TreeView.svelte";

	interface Props extends HTMLInputAttributes {
		value: any;
		ref?: HTMLInputElement;
		onCommit?: (value: string) => void;
	}

	let {
		value = $bindable(),
		ref = $bindable(),
		onCommit,
		onkeydown,
		onblur,
		...props
	}: Props = $props();

	const originalValue = value;

	if (!hasContext(TreeItemContext.key)) {
		throw new Error(
			"<TreeItemInput> must be used within a <TreeItem> component.",
		);
	}
	const itemContext: TreeItemContext = getContext(TreeItemContext.key);
	const treeContext: TreeViewContext = getContext(TreeViewContext.key);

	function enterEditingMode(element: HTMLInputElement) {
		// Prevent selection from being cleared when focus switches
		// from the item to the input.
		treeContext.shouldClearSelectionOnNextFocusOut = false;
		element.focus();
	}

	function exitEditingMode() {
		// Prevent selection from being cleared when focus switches
		// from the input back to the item.
		treeContext.shouldClearSelectionOnNextFocusOut = false;

		// If the item was not selected before, don't select it now.
		if (!itemContext.node.selected) {
			treeContext.shouldSelectOnNextFocus = false;
		}

		itemContext.editing = false;
		treeContext.findItemElement(itemContext.node.id).focus();
	}

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (
		event,
	) => {
		switch (event.key) {
			case keys.ENTER: {
				exitEditingMode();
				break;
			}
			case keys.ESCAPE: {
				value = originalValue;
				exitEditingMode();
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
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
	use:enterEditingMode
	onkeydown={composeHandlers(handleKeyDown, onkeydown)}
	onblur={composeHandlers(handleBlur, onblur)}
/>
