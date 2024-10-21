<script lang="ts" generics="Value">
	import { composeEventHandlers } from "$lib/helpers/events.js";
	import { keys } from "$lib/helpers/keys.js";
	import { isModifierKey } from "$lib/helpers/platform.js";
	import { getContext, hasContext, setContext, type Snippet } from "svelte";
	import type { EventHandler, HTMLAttributes } from "svelte/elements";
	import { TreeItemContext, TreeViewContext } from "./context.svelte.js";
	import type { TreeNode } from "./tree.svelte.js";

	type BaseProps = Omit<
		HTMLAttributes<HTMLDivElement>,
		| "id"
		| "role"
		| "aria-level"
		| "aria-posinset"
		| "aria-setsize"
		| "aria-expanded"
		| "aria-selected"
		| "hidden"
		| "tabindex"
		| "children"
	>;

	interface Props extends BaseProps {
		node: TreeNode<Value>;
		children: Snippet<[{ editing: boolean }]>;
		editable?: boolean;
		editing?: boolean;
		ref?: HTMLDivElement;
	}

	let {
		node,
		children,
		editable = false,
		editing = $bindable(false),
		ref = $bindable(),
		onkeydown,
		onpointerdown,
		onfocus,
		onfocusout,
		...props
	}: Props = $props();

	if (!hasContext(TreeViewContext.key)) {
		throw new Error("<TreeItem> must be used within a <TreeView> component.");
	}
	const treeContext: TreeViewContext = getContext(TreeViewContext.key);

	const itemContext = new TreeItemContext(
		treeContext,
		() => node,
		() => editing,
		(value) => {
			editing = value;
		},
	);
	setContext(TreeItemContext.key, itemContext);

	// The first node in the tree should be initially tabbable with the keyboard.
	treeContext.tabbableId ??= node.id;

	$effect.pre(() => {
		if (!editable) {
			editing = false;
		}
	});

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (
		event,
	) => {
		if (event.target !== event.currentTarget) {
			// Don't handle keydown events that bubble up from child elements
			// to avoid conflict with the input during editing mode.
			return;
		}

		switch (event.key) {
			case keys.ARROW_RIGHT: {
				if (node.children.length === 0) {
					break;
				}

				if (!node.expanded) {
					node.expand();
				} else {
					treeContext.findTreeItemElement(node.children[0]!.id).focus();
				}
				break;
			}
			case keys.ARROW_LEFT: {
				if (node.expanded && node.children.length !== 0) {
					node.collapse();
				} else if (node.parent !== undefined) {
					treeContext.findTreeItemElement(node.parent.id).focus();
				}
				break;
			}
			case keys.ARROW_DOWN:
			case keys.ARROW_UP: {
				const down = event.key === keys.ARROW_DOWN;
				const next = down ? node.next : node.previous;
				if (next === undefined) {
					break;
				}

				if (event.shiftKey) {
					treeContext.clearSelectionOnNextFocusLeave = false;
				}

				if (isModifierKey(event)) {
					treeContext.clearSelectionOnNextFocusLeave = false;
					treeContext.selectOnNextFocus = false;
				}

				treeContext.findTreeItemElement(next.id).focus();
				break;
			}
			case keys.HOME: {
				treeContext.findTreeItemElement(node.tree.roots[0]!.id).focus();
				break;
			}
			case keys.END: {
				let last = node.tree.roots.at(-1)!;
				while (last.expanded && last.children.length !== 0) {
					last = last.children.at(-1)!;
				}
				treeContext.findTreeItemElement(last.id).focus();
				break;
			}
			case keys.SPACE:
			case keys.NON_BREAKING_SPACE: {
				// Option + Space inserts a non-breaking space. Since Option is the
				// modifier key on macOS, we need to handle non-breaking spaces as well
				// to detect the use of the modifier key.
				if (isModifierKey(event)) {
					node.toggleSelection();
				}
				break;
			}
			case keys.PAGE_DOWN:
			case keys.PAGE_UP: {
				const down = event.key === keys.PAGE_DOWN;
				const next = down ? node.next : node.previous;
				if (next === undefined) {
					break;
				}

				const treeElement = treeContext.findTreeElement();
				const maxScrollDistance = Math.min(
					treeElement.clientHeight,
					window.innerHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current = next;
				let currentElement = treeContext.findTreeItemElement(current.id);
				while (true) {
					const next = down ? current.next : current.previous;
					if (next === undefined) {
						break;
					}

					current = next;
					currentElement = treeContext.findTreeItemElement(current.id);

					const currentRect = currentElement.getBoundingClientRect();
					const distance = Math.abs(currentRect.top - itemRect.top);
					if (distance >= maxScrollDistance) {
						break;
					}
				}
				currentElement.focus();
				break;
			}
			case keys.F2: {
				if (editable) {
					editing = true;
				}
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	const handlePointerDown: EventHandler<PointerEvent, HTMLDivElement> = (
		event,
	) => {
		if (event.button !== 0) {
			return;
		}

		if (isModifierKey(event)) {
			node.toggleSelection();

			if (!event.currentTarget.matches(":focus-within")) {
				treeContext.clearSelectionOnNextFocusLeave = false;
			}

			return;
		}

		if (event.shiftKey) {
			let tabbableNodeId = treeContext.tabbableId!;
			let tabbableElement = document.getElementById(
				treeContext.getTreeItemElementId(tabbableNodeId),
			);

			if (tabbableElement === null) {
				// Maybe the element got removed for some reason, who knows.
				// Handle this edge case just in case to avoid errors.
				tabbableNodeId = node.id;
				tabbableElement = event.currentTarget;
			}

			const tabbableRect = tabbableElement.getBoundingClientRect();
			const tabbableBeforeCurrent = event.y > tabbableRect.top;

			let current = node;
			while (true) {
				current.select();

				if (current.id === tabbableNodeId) {
					break;
				}

				const next = tabbableBeforeCurrent ? current.previous : current.next;
				if (next === undefined) {
					break;
				}

				current = next;
			}

			treeContext.clearSelectionOnNextFocusLeave = false;
		}
	};

	const handleFocus: EventHandler<FocusEvent, HTMLDivElement> = () => {
		treeContext.tabbableId = node.id;

		if (!treeContext.selectOnNextFocus) {
			// Reset for the next event.
			treeContext.selectOnNextFocus = true;
			return;
		}

		node.select();
	};

	const handleFocusOut: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		if (!treeContext.clearSelectionOnNextFocusLeave) {
			// Reset for the next event.
			treeContext.clearSelectionOnNextFocusLeave = true;
			return;
		}

		if (!event.currentTarget.matches(":focus-within")) {
			node.tree.selectedIds.clear();
		}
	};
</script>

<div
	{...props}
	bind:this={ref}
	id={itemContext.treeItemElementId}
	role="treeitem"
	aria-level={node.depth + 1}
	aria-posinset={node.levelIndex + 1}
	aria-setsize={node.level.length}
	aria-expanded={node.children.length !== 0 ? node.expanded : undefined}
	aria-selected={node.selected}
	hidden={!node.visible ? true : undefined}
	tabindex={node.id === treeContext.tabbableId ? 0 : -1}
	data-tree-item=""
	onkeydown={composeEventHandlers(handleKeyDown, onkeydown)}
	onpointerdown={composeEventHandlers(handlePointerDown, onpointerdown)}
	onfocus={composeEventHandlers(handleFocus, onfocus)}
	onfocusout={composeEventHandlers(handleFocusOut, onfocusout)}
>
	{@render children({ editing })}
</div>

<style>
	[hidden] {
		display: none;
	}
</style>
