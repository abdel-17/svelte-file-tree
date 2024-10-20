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
		onfocusout,
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

	function focus(input: HTMLInputElement) {
		input.focus();
	}

	function exitEditingMode() {
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

	// If we user the blur event to exit editing mode, the input gets unmounted
	// before the focusout evnet is dispatched, which the tree item relies on
	// for focus management, so we use the focusout event instead.
	const handleFocusOut: EventHandler<FocusEvent, HTMLInputElement> = (
		event,
	) => {
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
	onfocusout={composeHandlers(handleFocusOut, onblur)}
/>
