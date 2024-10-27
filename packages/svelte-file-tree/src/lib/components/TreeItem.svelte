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

	function getNextTreeItem(
		treeItem: HTMLDivElement,
		down: boolean,
	): HTMLDivElement | null {
		const next = down
			? treeItem.nextElementSibling
			: treeItem.previousElementSibling;

		if (next === null) {
			return null;
		}

		if (next instanceof HTMLDivElement && next.role === "treeitem") {
			return next;
		}

		console.error(
			`Expected the ${down ? "next" : "previous"} sibling of the tree item to be a tree item.`,
		);
		return null;
	}

	function getNodeId(treeItem: HTMLDivElement): string {
		const { nodeId } = treeItem.dataset;
		if (nodeId === undefined) {
			throw new Error("Tree item does not have a data-node-id attribute.");
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
					break;
				}

				const firstChild = node.children[0]!.getElement();
				if (firstChild !== null) {
					firstChild.focus();
				} else {
					console.error(
						`Expected the first child of the tree item ${node.id} to exist in the DOM.`,
					);
				}
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

				const parent = node.parent.getElement();
				if (parent !== null) {
					parent.focus();
				} else {
					console.error(
						`Expected the parent of the tree item ${node.id} to exist in the DOM.`,
					);
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const next = getNextTreeItem(
					event.currentTarget,
					event.key === "ArrowDown",
				);

				if (next === null) {
					break;
				}

				const shouldSelect = event.shiftKey;
				if (shouldSelect) {
					node.selected = true;
					node.tree.selected.add(getNodeId(next));
				}
				next.focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const down = event.key === "PageDown";
				const shouldSelect = event.shiftKey && isModifierKey(event);

				const { tree } = node;
				const { selected } = tree;

				const treeHeight = tree.getElement()!.clientHeight;
				const maxScrollDistance = Math.min(treeHeight, window.innerHeight);
				const itemTop = event.currentTarget.getBoundingClientRect().top;

				let current = event.currentTarget;
				while (true) {
					if (shouldSelect) {
						selected.add(getNodeId(current));
					}

					const next = getNextTreeItem(current, down);
					if (next === null) {
						break;
					}

					current = next;
					const currentTop = current.getBoundingClientRect().top;
					const distance = Math.abs(currentTop - itemTop);
					if (distance >= maxScrollDistance) {
						if (shouldSelect) {
							selected.add(getNodeId(current));
						}
						break;
					}
				}
				current.focus();
				break;
			}
			case "Home": {
				const first = node.tree.roots[0]!.getElement();
				if (first !== null) {
					first.focus();
				} else {
					console.error("Expected the first tree item to exist in the DOM.");
				}

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
				const last = node.tree.last!.getElement();
				if (last !== null) {
					last.focus();
				} else {
					console.error("Expected the last tree item to exist in the DOM.");
				}

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
			// Ideally, this situation should never happen, but events are messy.
			// Focus can be prevented by calling `event.preventDefault()` on the
			// pointerdown event. Fallback to just selecting this element.
			selected.clear();
			node.selected = true;
			return;
		}

		const tabbableElement = tree.getTreeItemElement(tabbableId);
		if (tabbableElement === null) {
			selected.clear();
			node.selected = true;
			return;
		}
		const down = tabbableElement.getBoundingClientRect().top > event.y;

		let current = event.currentTarget;
		while (true) {
			const currentId = getNodeId(current);
			selected.add(currentId);

			if (currentId === tabbableId) {
				break;
			}

			const next = getNextTreeItem(current, down);
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
