<script lang="ts">
	import { composeEventHandlers } from "$lib/helpers/events.js";
	import type { ActionReturn } from "svelte/action";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { getTreeItemContext } from "./TreeItem.svelte";

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

	const { treeItemElement, onEditingChange } = getTreeItemContext();

	const originalValue = value;
	let commited = false;

	type WithCurrentTarget<Event> = Event & { currentTarget: HTMLInputElement };

	function handleKeyDown(event: WithCurrentTarget<KeyboardEvent>): void {
		switch (event.key) {
			case "Enter": {
				commited = true;
				treeItemElement()!.focus();
				if (value !== originalValue) {
					onCommit?.(value);
				}
				break;
			}
			case "Escape": {
				treeItemElement()!.focus();
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	}

	function handleBlur(): void {
		onEditingChange(false);
	}

	function init(input: HTMLInputElement): ActionReturn {
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
