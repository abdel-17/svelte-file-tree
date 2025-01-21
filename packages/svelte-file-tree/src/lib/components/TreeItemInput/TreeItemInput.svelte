<script lang="ts">
	import type { Action } from "svelte/action";
	import type { EventHandler } from "svelte/elements";
	import { TreeContext, TreeItemProviderContext } from "../Tree/context.js";
	import { TreeItemContext } from "../TreeItem/context.js";
	import type { TreeItemInputProps } from "./types.js";

	const { editing } = TreeItemContext.get();
	const { node, parent } = TreeItemProviderContext.get();
	const { renameItem } = TreeContext.get();

	let {
		name = $bindable(node.current.name),
		element = $bindable(null),
		onkeydown,
		onfocus,
		onblur,
		...attributes
	}: TreeItemInputProps = $props();

	const handleFocus: EventHandler<FocusEvent, HTMLInputElement> = (event) => {
		onfocus?.(event);

		editing.current = true;
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (event) => {
		onkeydown?.(event);

		switch (event.key) {
			case "Enter": {
				const renamed = renameItem(node.current, name, parent.current);
				if (renamed) {
					node.current.element?.focus();
				}
				break;
			}
			case "Escape": {
				node.current.element?.focus();
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	const handleBlur: EventHandler<FocusEvent, HTMLInputElement> = (event) => {
		onblur?.(event);

		editing.current = false;
	};

	const init: Action<HTMLInputElement> = (input) => {
		input.focus();
		input.select();
	};
</script>

<input
	{...attributes}
	bind:this={element}
	bind:value={name}
	onfocus={handleFocus}
	onkeydown={handleKeyDown}
	onblur={handleBlur}
	use:init
/>
