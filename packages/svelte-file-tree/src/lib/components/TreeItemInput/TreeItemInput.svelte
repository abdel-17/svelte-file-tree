<script lang="ts">
import type { Action } from "svelte/action";
import type { EventHandler } from "svelte/elements";
import { TreeItemContext } from "../Tree/context.svelte.js";
import type { TreeItemInputProps } from "./types.js";

const context = TreeItemContext.get();

let {
	name = $bindable(context.getNode().name),
	element = $bindable(null),
	onkeydown,
	onfocus,
	onblur,
	...attributes
}: TreeItemInputProps = $props();

const handleFocus: EventHandler<FocusEvent, HTMLInputElement> = (event) => {
	onfocus?.(event);

	context.onInputFocus();
};

const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (event) => {
	onkeydown?.(event);

	switch (event.key) {
		case "Enter": {
			context.onInputEnterKeyDown({ name });
			break;
		}
		case "Escape": {
			context.onInputEscapeKeyDown();
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

	context.onInputBlur();
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
