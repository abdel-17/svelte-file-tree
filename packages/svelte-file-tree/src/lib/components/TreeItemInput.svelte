<script lang="ts">
	import { composeEventHandlers } from "$lib/helpers/events.js";
	import { getContext, hasContext } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
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
		onblur,
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

	type WithCurrentTarget<Event> = Event & { currentTarget: HTMLInputElement };

	function handleKeyDown(event: WithCurrentTarget<KeyboardEvent>) {
		switch (event.key) {
			case "Enter": {
				commited = true;
				itemContext.node.getElement()!.focus();

				if (value !== originalValue) {
					onCommit?.(value);
				}
				break;
			}
			case "Escape": {
				itemContext.node.getElement()!.focus();
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	}

	function handleBlur() {
		itemContext.editing = false;
	}

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
	onkeydown={composeEventHandlers(handleKeyDown, onkeydown)}
	onblur={composeEventHandlers(handleBlur, onblur)}
	use:init
/>
