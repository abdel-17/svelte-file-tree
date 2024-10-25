<script lang="ts" generics="Value">
	import { composeEventHandlers } from "$lib/helpers/events.js";
	import { isModifierKey } from "$lib/helpers/platform.js";
	import {
		flushSync,
		getContext,
		hasContext,
		setContext,
		type Snippet,
	} from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
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
		levelIndex: number;
		children: Snippet<[{ editing: boolean }]>;
		editable?: boolean;
		editing?: boolean;
		ref?: HTMLDivElement | null;
	}

	let {
		node,
		levelIndex,
		children,
		editable = false,
		editing = $bindable(false),
		ref = $bindable(null),
		onkeydown,
		onclick,
		onfocusin,
		...props
	}: Props = $props();

	if (!hasContext(TreeViewContext.key)) {
		throw new Error("<TreeItem> must be used within a <TreeView> component.");
	}
	const treeContext: TreeViewContext = getContext(TreeViewContext.key);

	const itemContext = new TreeItemContext({
		node: () => node,
		editing: () => editing,
		onEditingChange(value) {
			editing = value;
		},
	});
	setContext(TreeItemContext.key, itemContext);

	// The first node in the tree should be initially tabbable with the keyboard.
	treeContext.tabbableId ??= node.id;

	$effect.pre(() => {
		if (!editable) {
			editing = false;
		}
	});

	function getPreviousTreeItem(treeItem: HTMLElement): HTMLElement | null {
		const previous = treeItem.previousElementSibling;
		if (previous === null) {
			return null;
		}
		if (previous instanceof HTMLElement && previous.role === "treeitem") {
			return previous;
		}
		throw new Error("Expected previous sibling to be a tree item.");
	}

	function getNextTreeItem(treeItem: HTMLElement): HTMLElement | null {
		const next = treeItem.nextElementSibling;
		if (next === null) {
			return null;
		}
		if (next instanceof HTMLElement && next.role === "treeitem") {
			return next;
		}
		throw new Error("Expected next sibling to be a tree item.");
	}

	function getNodeId(treeItem: HTMLElement): string {
		const { nodeId } = treeItem.dataset;
		if (nodeId === undefined) {
			throw new Error("Expected tree item to have a data-node-id attribute.");
		}
		return nodeId;
	}

	type WithCurrentTarget<Event> = Event & { currentTarget: HTMLDivElement };

	function handleKeyDown(event: WithCurrentTarget<KeyboardEvent>) {
		if (event.target !== event.currentTarget) {
			// Don't handle keydown events that bubble up from child elements
			// to avoid conflict with the input during editing mode.
			return;
		}

		switch (event.key) {
			case "ArrowRight": {
				if (node.children.length === 0) {
					break;
				}

				if (!node.expanded) {
					node.expanded = true;
				} else {
					node.children[0]!.getElement()!.focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (node.expanded && node.children.length !== 0) {
					node.expanded = false;
				} else if (node.parent !== null) {
					node.parent.getElement()!.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const down = event.key === "ArrowDown";
				const next = down
					? getNextTreeItem(event.currentTarget)
					: getPreviousTreeItem(event.currentTarget);

				if (next === null) {
					break;
				}

				if (event.shiftKey) {
					node.selected = true;
					node.tree.selected.add(getNodeId(next));
				}

				next.focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const down = event.key === "PageDown";
				const treeElement = node.tree.getElement()!;
				const maxScrollDistance = Math.min(
					treeElement.clientHeight,
					window.innerHeight,
				);
				const rect = event.currentTarget.getBoundingClientRect();

				let current: HTMLElement = event.currentTarget;
				while (true) {
					const next = down
						? getNextTreeItem(current)
						: getPreviousTreeItem(current);

					if (next === null) {
						break;
					}

					current = next;
					const currentRect = current.getBoundingClientRect();
					const distance = Math.abs(currentRect.top - rect.top);
					if (distance >= maxScrollDistance) {
						break;
					}
				}
				current.focus();
				break;
			}
			case "Home": {
				if (!event.shiftKey || !isModifierKey(event)) {
					node.tree.roots[0]!.getElement()!.focus();
					break;
				}

				let first = true;
				for (const current of node.tree) {
					if (first) {
						current.getElement()!.focus();
						first = false;
					}

					current.selected = true;

					if (current === node) {
						break;
					}
				}
				break;
			}
			case "End": {
				if (!event.shiftKey || !isModifierKey(event)) {
					let last = node.tree.roots.at(-1)!;
					while (last.expanded && last.children.length !== 0) {
						last = last.children.at(-1)!;
					}
					last.getElement()!.focus();
					break;
				}

				let last = true;
				for (const current of node.tree.reversed()) {
					if (last) {
						current.getElement()!.focus();
						last = false;
					}

					current.selected = true;

					if (current === node) {
						break;
					}
				}
				break;
			}
			case " ": {
				node.selected = !node.selected;
				break;
			}
			case "F2": {
				if (editable) {
					editing = true;
				}
				break;
			}
			case "a": {
				if (!isModifierKey(event)) {
					break;
				}

				for (const item of node.tree) {
					item.selected = true;
				}
				break;
			}
			case "*": {
				const rectBefore = event.currentTarget.getBoundingClientRect();

				flushSync(() => {
					for (const sibling of node.level) {
						sibling.expanded = true;
					}
				});

				// When the sibling nodes are all expanded, the tree's height changes,
				// causing a lot of layout shift. Preserve the position of the focused
				// node relative to the viewport to avoid disorienting the user.
				const rectAfter = event.currentTarget.getBoundingClientRect();
				window.scrollBy(0, rectAfter.top - rectBefore.top);
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	}

	function handleClick(event: WithCurrentTarget<MouseEvent>) {
		if (isModifierKey(event)) {
			node.selected = !node.selected;
			return;
		}

		if (!event.shiftKey) {
			node.tree.selected.clear();
			node.selected = true;
			return;
		}

		// The click event is fired after the focus event, so the currently
		// tabbable element is this element. We want to select all elements
		// starting from the previously tabbable element up to this element.
		const tabbableId = treeContext.previousTabbableId;
		if (tabbableId === undefined) {
			return;
		}

		const tabbableElement = node.tree.getTreeItemElement(tabbableId)!;
		const tabbableElementRect = tabbableElement.getBoundingClientRect();
		const down = tabbableElementRect.top > event.y;

		let current: HTMLElement = event.currentTarget;
		while (true) {
			const currentId = getNodeId(current);
			node.tree.selected.add(currentId);

			if (currentId === tabbableId) {
				break;
			}

			const next = down
				? getNextTreeItem(current)
				: getPreviousTreeItem(current);

			if (next === null) {
				break;
			}

			current = next;
		}
	}

	function handleFocusIn() {
		treeContext.tabbableId = node.id;
	}
</script>

<div
	{...props}
	bind:this={ref}
	id={node.elementId}
	role="treeitem"
	aria-level={node.depth + 1}
	aria-posinset={levelIndex + 1}
	aria-setsize={node.level.length}
	aria-expanded={node.children.length !== 0 ? node.expanded : undefined}
	aria-selected={node.selected}
	tabindex={node.id === treeContext.tabbableId ? 0 : -1}
	data-node-id={node.id}
	onkeydown={composeEventHandlers(handleKeyDown, onkeydown)}
	onclick={composeEventHandlers(handleClick, onclick)}
	onfocusin={composeEventHandlers(handleFocusIn, onfocusin)}
>
	{@render children({ editing })}
</div>
