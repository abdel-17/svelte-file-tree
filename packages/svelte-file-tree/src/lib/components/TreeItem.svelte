<script lang="ts" generics="Value">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		composeHandlers,
		isModifierKey,
		NON_BREAKING_SPACE,
	} from "$lib/helpers.js";
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

	// The first node in the tree should be initially tabbable with the keyboard.
	if (item.tree._tabbableId === undefined) {
		item.tree._tabbableId = item.id;
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
					item.tree._shouldClearSelectionOnNextBlur = false;
				}

				if (isModifierKey(event)) {
					item.tree._shouldClearSelectionOnNextBlur = false;
				} else {
					target.select();
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
			item.tree._shouldClearSelectionOnNextBlur = false;
		}
	}

	function handleFocus() {
		item.tree._tabbableId = item.id;

		if (item.tree._shouldSelectOnNextFocus) {
			item.select();
		} else {
			// Reset back to the default behavior
			item.tree._shouldSelectOnNextFocus = true;
		}
	}

	function handleBlur() {
		if (item.tree._shouldClearSelectionOnNextBlur) {
			item.tree.selectedIds.clear();
		} else {
			// Reset back to the default behavior
			item.tree._shouldClearSelectionOnNextBlur = true;
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
	aria-expanded={item.expanded}
	aria-selected={item.selected}
	tabindex={item.tabindex}
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
