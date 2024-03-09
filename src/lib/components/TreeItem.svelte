<script lang="ts" context="module">
	type TreeItemContext = {
		id: Writable<string>;
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
	import { writable, type Writable } from "svelte/store";
	import { getTreeContext } from "./TreeView.svelte";

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		item: TreeNode<Value>;
	}

	export let item: $$Props["item"];

	const { getItemId, expandedIds, selectedIds, focusableId } = getTreeContext();

	$: id = getItemId(item);
	$: expanded = $expandedIds.has(id);
	$: selected = $selectedIds.has(id);
	$: leaf = item.children.length === 0;
	$: hidden = (() => {
		let node = item;
		while (node.parent !== undefined) {
			node = node.parent;
			const expanded = $expandedIds.has(getItemId(node));
			if (!expanded) {
				return true;
			}
		}
		return false;
	})();

	// Initially, the first item in the tree is focusable.
	$: if ($focusableId === null) {
		$focusableId = id;
	}

	const context: TreeItemContext = setContext(contextKey, {
		id: writable(id),
	});

	$: context.id.set(id);

	function getTreeItem(node: TreeNode<Value> | undefined) {
		if (node === undefined) {
			return null;
		}
		return document.getElementById(getItemId(node));
	}

	function handleClick(event: MouseEvent) {
		if (event.defaultPrevented) {
			return;
		}

		if (event.metaKey) {
			selectedIds.toggle(id);
		} else {
			selectedIds.clear();
			selectedIds.add(id);
		}
	}

	// Prevent the blur event from firing when focus is shifted
	// using the arrow up and arrow down keys.
	let preventBlur = false;

	function handleKeyDown(
		event: KeyboardEvent & { currentTarget: HTMLElement },
	) {
		if (event.defaultPrevented) {
			return;
		}

		switch (event.key) {
			case keys.ARROW_UP: {
				let previous = event.currentTarget.previousElementSibling;
				while (previous !== null) {
					if (
						previous instanceof HTMLElement &&
						previous.hasAttribute("data-tree-item") &&
						getComputedStyle(previous).display !== "none"
					) {
						if (event.shiftKey) {
							preventBlur = true;
						} else {
							selectedIds.clear();
						}
						previous.focus();
						break;
					}
					previous = previous.previousElementSibling;
				}
				break;
			}
			case keys.ARROW_DOWN: {
				let next = event.currentTarget.nextElementSibling;
				while (next !== null) {
					if (
						next instanceof HTMLElement &&
						next.hasAttribute("data-tree-item") &&
						getComputedStyle(next).display !== "none"
					) {
						if (event.shiftKey) {
							preventBlur = true;
						} else {
							selectedIds.clear();
						}
						next.focus();
						break;
					}
					next = next.nextElementSibling;
				}
				break;
			}
			case keys.ARROW_RIGHT: {
				if (!leaf && !expanded) {
					expandedIds.add(id);
				} else {
					const el = getTreeItem(item.children[0]);
					if (el !== null) {
						selectedIds.clear();
						el.focus();
					}
				}
				break;
			}
			case keys.ARROW_LEFT: {
				if (!leaf && expanded) {
					expandedIds.delete(id);
				} else {
					const el = getTreeItem(item.parent);
					if (el !== null) {
						selectedIds.clear();
						el.focus();
					}
				}
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
		event.stopPropagation();
	}

	function handleFocus(event: FocusEvent) {
		if (event.defaultPrevented) {
			return;
		}

		$focusableId = id;
		selectedIds.add(id);
	}

	function handleBlur(event: FocusEvent) {
		if (event.defaultPrevented) {
			return;
		}

		if (preventBlur) {
			preventBlur = false;
			return;
		}

		selectedIds.delete(id);
	}
</script>

<div
	{id}
	role="treeitem"
	aria-setsize={item.setSize}
	aria-posinset={item.positionInSet}
	aria-level={item.level}
	aria-expanded={!leaf ? expanded : undefined}
	aria-selected={selected}
	tabindex={$focusableId === id ? 0 : -1}
	class:hidden
	data-tree-item
	{...$$restProps}
	on:click
	on:click={handleClick}
	on:keydown
	on:keydown={handleKeyDown}
	on:focus
	on:focus={handleFocus}
	on:blur
	on:blur={handleBlur}
>
	<slot />
</div>

<style>
	.hidden {
		display: none;
	}
</style>
