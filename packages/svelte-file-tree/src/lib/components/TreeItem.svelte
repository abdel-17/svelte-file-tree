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
		| "aria-selected"
		| "aria-expanded"
		| "aria-level"
		| "aria-posinset"
		| "aria-setsize"
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

	function getTreeItemElementById(id: string): HTMLElement | null {
		const elementId = getTreeItemElementId(id);
		return document.getElementById(elementId);
	}

	function getTreeItemElement(node: TreeNode<unknown>): HTMLElement {
		const { id } = node;
		const element = getTreeItemElementById(id);
		if (element === null) {
			throw new Error(`Tree item ${id} was not found in the DOM.`);
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
				const firstChild = node.children[0];
				if (firstChild === undefined) {
					break;
				}

				if (!node.expanded) {
					node.expand();
				} else {
					getTreeItemElement(firstChild).focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (node.expanded && node.children.length !== 0) {
					node.collapse();
					break;
				}

				const { parent } = node;
				if (parent !== undefined) {
					getTreeItemElement(parent).focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const down = event.key === "ArrowDown";
				const next = down ? node.next : node.previous;
				if (next === undefined) {
					break;
				}
				getTreeItemElement(next).focus();

				const shouldSelect = event.shiftKey;
				if (shouldSelect) {
					node.select();
					next.select();
				}
				break;
			}
			case "PageDown":
			case "PageUp": {
				const down = event.key === "PageDown";
				const next = down ? node.next : node.previous;
				if (next === undefined) {
					break;
				}

				const shouldSelect = event.shiftKey && isModifierKey(event);
				if (shouldSelect) {
					node.select();
					next.select();
				}

				const maxScrollDistance = Math.min(
					treeElement()!.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemTop = event.currentTarget.getBoundingClientRect().top;

				let current = next;
				let currentElement = getTreeItemElement(current);
				while (true) {
					const next = down ? current.next : current.previous;
					if (next === undefined) {
						break;
					}
					current = next;
					currentElement = getTreeItemElement(current);

					if (shouldSelect) {
						current.select();
					}

					const currentTop = currentElement.getBoundingClientRect().top;
					const distance = Math.abs(currentTop - itemTop);
					if (distance >= maxScrollDistance) {
						break;
					}
				}
				currentElement.focus();
				break;
			}
			case "Home": {
				const first = tree.roots[0];
				if (first === undefined || first === node) {
					break;
				}
				getTreeItemElement(first).focus();

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
				const { last } = tree;
				if (last === undefined || last === node) {
					break;
				}
				getTreeItemElement(last).focus();

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
				for (const sibling of node.siblings) {
					sibling.expand();
				}

				// After the sibling nodes are all expanded, the tree's height changes,
				// causing a lot of layout shift. Preserve the position of the focused
				// node relative to the viewport to avoid disorienting the user.
				flushSync();
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

		const previousTabbableElement = getTreeItemElementById(previousTabbable);
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

			const next = down ? current.next : current.previous;
			if (next === undefined) {
				break;
			}
			current = next;
		}
	}

	function handleFocusIn(): void {
		tree.tabbable = node.id;
	}

	function handleDragStart(event: WithCurrentTarget<DragEvent>): void {
		tree.dragged = node.id;

		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = "move";
		}
	}

	function handleDragEnd(): void {
		tree.dragged = undefined;
	}

	function calculateDropPosition(
		dropTarget: HTMLElement,
		clientY: number,
	): "before" | "after" | "inside" {
		const { top, bottom, height } = dropTarget.getBoundingClientRect();
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
				dropPosition = calculateDropPosition(currentTarget, clientY);
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
		const draggedId = tree.dragged;
		if (draggedId === undefined) {
			return;
		}

		const dragged = tree.get(draggedId);
		if (dragged === undefined) {
			return;
		}

		const { currentTarget, clientY } = event;
		dropPosition = calculateDropPosition(currentTarget, clientY);
		dragged.move(dropPosition, node);

		if (dropPosition === "inside") {
			node.expand();
		}

		tree.selected.clear();
		dragged.select();

		flushSync();
		getTreeItemElement(dragged).focus();

		draggedOver = false;
		dropPosition = undefined;
	}
</script>

<div
	{...props}
	bind:this={ref}
	id={getTreeItemElementId(node.id)}
	role="treeitem"
	aria-selected={node.selected}
	aria-expanded={node.children.length !== 0 ? node.expanded : undefined}
	aria-level={node.level}
	aria-posinset={node.index + 1}
	aria-setsize={node.siblings.length}
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
