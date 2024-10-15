<script lang="ts" generics="Value">
	import { getContext, hasContext, type Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		composeHandlers,
		isModifierKey,
		NON_BREAKING_SPACE,
	} from "$lib/helpers.js";
	import { TreeViewContext } from "./TreeView.svelte";
	import type { TreeNode } from "./tree.svelte.js";

	interface Props extends HTMLAttributes<HTMLDivElement> {
		item: TreeNode<Value>;
		children: Snippet;
	}

	const {
		item,
		children,
		onkeydown,
		onpointerdown,
		onfocus,
		onblur,
		...props
	}: Props = $props();

	if (!hasContext(TreeViewContext.key)) {
		throw new Error("<TreeItem> must be used within a <TreeView> component.");
	}
	const treeContext: TreeViewContext = getContext(TreeViewContext.key);

	// The first node in the tree should be initially tabbable with the keyboard.
	if (treeContext.tabbableId === undefined) {
		treeContext.tabbableId = item.id;
	}

	function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case "ArrowRight": {
				if (item.children.length === 0) {
					break;
				}

				if (!item.expanded) {
					item.expand();
				} else {
					item.children[0]!.element.focus();
				}

				break;
			}
			case "ArrowLeft": {
				if (item.expanded && item.children.length !== 0) {
					item.collapse();
				} else if (item.parent !== undefined) {
					item.parent.element.focus();
				}

				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const target = event.key === "ArrowDown" ? item.next : item.previous;
				if (target === undefined) {
					break;
				}

				if (event.shiftKey) {
					treeContext.shouldClearSelectionOnNextBlur = false;
				}

				if (isModifierKey(event)) {
					treeContext.shouldClearSelectionOnNextBlur = false;
					treeContext.shouldSelectOnNextFocus = false;
				}

				target.element.focus();

				break;
			}
			case "Home": {
				item.tree.roots[0]!.element.focus();
				break;
			}
			case "End": {
				let current = item.tree.roots.at(-1)!;
				while (current.expanded && current.children.length !== 0) {
					current = current.children.at(-1)!;
				}
				current.element.focus();

				break;
			}
			case "Space":
			case NON_BREAKING_SPACE: {
				// Option + Space inserts a non-breaking space. Since Option is the
				// modifier key on macOS, we need to handle non-breaking spaces as well
				// to detect the use of the modifier key.
				if (isModifierKey(event)) {
					item.toggleSelection();
				}

				break;
			}
			case "PageDown":
			case "PageUp": {
				// TODO:
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	}

	function handlePointerDown(event: PointerEvent) {
		if (event.button !== 0 || !isModifierKey(event)) {
			return;
		}

		item.toggleSelection();

		if (item.element !== document.activeElement) {
			// If another tree item is focused, preserve selection
			// when focus moves from that item to this one.
			treeContext.shouldClearSelectionOnNextBlur = false;
		}
	}

	function handleFocus() {
		treeContext.tabbableId = item.id;

		if (treeContext.shouldSelectOnNextFocus) {
			item.select();
		} else {
			// Reset back to the default behavior
			treeContext.shouldSelectOnNextFocus = true;
		}
	}

	function handleBlur() {
		if (treeContext.shouldClearSelectionOnNextBlur) {
			item.tree.selectedIds.clear();
		} else {
			// Reset back to the default behavior
			treeContext.shouldClearSelectionOnNextBlur = true;
		}
	}
</script>

<div
	{...props}
	bind:this={item._element}
	role="treeitem"
	hidden={!item.visible ? true : undefined}
	aria-level={item.depth + 1}
	aria-posinset={item.index + 1}
	aria-setsize={item.level.length}
	aria-expanded={item.children.length !== 0 ? item.expanded : undefined}
	aria-selected={item.selected}
	tabindex={item.id === treeContext.tabbableId ? 0 : -1}
	data-tree-item
	onkeydown={composeHandlers(handleKeyDown, onkeydown)}
	onpointerdown={composeHandlers(handlePointerDown, onpointerdown)}
	onfocus={composeHandlers(handleFocus, onfocus)}
	onblur={composeHandlers(handleBlur, onblur)}
>
	{@render children()}
</div>

<style>
	[data-tree-item][hidden] {
		display: none;
	}
</style>
