<script lang="ts" generics="Value">
	import { getContext, hasContext, type Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { composeHandlers, isModifierKey, keys } from "$lib/helpers.js";
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
			case keys.ARROW_RIGHT: {
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
			case keys.ARROW_LEFT: {
				if (item.expanded && item.children.length !== 0) {
					item.collapse();
				} else if (item.parent !== undefined) {
					item.parent.element.focus();
				}

				break;
			}
			case keys.ARROW_DOWN:
			case keys.ARROW_UP: {
				const down = event.key === keys.ARROW_DOWN;
				const next = down ? item.next : item.previous;
				if (next === undefined) {
					break;
				}

				if (event.shiftKey) {
					treeContext.shouldClearSelectionOnNextBlur = false;
				}

				if (isModifierKey(event)) {
					treeContext.shouldClearSelectionOnNextBlur = false;
					treeContext.shouldSelectOnNextFocus = false;
				}

				next.element.focus();

				break;
			}
			case keys.HOME: {
				item.tree.roots[0]!.element.focus();
				break;
			}
			case keys.END: {
				let current = item.tree.roots.at(-1)!;
				while (current.expanded && current.children.length !== 0) {
					current = current.children.at(-1)!;
				}
				current.element.focus();

				break;
			}
			case keys.SPACE:
			case keys.NON_BREAKING_SPACE: {
				// Option + Space inserts a non-breaking space. Since Option is the
				// modifier key on macOS, we need to handle non-breaking spaces as well
				// to detect the use of the modifier key.
				if (isModifierKey(event)) {
					item.toggleSelection();
				}

				break;
			}
			case keys.PAGE_DOWN:
			case keys.PAGE_UP: {
				const down = event.key === keys.PAGE_DOWN;
				const scrollDistance = Math.min(
					item.tree.element.clientHeight,
					window.innerHeight,
				);
				const { top } = item.element.getBoundingClientRect();

				let current = item;
				let found = false;
				while (true) {
					const next = down ? current.next : current.previous;
					if (next === undefined) {
						break;
					}

					current = next;
					found = true;

					const rect = current.element.getBoundingClientRect();
					const distance = Math.abs(rect.top - top);
					if (distance >= scrollDistance) {
						break;
					}
				}

				if (found) {
					current.element.focus();
				}

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
	data-tree-item=""
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
