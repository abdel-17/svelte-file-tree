<script lang="ts">
	import type { Action } from "svelte/action";
	import type { EventHandler } from "svelte/elements";
	import { getTreeContext, getTreeItemProviderContext } from "../Tree/context.svelte.js";
	import { getTreeItemContext } from "../TreeItem/context.svelte.js";
	import type { TreeItemInputProps } from "./types.js";

	const { renameItem } = getTreeContext();
	const { node, parent } = getTreeItemProviderContext();
	const { onEditingChange } = getTreeItemContext();

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

		onEditingChange(true);
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (event) => {
		onkeydown?.(event);

		switch (event.key) {
			case "Enter": {
				if (name === node.current.name) {
					node.current.element?.focus();
					break;
				}

				const renamed = renameItem({
					node: node.current,
					name,
					parent: parent.current,
				});
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

		onEditingChange(false);
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
