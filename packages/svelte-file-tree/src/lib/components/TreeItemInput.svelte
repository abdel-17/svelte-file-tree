<script lang="ts">
	import { composeEventHandlers } from "$lib/helpers/events.js";
	import { keys } from "$lib/helpers/keys.js";
	import { getContext, hasContext } from "svelte";
	import type { EventHandler, HTMLInputAttributes } from "svelte/elements";
	import { TreeItemContext } from "./context.svelte.js";

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

	function init(input: HTMLInputElement) {
		input.focus();
		input.select();
	}

	function exitEditingMode() {
		itemContext.editing = false;
		itemContext.findTreeItemElement().focus();
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

	// If we use the blur event to exit editing mode, the input gets unmounted
	// before the focusout event is dispatched, which needs to happen for the
	// selection state to be correct.
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
	use:init
	onkeydown={composeEventHandlers(handleKeyDown, onkeydown)}
	onfocusout={composeEventHandlers(handleFocusOut, onfocusout)}
/>
