<script lang="ts">
	import type { Action } from "svelte/action";
	import type { EventHandler, HTMLInputAttributes } from "svelte/elements";
	import { getTreeItemContext } from "./TreeItemContextProvider.svelte";

	const { itemState } = getTreeItemContext();

	interface Props extends Omit<HTMLInputAttributes, "children"> {
		value?: string;
		element?: HTMLInputElement | null;
		onRename?: (name: string) => void;
		onDiscard?: () => void;
		onDuplicateError?: (name: string) => void;
	}

	let {
		value = $bindable(itemState.node.name),
		element = $bindable(null),
		onRename,
		onDiscard,
		onDuplicateError,
		onkeydown,
		onfocus,
		onblur,
		...attributes
	}: Props = $props();

	let changed = false;

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (event) => {
		onkeydown?.(event);

		switch (event.key) {
			case "Enter": {
				if (value.length === 0) {
					break;
				}

				const { node } = itemState;
				if (node.name === value) {
					itemState.getElement()?.focus();
					break;
				}

				const duplicated = node.siblings.some(
					(sibling) => sibling !== node && sibling.name === value,
				);
				if (duplicated) {
					onDuplicateError?.(value);
					break;
				}

				node.name = value;
				changed = true;
				itemState.getElement()?.focus();
				onRename?.(value);
				break;
			}
			case "Escape": {
				itemState.getElement()?.focus();
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	const handleFocus: EventHandler<FocusEvent, HTMLInputElement> = (event) => {
		onfocus?.(event);

		itemState.editing = true;
	};

	const handleBlur: EventHandler<FocusEvent, HTMLInputElement> = (event) => {
		onblur?.(event);

		itemState.editing = false;
		if (!changed) {
			onDiscard?.();
		}
	};

	const init: Action<HTMLInputElement> = (input) => {
		input.focus();
		input.select();
	};
</script>

<input
	{...attributes}
	bind:this={element}
	bind:value
	onkeydown={handleKeyDown}
	onfocus={handleFocus}
	onblur={handleBlur}
	use:init
/>
