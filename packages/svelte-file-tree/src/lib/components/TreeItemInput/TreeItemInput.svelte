<script lang="ts">
	import { composeEventHandlers } from "$lib/internal/helpers.js";
	import type { Action } from "svelte/action";
	import type { EventHandler } from "svelte/elements";
	import { getTreeItemProviderContext } from "../Tree/TreeItemProvider.svelte";
	import { getTreeItemContext } from "../TreeItem/TreeItem.svelte";
	import type { TreeItemInputProps } from "./types.js";

	const { treeState, item } = getTreeItemProviderContext();
	const { setEditing } = getTreeItemContext();

	let {
		name = $bindable(item().node.data.name),
		ref = $bindable(null),
		onkeydown,
		onblur,
		...rest
	}: TreeItemInputProps = $props();

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (event) => {
		switch (event.key) {
			case "Enter": {
				const { node } = item();
				treeState.rename(item(), name).then((didRename) => {
					if (didRename) {
						treeState.getItemElement(node.id)?.focus();
					}
				});
				break;
			}
			case "Escape": {
				treeState.getItemElement(item().node.id)?.focus();
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	const handleBlur: EventHandler<FocusEvent, HTMLInputElement> = () => {
		setEditing(false);
	};

	const init: Action<HTMLInputElement> = (input) => {
		input.focus();
		input.select();
	};

	$effect(() => {
		setEditing(true);
		return () => {
			setEditing(false);
		};
	});
</script>

<input
	{...rest}
	bind:this={ref}
	bind:value={name}
	onkeydown={composeEventHandlers(onkeydown, handleKeyDown)}
	onblur={composeEventHandlers(onblur, handleBlur)}
	use:init
/>
