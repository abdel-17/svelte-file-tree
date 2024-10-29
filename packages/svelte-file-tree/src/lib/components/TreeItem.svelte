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
		children: Snippet<[{ editing: boolean }]>;
		editable?: boolean;
		editing?: boolean;
		ref?: HTMLDivElement | null;
	}

	let {
		node,
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

	function getTreeItemElementOrWarn(node: TreeNode<Value>): HTMLElement | null {
		const element = treeContext.getTreeItemElement(node.id);
		if (element === null) {
			console.warn(`Expected the tree item ${node.id} to exist in the DOM.`);
		}
		return element;
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
					break;
				}

				getTreeItemElementOrWarn(node.children[0])?.focus();
				break;
			}
			case "ArrowLeft": {
				if (node.expanded && node.children.length !== 0) {
					node.expanded = false;
					break;
				}

				if (node.parent === null) {
					break;
				}

				getTreeItemElementOrWarn(node.parent)?.focus();
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const down = event.key === "ArrowDown";
				const next = down ? node.next : node.previous;
				if (next === null) {
					break;
				}
				const nextElement = getTreeItemElementOrWarn(next);
				if (nextElement === null) {
					break;
				}

				const shouldSelect = event.shiftKey;
				if (shouldSelect) {
					node.selected = true;
					next.selected = true;
				}
				nextElement.focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const down = event.key === "PageDown";
				const shouldSelect = event.shiftKey && isModifierKey(event);

				const treeHeight = treeContext.getTreeElement()!.clientHeight;
				const maxScrollDistance = Math.min(treeHeight, window.innerHeight);
				const itemTop = event.currentTarget.getBoundingClientRect().top;

				let current = node;
				let currentElement: HTMLElement = event.currentTarget;
				while (true) {
					if (shouldSelect) {
						current.selected = true;
					}

					const next = down ? current.next : current.previous;
					if (next === null) {
						break;
					}
					const nextElement = getTreeItemElementOrWarn(next);
					if (nextElement === null) {
						break;
					}
					current = next;
					currentElement = nextElement;

					const currentTop = currentElement.getBoundingClientRect().top;
					const distance = Math.abs(currentTop - itemTop);
					if (distance < maxScrollDistance) {
						continue;
					}

					if (shouldSelect) {
						current.selected = true;
					}
					break;
				}
				currentElement.focus();
				break;
			}
			case "Home": {
				getTreeItemElementOrWarn(node.tree.first!)?.focus();

				const shouldSelect = event.shiftKey && isModifierKey(event);
				if (!shouldSelect) {
					break;
				}

				for (const current of node.tree) {
					current.selected = true;

					if (current === node) {
						break;
					}
				}
				break;
			}
			case "End": {
				getTreeItemElementOrWarn(node.tree.last!)?.focus();

				const shouldSelect = event.shiftKey && isModifierKey(event);
				if (!shouldSelect) {
					break;
				}

				for (const current of node.tree.reversed()) {
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
				const shouldSelectAll = isModifierKey(event);
				if (!shouldSelectAll) {
					break;
				}

				for (const item of node.tree) {
					item.selected = true;
				}
				break;
			}
			case "*": {
				const topBefore = event.currentTarget.getBoundingClientRect().top;
				flushSync(() => {
					for (const sibling of node.level) {
						sibling.expanded = true;
					}
				});
				// After the sibling nodes are all expanded, the tree's height changes,
				// causing a lot of layout shift. Preserve the position of the focused
				// node relative to the viewport to avoid disorienting the user.
				const topAfter = event.currentTarget.getBoundingClientRect().top;
				window.scrollBy(0, topAfter - topBefore);
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	}

	function handleClick(event: WithCurrentTarget<MouseEvent>) {
		const shouldToggleSelection = isModifierKey(event);
		if (shouldToggleSelection) {
			node.selected = !node.selected;
			return;
		}

		const { tree } = node;
		const { selected } = tree;

		const shouldSelectMultiple = event.shiftKey;
		if (!shouldSelectMultiple) {
			selected.clear();
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
		const tabbableElementId = treeContext.getTreeItemElementId(tabbableId);
		const tabbableElement = document.getElementById(tabbableElementId);
		if (tabbableElement === null) {
			return;
		}
		const down = tabbableElement.getBoundingClientRect().top > event.y;

		let current = node;
		let currentElement: HTMLElement = event.currentTarget;
		while (true) {
			current.selected = true;

			if (current.id === tabbableId) {
				break;
			}

			const next = down ? current.next : current.previous;
			if (next === null) {
				break;
			}
			const nextElement = getTreeItemElementOrWarn(next);
			if (nextElement === null) {
				break;
			}
			current = next;
			currentElement = nextElement;
		}
	}

	function handleFocusIn() {
		treeContext.tabbableId = node.id;
	}
</script>

<div
	{...props}
	bind:this={ref}
	id={treeContext.getTreeItemElementId(node.id)}
	role="treeitem"
	aria-level={node.depth + 1}
	aria-posinset={node.levelIndex + 1}
	aria-setsize={node.level.length}
	aria-expanded={node.children.length !== 0 ? node.expanded : undefined}
	aria-selected={node.selected}
	tabindex={node.id === treeContext.tabbableId ? 0 : -1}
	onkeydown={composeEventHandlers(handleKeyDown, onkeydown)}
	onclick={composeEventHandlers(handleClick, onclick)}
	onfocusin={composeEventHandlers(handleFocusIn, onfocusin)}
>
	{@render children({ editing })}
</div>
