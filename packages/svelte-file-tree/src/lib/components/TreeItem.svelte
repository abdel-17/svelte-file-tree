<script lang="ts" module>
	export class TreeItemContext<Value = unknown> {
		#node: () => TreeNode<Value>;
		editing: boolean = $state(false);

		constructor(node: () => TreeNode<Value>) {
			this.#node = node;
		}

		get node(): TreeNode<Value> {
			return this.#node();
		}

		static key = Symbol("TreeItemContext");
	}
</script>

<script lang="ts" generics="Value">
	import { getContext, hasContext, setContext, type Snippet } from "svelte";
	import type { EventHandler, HTMLAttributes } from "svelte/elements";
	import { composeHandlers, isModifierKey, keys } from "$lib/helpers.js";
	import { TreeViewContext } from "./TreeView.svelte";
	import type { TreeNode } from "./tree.svelte.js";

	type BaseProps = Omit<
		HTMLAttributes<HTMLDivElement>,
		| "id"
		| "role"
		| "hidden"
		| "aria-level"
		| "aria-posinset"
		| "aria-setsize"
		| "aria-expanded"
		| "aria-selected"
		| "tabindex"
		| "children"
	>;

	interface Props extends BaseProps {
		node: TreeNode<Value>;
		children: Snippet<[{ editing: boolean }]>;
		editable?: boolean;
		ref?: HTMLDivElement;
	}

	let {
		node,
		children,
		editable = false,
		ref = $bindable(),
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
		treeContext.tabbableId = node.id;
	}

	const itemContext = new TreeItemContext(() => node);
	setContext(TreeItemContext.key, itemContext);

	$effect.pre(() => {
		if (!editable) {
			itemContext.editing = false;
		}
	});

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (
		event,
	) => {
		if (event.target !== event.currentTarget) {
			// Don't handle keydown events that bubble up from child elements,
			// like the input element in `TreeItemInput`.
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
					const firstChild = node.children[0]!;
					treeContext.findItemElement(firstChild.id).focus();
				}
				break;
			}
			case keys.ARROW_LEFT: {
				if (node.expanded && node.children.length !== 0) {
					node.collapse();
				} else if (node.parent !== undefined) {
					treeContext.findItemElement(node.parent.id).focus();
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
					treeContext.shouldClearSelectionOnNextBlur = false;
				}

				if (isModifierKey(event)) {
					treeContext.shouldClearSelectionOnNextBlur = false;
					treeContext.shouldSelectOnNextFocus = false;
				}

				treeContext.findItemElement(next.id).focus();
				break;
			}
			case keys.HOME: {
				const first = node.tree.roots[0]!;
				treeContext.findItemElement(first.id).focus();
				break;
			}
			case keys.END: {
				let last = node.tree.roots.at(-1)!;
				while (last.expanded && last.children.length !== 0) {
					last = last.children.at(-1)!;
				}
				treeContext.findItemElement(last.id).focus();
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

				const treeElement = treeContext.findElement();
				const maxScrollDistance = Math.min(
					treeElement.clientHeight,
					window.innerHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current = next;
				let currentElement = treeContext.findItemElement(current.id);
				while (true) {
					const next = down ? current.next : current.previous;
					if (next === undefined) {
						break;
					}

					current = next;
					currentElement = treeContext.findItemElement(current.id);

					const currentRect = currentElement.getBoundingClientRect();
					const distance = Math.abs(currentRect.top - itemRect.top);
					if (distance >= maxScrollDistance) {
						break;
					}
				}
				currentElement.focus();
				break;
			}
			case keys.ENTER: {
				if (editable) {
					itemContext.editing = true;
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
		if (event.button !== 0 || !isModifierKey(event)) {
			return;
		}

		node.toggleSelection();

		if (event.currentTarget !== document.activeElement) {
			// If another tree item is focused, preserve selection
			// when focus moves from that item to this one.
			treeContext.shouldClearSelectionOnNextBlur = false;
		}
	};

	const handleFocus: EventHandler<FocusEvent, HTMLDivElement> = () => {
		treeContext.tabbableId = node.id;
		treeContext.onFocus(node.id);
	};

	const handleBlur: EventHandler<FocusEvent, HTMLDivElement> = () => {
		treeContext.onBlur();
	};
</script>

<div
	{...props}
	bind:this={ref}
	id={treeContext.getItemElementId(node.id)}
	role="treeitem"
	hidden={!node.visible ? true : undefined}
	aria-level={node.depth + 1}
	aria-posinset={node.index + 1}
	aria-setsize={node.level.length}
	aria-expanded={node.children.length !== 0 ? node.expanded : undefined}
	aria-selected={node.selected}
	tabindex={node.id === treeContext.tabbableId ? 0 : -1}
	data-tree-item=""
	onkeydown={composeHandlers(handleKeyDown, onkeydown)}
	onpointerdown={composeHandlers(handlePointerDown, onpointerdown)}
	onfocus={composeHandlers(handleFocus, onfocus)}
	onblur={composeHandlers(handleBlur, onblur)}
>
	{@render children({ editing: itemContext.editing })}
</div>

<style>
	[data-tree-item][hidden] {
		display: none;
	}
</style>
