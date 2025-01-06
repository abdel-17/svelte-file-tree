<script lang="ts">
	import type { FileTreeNode } from "$lib/tree.svelte.js";
	import { getContext, hasContext } from "svelte";
	import type { Action } from "svelte/action";
	import type { EventHandler } from "svelte/elements";
	import { TreeContext, TreeItemContext } from "../Tree/context.svelte.js";
	import type { TreeItemInputProps } from "./types.js";

	if (!hasContext(TreeItemContext.key)) {
		throw new Error("<TreeItemInput> must be a child of <TreeItem>");
	}

	const treeContext: TreeContext = getContext(TreeContext.key);
	const context: TreeItemContext = getContext(TreeItemContext.key);

	let {
		name = $bindable(context.node.name),
		element = $bindable(null),
		onkeydown,
		onfocus,
		onblur,
		...attributes
	}: TreeItemInputProps = $props();

	const handleFocus: EventHandler<FocusEvent, HTMLInputElement> = (event) => {
		onfocus?.(event);

		context.editing = true;
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (event) => {
		onkeydown?.(event);

		const { node, level } = context;
		switch (event.key) {
			case "Enter": {
				if (name.length === 0) {
					treeContext.callbacks.onRenameError({
						reason: "empty",
						node,
					});
					break;
				}

				if (name === node.name) {
					treeContext.getItemElement(node)?.focus();
					break;
				}

				let conflicting: FileTreeNode | undefined;
				for (const current of level) {
					if (current !== node && name === current.name) {
						conflicting = current;
						break;
					}
				}

				if (conflicting !== undefined) {
					treeContext.callbacks.onRenameError({
						reason: "conflict",
						node,
						conflicting,
					});
					break;
				}

				node.name = name;
				treeContext.getItemElement(node)?.focus();
				treeContext.callbacks.onRenameItem({ node });
				break;
			}
			case "Escape": {
				treeContext.getItemElement(node)?.focus();
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
