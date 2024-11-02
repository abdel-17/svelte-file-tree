<script lang="ts" module>
	const contextKey = Symbol("TreeItemContext");

	export type TreeItemContext = {
		treeItemElement: () => HTMLDivElement | null;
		onEditingChange: (value: boolean) => void;
	};

	export function getTreeItemContext(): TreeItemContext {
		if (!hasContext(contextKey)) {
			throw new Error("No parent <TreeItem> found.");
		}
		return getContext(contextKey);
	}

	function setTreeItemContext(context: TreeItemContext): void {
		setContext(contextKey, context);
	}
</script>

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
	import { getTreeViewContext } from "./TreeView.svelte";
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
		draggable?: boolean;
		ref?: HTMLDivElement | null;
	}

	let {
		node,
		children,
		editable = false,
		editing = $bindable(false),
		draggable = false,
		ref = $bindable(null),
		onkeydown,
		onclick,
		onfocusin,
		ondragstart,
		ondragend,
		ondragover,
		ondragleave,
		ondrop,
		...props
	}: Props = $props();

	const { tree, treeId, treeElement } = getTreeViewContext();

	setTreeItemContext({
		treeItemElement: () => ref,
		onEditingChange(value) {
			editing = value;
		},
	});

	$effect.pre(() => {
		if (!editable) {
			editing = false;
		}
	});

	function getTreeItemElementId(id: string): string {
		return `${treeId()}:${id}`;
	}

	function getTreeItemElement(id: string): HTMLElement | null {
		const elementId = getTreeItemElementId(id);
		return document.getElementById(elementId);
	}

	function getTreeItemElementOrWarn(id: string): HTMLElement | null {
		const element = getTreeItemElement(id);
		if (element === null) {
			console.warn(`The tree item ${id} was not found in the DOM.`);
		}
		return element;
	}

	type WithCurrentTarget<Event> = Event & { currentTarget: HTMLDivElement };

	function handleKeyDown(event: WithCurrentTarget<KeyboardEvent>): void {
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
					node.expand();
					break;
				}

				getTreeItemElementOrWarn(node.children[0].id)?.focus();
				break;
			}
			case "ArrowLeft": {
				if (node.expanded && node.children.length !== 0) {
					node.collapse();
					break;
				}

				if (node.parent !== undefined) {
					getTreeItemElementOrWarn(node.parent.id)?.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const down = event.key === "ArrowDown";
				const next = down ? node.next() : node.previous();
				if (next === undefined) {
					break;
				}
				const nextElement = getTreeItemElementOrWarn(next.id);
				if (nextElement === null) {
					break;
				}

				const shouldSelect = event.shiftKey;
				if (shouldSelect) {
					node.select();
					next.select();
				}

				nextElement.focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const down = event.key === "PageDown";
				const shouldSelect = event.shiftKey && isModifierKey(event);
				const maxScrollDistance = Math.min(
					treeElement()!.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemTop = event.currentTarget.getBoundingClientRect().top;

				let current = node;
				let currentElement: HTMLElement = event.currentTarget;
				while (true) {
					if (shouldSelect) {
						current.select();
					}

					const next = down ? current.next() : current.previous();
					if (next === undefined) {
						break;
					}
					const nextElement = getTreeItemElementOrWarn(next.id);
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
						next.select();
					}
					break;
				}
				currentElement.focus();
				break;
			}
			case "Home": {
				if (tree.roots.length === 0) {
					break;
				}

				getTreeItemElementOrWarn(tree.roots[0].id)?.focus();

				const shouldSelect = event.shiftKey && isModifierKey(event);
				if (!shouldSelect) {
					break;
				}

				for (const item of tree) {
					item.select();

					if (item === node) {
						break;
					}
				}
				break;
			}
			case "End": {
				const last = tree.last();
				if (last === undefined) {
					break;
				}

				getTreeItemElementOrWarn(last.id)?.focus();

				const shouldSelect = event.shiftKey && isModifierKey(event);
				if (!shouldSelect) {
					break;
				}

				for (const item of tree.reversed()) {
					item.select();

					if (item === node) {
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

				for (const item of tree) {
					item.select();
				}
				break;
			}
			case "*": {
				const topBefore = event.currentTarget.getBoundingClientRect().top;
				flushSync(() => {
					for (const sibling of node.siblings) {
						sibling.expand();
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

	function handleClick(event: WithCurrentTarget<MouseEvent>): void {
		const shouldToggleSelection = isModifierKey(event);
		if (shouldToggleSelection) {
			node.selected = !node.selected;
			return;
		}

		const shouldSelectMultiple = event.shiftKey;
		if (!shouldSelectMultiple) {
			tree.selected.clear();
			node.select();
			return;
		}

		// The click event is fired after the focus event, so the currently
		// tabbable element is this element. We want to select all elements
		// starting from the previously tabbable element up to this element.
		const { previousTabbable } = tree;
		if (previousTabbable === undefined) {
			return;
		}
		const previousTabbableElement = getTreeItemElement(previousTabbable);
		if (previousTabbableElement === null) {
			return;
		}
		const down = previousTabbableElement.getBoundingClientRect().top > event.y;

		let current = node;
		while (true) {
			current.select();

			if (current.id === previousTabbable) {
				break;
			}

			const next = down ? current.next() : current.previous();
			if (next === undefined) {
				break;
			}
			current = next;
		}
	}

	function handleFocusIn(): void {
		tree.onFocusTreeItem(node);
	}

	function handleDragStart(event: WithCurrentTarget<DragEvent>): void {
		tree.onDragStartTreeItem(node);

		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = "move";
		}
	}

	function handleDragEnd(): void {
		tree.onDragEndTreeItem(node);
	}

	function calculateDropPosition(
		rect: DOMRect,
		clientY: number,
	): "before" | "after" | "inside" {
		const { top, bottom, height } = rect;
		const topBoundary = top + height / 3;
		const bottomBoundary = bottom - height / 3;
		if (clientY <= topBoundary) {
			return "before";
		}
		if (clientY >= bottomBoundary) {
			return "after";
		}
		return "inside";
	}

	let dropPosition: "before" | "after" | "inside" | undefined = $state();
	let draggedOver = false;
	let dragOverThrottled = false;

	function handleDragOver(event: WithCurrentTarget<DragEvent>): void {
		if (!node.dropTarget) {
			return;
		}

		// The default behavior prevents the drop event from firing.
		event.preventDefault();

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}
		draggedOver = true;

		// The dragover event fires at a high rate. It needs to be throttled
		// to avoid performance issues.
		if (dragOverThrottled) {
			return;
		}

		dragOverThrottled = true;
		const { currentTarget, clientY } = event;
		window.requestAnimationFrame(() => {
			if (draggedOver) {
				const rect = currentTarget.getBoundingClientRect();
				dropPosition = calculateDropPosition(rect, clientY);
			}
			dragOverThrottled = false;
		});
	}

	function handleDragLeave(event: WithCurrentTarget<DragEvent>): void {
		if (!node.dropTarget) {
			return;
		}

		const { currentTarget, relatedTarget } = event;
		if (
			relatedTarget instanceof Node &&
			currentTarget.contains(relatedTarget)
		) {
			return;
		}

		draggedOver = false;
		dropPosition = undefined;
	}

	function handleDrop(event: WithCurrentTarget<DragEvent>): void {
		if (tree.dragged === undefined) {
			return;
		}

		const { currentTarget, clientY } = event;
		const rect = currentTarget.getBoundingClientRect();
		dropPosition = calculateDropPosition(rect, clientY);
		tree.onDropTreeItem(node, dropPosition);

		flushSync();
		getTreeItemElementOrWarn(tree.dragged)?.focus();

		draggedOver = false;
		dropPosition = undefined;
	}
</script>

<div
	{...props}
	bind:this={ref}
	id={getTreeItemElementId(node.id)}
	role="treeitem"
	aria-level={node.level}
	aria-posinset={node.index + 1}
	aria-setsize={node.siblings.length}
	aria-expanded={node.children.length !== 0 ? node.expanded : undefined}
	aria-selected={node.selected}
	tabindex={node.id === tree.tabbable ? 0 : -1}
	{draggable}
	data-dragged={node.dragged ? "" : undefined}
	data-drop-position={dropPosition}
	onkeydown={composeEventHandlers(handleKeyDown, onkeydown)}
	onclick={composeEventHandlers(handleClick, onclick)}
	onfocusin={composeEventHandlers(handleFocusIn, onfocusin)}
	ondragstart={composeEventHandlers(handleDragStart, ondragstart)}
	ondragend={composeEventHandlers(handleDragEnd, ondragend)}
	ondragover={composeEventHandlers(handleDragOver, ondragover)}
	ondragleave={composeEventHandlers(handleDragLeave, ondragleave)}
	ondrop={composeEventHandlers(handleDrop, ondrop)}
>
	{@render children({ editing })}
</div>
