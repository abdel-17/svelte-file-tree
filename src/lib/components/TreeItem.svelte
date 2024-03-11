<script lang="ts" context="module">
	export type TreeItemContext = {
		item: Readable<TreeNode<unknown>>;
	};

	const contextKey = Symbol();

	export function getTreeItemContext(): TreeItemContext {
		const context: TreeItemContext | undefined = getContext(contextKey);
		if (context === undefined) {
			throw new Error("Must be used within a <TreeItem>");
		}
		return context;
	}
</script>

<script lang="ts" generics="Value" strictEvents>
	import { keys } from "$lib/helpers/keys.js";
	import { isCmdOrCtrlKey } from "$lib/helpers/platform.js";
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

	const {
		expandedIds,
		selectedIds,
		visibleIds,
		items,
		focusableId,
		clearSelectionOnBlur,
		selectOnFocus,
	} = getTreeContext();

	$: expanded = $expandedIds.has(item.id);
	$: selected = $selectedIds.has(item.id);
	$: leaf = item.children.length === 0;
	$: hidden = !$visibleIds.has(item.id);

	// Initially, the first item in the tree is focusable.
	$: if ($focusableId === null) {
		$focusableId = item.id;
	}

	function getItemElement<T>(item: TreeNode<T> | undefined) {
		if (item === undefined) {
			return null;
		}
		return document.getElementById(item.id);
	}

	function getPreviousItem<T>(item: TreeNode<T>) {
		const previous = item.previousSibling;
		if (previous === undefined) {
			return item.parent;
		}

		// If the previous sibling is expanded, navigate to
		// the last visible item in its subtree.
		let node = previous;
		while (node.children.length > 0 && $expandedIds.has(node.id)) {
			node = node.children.at(-1)!;
		}
		return node;
	}

	function getNextItem<T>(item: TreeNode<T>) {
		if (!leaf && expanded) {
			return item.children[0]!;
		}

		if (item.nextSibling !== undefined) {
			return item.nextSibling;
		}

		// Navigate to the first parent having a next sibling.
		let node = item;
		while (node.parent !== undefined) {
			node = node.parent;
			if (node.nextSibling !== undefined) {
				break;
			}
		}
		return node.nextSibling;
	}

	function getLastItemElement() {
		// Navigate to the first expanded ancestor of the last item.
		let node = $items.at(-1);
		while (node?.parent !== undefined && !$expandedIds.has(node.parent.id)) {
			node = node.parent;
		}
		return getItemElement(node);
	}

	type HTMLElementEvent<Event> = Event & { currentTarget: HTMLElement };

	function handleKeyDown(event: HTMLElementEvent<KeyboardEvent>) {
		if (event.defaultPrevented) {
			return;
		}

		switch (event.key) {
			case keys.ARROW_UP: {
				handleArrowUpOrDownKey(event, getPreviousItem(item));
				break;
			}
			case keys.ARROW_DOWN: {
				handleArrowUpOrDownKey(event, getNextItem(item));
				break;
			}
			case keys.ARROW_LEFT: {
				if (!leaf && expanded) {
					expandedIds.delete(item.id);
				} else {
					getItemElement(item.parent)?.focus();
				}
				break;
			}
			case keys.ARROW_RIGHT: {
				if (!leaf && !expanded) {
					expandedIds.add(item.id);
				} else {
					getItemElement(item.children[0])?.focus();
				}
				break;
			}
			case keys.HOME: {
				getItemElement($items[0])?.focus();
				break;
			}
			case keys.END: {
				getLastItemElement()?.focus();
				break;
			}
			case keys.PAGE_UP:
			case keys.PAGE_DOWN: {
				handlePageUpOrDownKey(event);
				break;
			}
			case keys.SPACE: {
				selectedIds.toggle(item.id);
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
		event.stopPropagation();
	}

	function handleArrowUpOrDownKey(
		event: HTMLElementEvent<KeyboardEvent>,
		nextItem: TreeNode<Value> | undefined,
	) {
		const nextElement = getItemElement(nextItem);
		if (nextElement === null) {
			return;
		}

		if (event.shiftKey) {
			$clearSelectionOnBlur = false;
		} else if (isCmdOrCtrlKey(event)) {
			$clearSelectionOnBlur = false;
			$selectOnFocus = false;
		}

		nextElement.focus();
	}

	function handlePageUpOrDownKey(event: HTMLElementEvent<KeyboardEvent>) {
		const treeElement = event.currentTarget.closest("[data-tree-view]");
		if (treeElement === null) {
			return;
		}

		const goBack = event.key === keys.PAGE_UP;
		const { clientHeight: treeHeight } = treeElement;
		const { top: itemTop } = event.currentTarget.getBoundingClientRect();

		let node = item;
		let found: HTMLElement | null = null;
		while (true) {
			const next = goBack ? getPreviousItem(node) : getNextItem(node);
			const nextElement = getItemElement(next);
			if (next === undefined || nextElement === null) {
				break;
			}

			node = next;
			found = nextElement;

			const { top: nextTop } = nextElement.getBoundingClientRect();
			const distance = Math.abs(nextTop - itemTop);
			if (distance >= treeHeight) {
				break;
			}
		}
		found?.focus();
	}

	function handlePointerDown(event: PointerEvent) {
		if (event.defaultPrevented) {
			return;
		}

		if (isCmdOrCtrlKey(event)) {
			$clearSelectionOnBlur = false;
			selectedIds.toggle(item.id);
		}
	}

	function handlePointerUp() {
		// Reset the changes made by the `pointerdown` event.
		$clearSelectionOnBlur = true;
	}

	function handleFocus(event: FocusEvent) {
		if (!event.defaultPrevented) {
			// Only one tree item can be focusable at a time.
			$focusableId = item.id;

			if ($selectOnFocus) {
				selectedIds.add(item.id);
			}
		}

		// Reset back to the default behavior.
		$selectOnFocus = true;
	}

	function handleBlur(event: FocusEvent) {
		if (!event.defaultPrevented && $clearSelectionOnBlur) {
			selectedIds.clear();
		}

		// Reset back to the default behavior.
		$clearSelectionOnBlur = true;
	}
</script>

<div
	id={item.id}
	role="treeitem"
	hidden={hidden ? true : undefined}
	aria-setsize={item.setSize}
	aria-posinset={item.positionInSet}
	aria-level={item.level}
	aria-expanded={!leaf ? expanded : undefined}
	aria-selected={selected}
	tabindex={$focusableId === item.id ? 0 : -1}
	data-tree-item
	{...$$restProps}
	on:keydown
	on:pointerdown
	on:pointerup
	on:focus
	on:blur
	on:keydown={handleKeyDown}
	on:pointerdown={handlePointerDown}
	on:pointerup={handlePointerUp}
	on:focus={handleFocus}
	on:blur={handleBlur}
>
	<slot />
</div>

<style>
	[data-tree-item][hidden] {
		display: none;
	}
</style>
