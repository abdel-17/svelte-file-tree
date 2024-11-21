<script lang="ts">
	import type { Action } from "svelte/action";
	import type { EventHandler } from "svelte/elements";
	import type { TreeItemNameInputProps } from "./types.js";
	import { TreeItemContext } from "./context.svelte.js";

	const context = TreeItemContext.get();

	let {
		value = $bindable(context.item.name),
		element = $bindable(null),
		onCommit,
		onRollback,
		onError,
		onkeydown,
		onblur,
		...attributes
	}: TreeItemNameInputProps = $props();

	const initialValue = value;
	let committed = false;

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (
		event,
	) => {
		onkeydown?.(event);

		switch (event.key) {
			case "Enter": {
				if (value.length === 0) {
					onError?.({ reason: "empty" });
					break;
				}

				if (value === initialValue) {
					context.element()?.focus();
					break;
				}

				const { item } = context;
				let duplicate = false;
				let current = item.siblings.head;
				while (current !== undefined) {
					if (current !== item && current.name === value) {
						duplicate = true;
						break;
					}
					current = current.nextSibling;
				}

				if (duplicate) {
					onError?.({ reason: "duplicate", name: value });
					break;
				}

				item.name = value;
				committed = true;
				onCommit?.(value);
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
