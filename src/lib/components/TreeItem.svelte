<script lang="ts" context="module">
	export type TreeItemContext = {
		item: Readable<TreeNode<unknown>>;
	};

	const contextKey = Symbol();

	export function getTreeItemContext(): TreeItemContext {
		return getContext(contextKey);
	}
</script>

<script lang="ts" generics="Value" strictEvents>
	import { keys } from "$lib/helpers/keys.js";
	import type { TreeNode } from "$lib/helpers/tree.js";
	import { getContext, setContext } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { writable, type Readable } from "svelte/store";
	import { getTreeContext } from "./TreeView.svelte";

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		item: TreeNode<Value>;
	}

	export let item: $$Props["item"];

	const context = {
		item: writable(item),
	} satisfies TreeItemContext;

	$: context.item.set(item);

	setContext(contextKey, context);

	const { expandedIds, selectedIds, items, focusableId } = getTreeContext();

	$: expanded = $expandedIds.has(item.id);
	$: selected = $selectedIds.has(item.id);
	$: leaf = item.children.length === 0;
	$: hidden = (() => {
		let parent = item.parent;
		while (parent !== undefined) {
			const expanded = $expandedIds.has(parent.id);
			if (!expanded) {
				return true;
			}
			parent = parent.parent;
		}
		return false;
	})();

	// Initially, the first item in the tree is focusable.
	$: if ($focusableId === null) {
		$focusableId = item.id;
	}

	function getTreeItem(node: TreeNode<unknown> | undefined) {
		if (node === undefined) {
			return null;
		}
		return document.getElementById(node.id);
	}

	function getPreviousTreeItem() {
		let previous = item.previousSibling;
		if (previous === undefined) {
			return getTreeItem(item.parent);
		}

		// If the previous sibling is expanded, navigate to
		// the last visible item in its subtree.
		while (previous.children.length > 0 && $expandedIds.has(previous.id)) {
			previous = previous.children.at(-1)!;
		}

		return document.getElementById(previous.id);
	}

	function getNextTreeItem() {
		if (!leaf && expanded) {
			return getTreeItem(item.children[0]);
		}

		if (item.nextSibling !== undefined) {
			return getTreeItem(item.nextSibling);
		}

		// Navigate to the first parent having a next sibling.
		let node = item;
		while (node.parent !== undefined) {
			node = node.parent;
			if (node.nextSibling !== undefined) {
				break;
			}
		}

		return getTreeItem(node.nextSibling);
	}

	function getLastTreeItem() {
		// Navigate to the first expanded ancestor of the last item.
		let node = $items.at(-1);
		while (node?.parent !== undefined && !$expandedIds.has(node.parent.id)) {
			node = node.parent;
		}
		return getTreeItem(node);
	}

	let clearSelectionOnBlur = true;

	function handleKeyDown(event: KeyboardEvent) {
		if (event.defaultPrevented) {
			return;
		}

		switch (event.key) {
			case keys.ARROW_UP: {
				const previous = getPreviousTreeItem();
				if (previous !== null) {
					if (event.shiftKey) {
						clearSelectionOnBlur = false;
					}
					previous.focus();
				}
				break;
			}
			case keys.ARROW_DOWN: {
				const next = getNextTreeItem();
				if (next !== null) {
					if (event.shiftKey) {
						clearSelectionOnBlur = false;
					}
					next.focus();
				}
				break;
			}
			case keys.ARROW_RIGHT: {
				if (!leaf && !expanded) {
					expandedIds.add(item.id);
				} else {
					getTreeItem(item.children[0])?.focus();
				}
				break;
			}
			case keys.ARROW_LEFT: {
				if (!leaf && expanded) {
					expandedIds.delete(item.id);
				} else {
					getTreeItem(item.parent)?.focus();
				}
				break;
			}
			case keys.HOME: {
				getTreeItem($items[0])?.focus();
				break;
			}
			case keys.END: {
				getLastTreeItem()?.focus();
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
		event.stopPropagation();
	}

	function handlePointerDown(event: PointerEvent) {
		if (event.defaultPrevented) {
			return;
		}

		if (event.metaKey) {
			clearSelectionOnBlur = false;
			selectedIds.toggle(item.id);
		}
	}

	function handleFocus(event: FocusEvent) {
		if (event.defaultPrevented) {
			return;
		}

		// Only one tree item can be focusable at a time.
		$focusableId = item.id;

		// Selection follows focus.
		selectedIds.add(item.id);
	}

	function handleBlur(event: FocusEvent) {
		if (!event.defaultPrevented && clearSelectionOnBlur) {
			selectedIds.clear();
		}

		// Reset back to the default behavior.
		clearSelectionOnBlur = true;
	}
</script>

<div
	id={item.id}
	role="treeitem"
	aria-setsize={item.setSize}
	aria-posinset={item.positionInSet}
	aria-level={item.level}
	aria-expanded={!leaf ? expanded : undefined}
	aria-selected={selected}
	tabindex={$focusableId === item.id ? 0 : -1}
	class:hidden
	data-tree-item
	{...$$restProps}
	on:keydown
	on:pointerdown
	on:focus
	on:blur
	on:keydown={handleKeyDown}
	on:pointerdown={handlePointerDown}
	on:focus={handleFocus}
	on:blur={handleBlur}
>
	<slot />
</div>

<style>
	.hidden {
		display: none;
	}
</style>
