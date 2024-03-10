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
	} = getTreeContext();

	$: expanded = $expandedIds.has(item.id);
	$: selected = $selectedIds.has(item.id);
	$: leaf = item.children.length === 0;
	$: hidden = !$visibleIds.has(item.id);

	// Initially, the first item in the tree is focusable.
	$: if ($focusableId === null) {
		$focusableId = item.id;
	}

	function getItemElement<T>(node: TreeNode<T>) {
		return document.getElementById(node.id);
	}

	function getItemElementOrNull<T>(node: TreeNode<T> | undefined) {
		if (node === undefined) {
			return null;
		}
		return getItemElement(node);
	}

	function getPreviousItemElement() {
		let previous = item.previousSibling;
		if (previous === undefined) {
			return getItemElementOrNull(item.parent);
		}

		// If the previous sibling is expanded, navigate to
		// the last visible item in its subtree.
		while (previous.children.length > 0 && $expandedIds.has(previous.id)) {
			previous = previous.children.at(-1)!;
		}
		return getItemElement(previous);
	}

	function getNextItemElement() {
		if (!leaf && expanded) {
			return getItemElement(item.children[0]!);
		}

		if (item.nextSibling !== undefined) {
			return getItemElement(item.nextSibling);
		}

		// Navigate to the first parent having a next sibling.
		let node = item;
		while (node.parent !== undefined) {
			node = node.parent;
			if (node.nextSibling !== undefined) {
				break;
			}
		}
		return getItemElementOrNull(node.nextSibling);
	}

	function getFirstItemElement() {
		return getItemElementOrNull($items[0]);
	}

	function getLastItemElement() {
		// Navigate to the first expanded ancestor of the last item.
		let node = $items.at(-1);
		while (node?.parent !== undefined && !$expandedIds.has(node.parent.id)) {
			node = node.parent;
		}
		return getItemElementOrNull(node);
	}

	function isTreeItemElement(element: unknown): element is HTMLElement {
		return (
			element instanceof HTMLElement && element.hasAttribute("data-tree-item")
		);
	}

	function getHeightWithoutPadding(element: HTMLElement) {
		const { paddingTop, paddingBottom } = getComputedStyle(element);
		const { clientHeight } = element;
		return clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom);
	}

	type HTMLElementEvent<E> = E & { currentTarget: HTMLElement };

	function handleKeyDown(event: HTMLElementEvent<KeyboardEvent>) {
		if (event.defaultPrevented) {
			return;
		}

		switch (event.key) {
			case keys.ARROW_UP: {
				const previous = getPreviousItemElement();
				if (previous !== null) {
					if (event.shiftKey) {
						$clearSelectionOnBlur = false;
					}
					previous.focus();
				}
				break;
			}
			case keys.ARROW_DOWN: {
				const next = getNextItemElement();
				if (next !== null) {
					if (event.shiftKey) {
						$clearSelectionOnBlur = false;
					}
					next.focus();
				}
				break;
			}
			case keys.ARROW_LEFT: {
				if (!leaf && expanded) {
					expandedIds.delete(item.id);
				} else {
					getItemElementOrNull(item.parent)?.focus();
				}
				break;
			}
			case keys.ARROW_RIGHT: {
				if (!leaf && !expanded) {
					expandedIds.add(item.id);
				} else {
					getItemElementOrNull(item.children[0])?.focus();
				}
				break;
			}
			case keys.HOME: {
				getFirstItemElement()?.focus();
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
			default: {
				return;
			}
		}

		event.preventDefault();
		event.stopPropagation();
	}

	function handlePageUpOrDownKey(event: HTMLElementEvent<KeyboardEvent>) {
		const treeElement = event.currentTarget.closest("[data-tree-view]");
		if (!(treeElement instanceof HTMLElement)) {
			return;
		}

		let remainingHeight = getHeightWithoutPadding(treeElement);
		let current = event.currentTarget;
		let found: HTMLElement | null = null;

		while (remainingHeight > 0) {
			let next = null;
			switch (event.key) {
				case keys.PAGE_UP: {
					next = current.previousElementSibling;
					break;
				}
				case keys.PAGE_DOWN: {
					next = current.nextElementSibling;
				}
			}

			if (next === null) {
				break;
			}

			if (!isTreeItemElement(next)) {
				// This implementation expects all direct children
				// of the tree to be tree items.
				return;
			}

			current = next;

			if (!current.hidden) {
				remainingHeight -= current.offsetHeight;
				found = current;
			}
		}

		found?.focus();
	}

	function handlePointerDown(event: PointerEvent) {
		if (event.defaultPrevented) {
			return;
		}

		if (event.metaKey) {
			$clearSelectionOnBlur = false;
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
	[data-tree-item][hidden] {
		display: none;
	}
</style>
