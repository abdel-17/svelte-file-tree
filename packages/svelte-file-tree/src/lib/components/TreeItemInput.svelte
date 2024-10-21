<script lang="ts">
	import { composeEventHandlers } from "$lib/helpers/events.js";
	import { keys } from "$lib/helpers/keys.js";
	import { getContext, hasContext } from "svelte";
	import type { EventHandler, HTMLInputAttributes } from "svelte/elements";
	import { TreeItemContext } from "./context.svelte.js";

	interface Props extends HTMLInputAttributes {
		value: any;
		ref?: HTMLInputElement | null;
		onCommit?: (value: any) => void;
		onRollback?: (originalValue: any) => void;
	}

	let {
		value = $bindable(),
		ref = $bindable(null),
		onCommit,
		onRollback,
		onkeydown,
		onfocusout,
		...props
	}: Props = $props();

	if (!hasContext(TreeItemContext.key)) {
		throw new Error(
			"<TreeItemInput> must be used within a <TreeItem> component.",
		);
	}
	const itemContext: TreeItemContext = getContext(TreeItemContext.key);

	const originalValue = value;
	let commited = false;

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (
		event,
	) => {
		switch (event.key) {
			case keys.ENTER: {
				commited = true;
				if (value !== originalValue) {
					onCommit?.(value);
				}
				itemContext.node.findElement().focus();

				break;
			}
			case keys.ESCAPE: {
				itemContext.node.findElement().focus();

				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	// If we use the blur event to exit editing mode, the input gets unmounted
	// before the focusout event is dispatched, which the tree item relies on
	// to manage selection state.
	const handleFocusOut: EventHandler<FocusEvent, HTMLInputElement> = () => {
		itemContext.editing = false;
	};

	function init(input: HTMLInputElement) {
		input.focus();
		input.select();

		return {
			destroy() {
				if (!commited && value !== originalValue) {
					value = originalValue;
					onRollback?.(originalValue);
				}
			},
		};
	}
</script>

<input
	{...props}
	bind:this={ref}
	bind:value
	data-tree-item-input=""
	onkeydown={composeEventHandlers(handleKeyDown, onkeydown)}
	onfocusout={composeEventHandlers(handleFocusOut, onfocusout)}
	use:init
/>
