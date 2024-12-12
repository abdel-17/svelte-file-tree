<script lang="ts">
	import type { Action } from "svelte/action";
	import type { EventHandler, HTMLInputAttributes } from "svelte/elements";
	import { getTreeItemContext } from "./TreeItem.svelte";

	const { treeState, getNode, onEditingChange } = getTreeItemContext();
	const node = $derived.by(getNode);

	interface Props extends Omit<HTMLInputAttributes, "children"> {
		value?: string;
		element?: HTMLInputElement | null;
		onRename?: (name: string) => void;
		onDiscard?: () => void;
		onDuplicateError?: (name: string) => void;
	}

	let {
		value = $bindable(node.name),
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

				if (node.name === value) {
					treeState.getItemElement(node)?.focus();
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
				treeState.getItemElement(node)?.focus();
				onRename?.(value);
				break;
			}
			case "Escape": {
				treeState.getItemElement(node)?.focus();
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

		onEditingChange(true);
	};

	const handleBlur: EventHandler<FocusEvent, HTMLInputElement> = (event) => {
		onblur?.(event);

		onEditingChange(false);
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
