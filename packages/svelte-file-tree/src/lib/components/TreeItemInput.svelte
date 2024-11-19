<script lang="ts">
	import type { Action } from "svelte/action";
	import type { EventHandler } from "svelte/elements";
	import type { TreeItemInputProps } from "./types.js";
	import { TreeItemContext } from "./context.svelte.js";

	let {
		value = $bindable(),
		element = $bindable(null),
		onCommit,
		onRollback,
		onkeydown,
		onblur,
		...attributes
	}: TreeItemInputProps = $props();

	const context = TreeItemContext.get();
	const initialValue = value;
	let committed = false;

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (
		event,
	) => {
		onkeydown?.(event);

		switch (event.key) {
			case "Enter": {
				committed = true;
				if (value !== initialValue) {
					onCommit?.(value);
				}
				context.element()?.focus();
			}
			case "Escape": {
				context.element()?.focus();
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
		context.editing = false;
	};

	const init: Action<HTMLInputElement> = (input) => {
		input.focus();
		input.select();
		return {
			destroy() {
				if (!committed) {
					value = initialValue;
					onRollback?.(value);
				}
			},
		};
	};
</script>

<input
	{...attributes}
	bind:this={element}
	bind:value
	onkeydown={handleKeyDown}
	onblur={handleBlur}
	use:init
/>
