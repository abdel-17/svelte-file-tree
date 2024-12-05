<script lang="ts">
	import { FileTreeNode, FolderNode } from "$lib/data/tree.svelte.js";
	import { flushSync, type Snippet } from "svelte";
	import type { EventHandler, HTMLAttributes } from "svelte/elements";
	import { isControlOrMeta } from "./helpers.js";
	import { TreeItemState, type EnumeratedTreeItem } from "./state.svelte.js";
	import { getTreeItemContext } from "./TreeItemContextProvider.svelte";

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
		editable?: boolean;
		children: Snippet<[item: TreeItemState]>;
		element?: HTMLDivElement | null;
		onMoveItem?: (node: FileTreeNode, index: number) => void;
		onDeleteItems?: (nodes: FileTreeNode[]) => void;
	}

	let {
		editable = false,
		children,
		element = $bindable(null),
		onMoveItem,
		onDeleteItems,
		onfocusin,
		onkeydown,
		onclick,
		ondragstart,
		ondragenter,
		ondragover,
		ondragleave,
		ondrop,
		ondragend,
		...attributes
	}: Props = $props();

	const { treeState, itemState } = getTreeItemContext();
	const node = $derived(itemState.node);
	const index = $derived(itemState.index);

	$effect(() => {
		if (!editable) {
			itemState.editing = false;
		}
	});

	const handleFocusIn: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		onfocusin?.(event);

		treeState.tabbableId = node.id;
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
		onkeydown?.(event);

		if (event.target !== event.currentTarget) {
			// Don't handle keydown events that bubble up from elements inside
			// like inputs and buttons to avoid conflicting with their behavior.
			return;
		}

		switch (event.key) {
			case "ArrowRight": {
				if (!node.isFolder()) {
					break;
				}

				if (!node.expanded) {
					node.expand();
				} else if (node.children.length !== 0) {
					treeState.getItemElement(node.children[0])?.focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (node.isFolder() && node.expanded) {
					node.collapse();
				} else if (node.parent !== undefined) {
					treeState.getItemElement(node.parent)?.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const down = event.key === "ArrowDown";
				const next = down
					? treeState.getNextItem({ node, index })
					: treeState.getPreviousItem({ node, index });
				if (next === undefined) {
					break;
				}

				const nextElement = treeState.getItemElement(next.node);
				if (nextElement === null) {
					break;
				}

				if (event.shiftKey) {
					node.select();
					next.node.select();
				}
				nextElement.focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const down = event.key === "PageDown";
				const maxScrollDistance = Math.min(
					treeState.getTreeElement()!.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current = { node, index };
				let currentElement: HTMLElement = event.currentTarget;
				while (true) {
					const next = down ? treeState.getNextItem(current) : treeState.getPreviousItem(current);
					if (next === undefined) {
						break;
					}

					const nextElement = treeState.getItemElement(next.node);
					if (nextElement === null) {
						break;
					}

					const nextRect = nextElement.getBoundingClientRect();
					const distance = Math.abs(nextRect.top - itemRect.top);
					if (distance > maxScrollDistance) {
						break;
					}

					if (event.shiftKey) {
						current.node.select();
					}
					current = next;
					currentElement = nextElement;
				}

				if (current.node === node) {
					break;
				}

				if (event.shiftKey) {
					current.node.select();
				}
				currentElement.focus();
				break;
			}
			case "Home": {
				const first = node.tree.nodes[0];
				if (first === node) {
					break;
				}

				const firstElement = treeState.getItemElement(first);
				if (firstElement === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: EnumeratedTreeItem | undefined = { node, index };
					do {
						current.node.select();
						current = treeState.getPreviousItem(current);
					} while (current !== undefined);
				}
				firstElement.focus();
				break;
			}
			case "End": {
				let last = node.tree.nodes.at(-1)!;
				while (last.isFolder() && last.expanded && last.children.length !== 0) {
					last = last.children.at(-1)!;
				}

				if (last === node) {
					break;
				}

				const lastElement = treeState.getItemElement(last);
				if (lastElement === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: EnumeratedTreeItem | undefined = { node, index };
					do {
						current.node.select();
						current = treeState.getNextItem(current);
					} while (current !== undefined);
				}
				lastElement.focus();
				break;
			}
			case " ": {
				if (event.shiftKey) {
					treeState.batchSelect(node, event.currentTarget);
				} else {
					node.toggleSelection();
				}
				break;
			}
			case "F2": {
				if (editable) {
					itemState.editing = true;
				}
				break;
			}
			case "a": {
				if (isControlOrMeta(event)) {
					node.tree.selectAll();
				}
				break;
			}
			case "Escape": {
				node.tree.selected.clear();
				break;
			}
			case "*": {
				const rectBefore = event.currentTarget.getBoundingClientRect();
				for (const sibling of itemState.node.siblings) {
					if (sibling.isFolder()) {
						sibling.expand();
					}
				}

				// After the sibling nodes are all expanded, the tree's height changes,
				// causing a lot of layout shift. Preserve the position of the focused
				// node relative to the viewport to avoid disorienting the user.
				flushSync();
				const rectAfter = event.currentTarget.getBoundingClientRect();
				window.scrollBy(0, rectAfter.top - rectBefore.top);
				break;
			}
			case "Delete": {
				const { tree } = node;
				const { selected } = tree;
				if (selected.size === 0) {
					break;
				}

				// Focus the first item that will not be deleted.
				let fallback: EnumeratedTreeItem | undefined;
				if (node.selected) {
					fallback = { node, index };
					do {
						// Avoid focusing a child of an item that is about to be deleted.
						if (fallback.node.isFolder() && fallback.node.expanded) {
							fallback.node.collapse();
						}

						fallback = treeState.getNextItem(fallback);
					} while (fallback !== undefined && fallback.node.selected);

					if (fallback === undefined) {
						fallback = { node, index };
						do {
							fallback = treeState.getPreviousItem(fallback);
						} while (fallback !== undefined && fallback.node.selected);
					}
				}

				const deleted: FileTreeNode[] = [];
				tree.nodes = treeState.deletingSelected(tree.nodes, deleted);

				// Collect the unique parents of the remaining selected items to delete
				// the their children in one operation. If, instead, we delete each item
				// individually, it would be very inefficient because a potentially large
				// portion of the array is repeatedly left-shifted.
				//
				// For example:
				// 1 2 3 4 5 ...
				//
				// Let's say 1 and 3 are selected. First, we delete 1, which shifts the
				// entire array to the left.
				//   2 3 4 5 ...
				// 2 3 4 5 ...
				//
				// Then we delete 3, which shifts most of the array to the left, AGAIN.
				// 2   4 5 ...
				// 2 4 5 ...
				const uniqueParents = new Set<FolderNode>();
				for (const id of selected) {
					const item = treeState.items.get(id);
					if (item === undefined) {
						tree.selected.delete(id);
					} else {
						uniqueParents.add(item.node.parent!);
					}
				}

				// Sort parents by depth to avoid inconsistent behavior with `onItemDeleted`.
				//
				// For example:
				// 1
				// -- 1.1      (selected)
				// ---- 1.1.1  (selected)
				// -- 1.2
				// 2
				//
				// If 1.1.1 was selected before 1.1, 1.1.1 would be deleted first,
				// so both would be pushed to `deleted`.
				//
				// If 1.1 was selected before 1.1.1, 1.1 would be deleted first,
				// which removes 1.1.1 from `selected`. When 1.1.1 is deleted,
				// it's no longer selected, so it won't be pushed to `deleted`.
				//
				// This is also more efficient because, for each delete operation,
				// we have to traverse the entire subtree, so if we delete 1.1.1
				// first, we would have to traverse it AGAIN when 1.1 is deleted.
				const parents = Array.from(uniqueParents).sort((a, b) => a.depth - b.depth);
				for (const parent of parents) {
					parent.children = treeState.deletingSelected(parent.children, deleted);
				}

				if (fallback !== undefined) {
					treeState.getItemElement(fallback.node)?.focus();
				}

				onDeleteItems?.(deleted);
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	const handleClick: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		onclick?.(event);

		if (isControlOrMeta(event)) {
			node.toggleSelection();
			return;
		}

		if (event.shiftKey) {
			treeState.batchSelect(node, event.currentTarget);
			return;
		}

		node.tree.selected.clear();
		node.select();
	};

	const handleDragStart: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragstart?.(event);

		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = "move";
		}
		treeState.draggedId = node.id;
	};

	const handleDragEnter: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragenter?.(event);

		if (treeState.draggedId === undefined || treeState.draggedId === node.id) {
			return;
		}

		// An item cannot be dropped inside itself.
		const dragged = treeState.items.get(treeState.draggedId)!;
		if (dragged.node.isFolder() && dragged.node.contains(node)) {
			return;
		}

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}
		event.preventDefault();
		itemState.dropPosition = treeState.getDropPosition(node, event.currentTarget, event.clientY);
	};

	// The dragover event fires at a high rate, so computing
	// the drop position needs to be throttled to avoid jank.
	let dragOverThrottled = false;

	const handleDragOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragover?.(event);

		if (itemState.dropPosition === undefined) {
			return;
		}

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}
		event.preventDefault();

		if (dragOverThrottled) {
			return;
		}

		// We need to destructure the event because `currentTarget`
		// is set to null after the event is handled.
		const { currentTarget, clientY } = event;

		dragOverThrottled = true;
		window.requestAnimationFrame(() => {
			if (itemState.dropPosition !== undefined) {
				itemState.dropPosition = treeState.getDropPosition(node, currentTarget, clientY);
			}
			dragOverThrottled = false;
		});
	};

	const handleDragLeave: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragleave?.(event);

		if (itemState.dropPosition === undefined) {
			return;
		}

		const { currentTarget, relatedTarget } = event;
		if (relatedTarget instanceof Node && currentTarget.contains(relatedTarget)) {
			return;
		}

		itemState.dropPosition = undefined;
	};

	const handleDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondrop?.(event);

		if (treeState.draggedId === undefined) {
			return;
		}

		const dragged = treeState.items.get(treeState.draggedId)!;
		const dropPosition = treeState.getDropPosition(node, event.currentTarget, event.clientY);
		itemState.dropPosition = undefined;

		let dropIndex: number;
		switch (dropPosition) {
			case "before":
			case "after": {
				if (dragged.node.parent !== node.parent) {
					dragged.node.siblings.splice(dragged.index, 1);
					dragged.node.parent = node.parent;
					dropIndex = dropPosition === "before" ? index : index + 1;
					node.siblings.splice(dropIndex, 0, dragged.node);

					// The dragged item is removed temporarily from the DOM, so it loses focus.
					flushSync();
					treeState.getItemElement(dragged.node)?.focus();
					break;
				}

				// Instead of removing the dragged item and inserting it back to the
				// same array, we can repeatedly swap it with its adjacent sibling
				// until it reaches the new index, which is more efficient.
				if (dragged.index < index) {
					// 1 - 2 - 3 - 4 - 5
					// ^             ^
					// 2 - 1 - 3 - 4 - 5
					// 2 - 3 - 1 - 4 - 5
					// 2 - 3 - 4 - 1 - 5
					dropIndex = dropPosition === "before" ? index - 1 : index;
					for (let i = dragged.index; i < dropIndex; i++) {
						const current = node.siblings[i];
						node.siblings[i] = node.siblings[i + 1];
						node.siblings[i + 1] = current;
					}
				} else {
					// 1 - 2 - 3 - 4 - 5
					//   ^         ^
					// 1 - 2 - 4 - 3 - 5
					// 1 - 4 - 2 - 3 - 5
					dropIndex = dropPosition === "before" ? index : index + 1;
					for (let i = dragged.index; i > dropIndex; i--) {
						const current = node.siblings[i];
						node.siblings[i] = node.siblings[i - 1];
						node.siblings[i - 1] = current;
					}
				}
				break;
			}
			case "inside": {
				if (!node.isFolder()) {
					throw new Error("Cannot drop an item inside a file");
				}

				dragged.node.siblings.splice(dragged.index, 1);
				dragged.node.parent = node;
				node.expand();
				dropIndex = node.children.length;
				node.children.push(dragged.node);

				// The dragged item is removed temporarily from the DOM, so it loses focus.
				flushSync();
				treeState.getItemElement(dragged.node)?.focus();
				break;
			}
		}

		onMoveItem?.(dragged.node, dropIndex);
	};

	const handleDragEnd: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragend?.(event);

		treeState.draggedId = undefined;
	};
</script>

<div
	{...attributes}
	bind:this={element}
	id={treeState.getItemElementId(node)}
	role="treeitem"
	aria-selected={node.selected}
	aria-expanded={node.isFolder() ? node.expanded : undefined}
	aria-level={node.depth + 1}
	aria-posinset={index + 1}
	aria-setsize={node.siblings.length}
	tabindex={treeState.getItemTabIndex(node)}
	data-editing={itemState.editing ? "" : undefined}
	data-dragged={itemState.dragged ? "" : undefined}
	data-drop-position={itemState.dropPosition}
	onfocusin={handleFocusIn}
	onkeydown={handleKeyDown}
	onclick={handleClick}
	ondragstart={handleDragStart}
	ondragenter={handleDragEnter}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	ondragend={handleDragEnd}
>
	{@render children(itemState)}
</div>
