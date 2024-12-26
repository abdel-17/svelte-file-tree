<script lang="ts">
import type { Action } from "svelte/action";
import type { EventHandler } from "svelte/elements";
import { getTreeItemProviderContext } from "../Tree/context.js";
import { getElement, getSiblings } from "../TreeItem/helpers.js";
import type { TreeItemInputProps } from "./types.js";

const {
	treeContext: { getTree, getTreeId, callbacks },
	itemState,
	getNode,
	getParent,
} = getTreeItemProviderContext();

let {
	name = $bindable(getNode().name),
	element = $bindable(null),
	onkeydown,
	onfocus,
	onblur,
	...attributes
}: TreeItemInputProps = $props();

const handleFocus: EventHandler<FocusEvent, HTMLInputElement> = (event) => {
	onfocus?.(event);

	itemState.editing = true;
};

const handleKeyDown: EventHandler<KeyboardEvent, HTMLInputElement> = (event) => {
	onkeydown?.(event);

	const tree = getTree();
	const treeId = getTreeId();
	const node = getNode();
	const parent = getParent();

	switch (event.key) {
		case "Enter": {
			if (name.length === 0) {
				callbacks.onRenameError(node, {
					type: "empty",
				});
				break;
			}

			if (name === node.name) {
				getElement(treeId, node)?.focus();
				break;
			}

			const siblings = getSiblings(tree, parent);
			const duplicated = siblings.some((sibling) => sibling !== node && sibling.name === name);
			if (duplicated) {
				callbacks.onRenameError(node, {
					type: "duplicate",
					name,
				});
				break;
			}

			node.name = name;
			getElement(treeId, node)?.focus();
			callbacks.onRenameItem(node);
			break;
		}
		case "Escape": {
			getElement(treeId, node)?.focus();
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

	itemState.editing = false;
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
