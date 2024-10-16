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

	function findItemElement(): HTMLElement {
		return treeContext.findItemElement(itemContext.node.id);
	}

	function enterEditingMode(input: HTMLInputElement) {
		// Prevent selection from being cleared when focus switches
		// from the item to the input.
		const itemElement = findItemElement();
		if (itemElement === document.activeElement) {
			treeContext.shouldClearSelectionOnNextBlur = false;
		}

		input.focus();
	}

	function exitEditingMode(input: HTMLInputElement) {
		// If the item was not selected before, don't select it now.
		if (!itemContext.node.selected) {
			treeContext.shouldSelectOnNextFocus = false;
		}

		// Prevent selection from being cleared when focus switches
		// from the input to the item.
		if (input === document.activeElement) {
			treeContext.shouldClearSelectionOnNextBlur = false;
		}

		itemContext.editing = false;
		findItemElement().focus();
	}

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (
		event,
	) => {
		const input = event.currentTarget;
		switch (event.key) {
			case keys.ENTER: {
				exitEditingMode(input);
				break;
			}
			case keys.ESCAPE: {
				value = originalValue;
				exitEditingMode(input);
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

		treeContext.onBlur();
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
