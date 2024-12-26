<script lang="ts">
import { isControlOrMeta } from "$lib/shared.js";
import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import { flushSync } from "svelte";
import type { EventHandler } from "svelte/elements";
import { getTreeItemProviderContext } from "../Tree/context.js";
import type { TreeItemData } from "../Tree/types.js";
import {
	batchSelect,
	cloneNode,
	getElement,
	getElementId,
	getNext,
	getPrevious,
	getSiblings,
	onDelete,
} from "./helpers.js";
import type { TreeItemProps } from "./types.js";

const {
	treeContext: { treeState, getTree, getTreeId, callbacks },
	itemState,
	getNode,
	getIndex,
	getParent,
	getDepth,
} = getTreeItemProviderContext();

const tree = $derived.by(getTree);
const treeId = $derived.by(getTreeId);
const node = $derived.by(getNode);
const index = $derived.by(getIndex);
const parent = $derived.by(getParent);
const depth = $derived.by(getDepth);

let {
	children,
	editable = false,
	element = $bindable(null),
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
}: TreeItemProps = $props();

$effect(() => {
	treeState.setItem({ node, index, parent });
});

$effect(() => {
	return () => {
		treeState.deleteItem(node.id);
	};
});

const handleFocusIn: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
	onfocusin?.(event);

	treeState.setTabbable(node);
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
			if (node.type === "file") {
				break;
			}

			if (!node.expanded) {
				node.expand();
			} else if (node.children.length !== 0) {
				getElement(treeId, node.children[0])?.focus();
			}
			break;
		}
		case "ArrowLeft": {
			if (node.type === "folder" && node.expanded) {
				node.collapse();
			} else if (parent !== undefined) {
				getElement(treeId, parent.node)?.focus();
			}
			break;
		}
		case "ArrowDown":
		case "ArrowUp": {
			const current = { node, index, parent };
			const next = event.key === "ArrowDown" ? getNext(tree, current) : getPrevious(tree, current);
			if (next === undefined) {
				break;
			}

			const nextElement = getElement(treeId, next.node);
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
				document.getElementById(treeId)!.clientHeight,
				document.documentElement.clientHeight,
			);
			const itemRect = event.currentTarget.getBoundingClientRect();

			let current = { node, index, parent };
			let currentElement: HTMLElement = event.currentTarget;
			while (true) {
				const next = down ? getNext(tree, current) : getPrevious(tree, current);
				if (next === undefined) {
					break;
				}

				const nextElement = getElement(treeId, next.node);
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
			const first = tree.nodes[0];
			if (first === node) {
				break;
			}

			const firstElement = getElement(treeId, first);
			if (firstElement === null) {
				break;
			}

			if (event.shiftKey && isControlOrMeta(event)) {
				let current: TreeItemData | undefined = { node, index, parent };
				do {
					current.node.select();
					current = getPrevious(tree, current);
				} while (current !== undefined);
			}

			firstElement.focus();
			break;
		}
		case "End": {
			let last = tree.nodes[tree.nodes.length - 1];
			while (last.type === "folder" && last.expanded && last.children.length !== 0) {
				last = last.children[last.children.length - 1];
			}

			if (last === node) {
				break;
			}

			const lastElement = getElement(treeId, last);
			if (lastElement === null) {
				break;
			}

			if (event.shiftKey && isControlOrMeta(event)) {
				let current: TreeItemData | undefined = { node, index, parent };
				do {
					current.node.select();
					current = getNext(tree, current);
				} while (current !== undefined);
			}

			lastElement.focus();
			break;
		}
		case " ": {
			if (event.shiftKey) {
				batchSelect(treeState, tree, treeId, node, event.currentTarget);
			} else {
				node.toggleSelected();
			}
			break;
		}
		case "Escape": {
			tree.selected.clear();
			tree.copied.clear();
			break;
		}
		case "*": {
			const siblings = getSiblings(tree, parent);
			for (const sibling of siblings) {
				if (sibling.type === "folder") {
					sibling.expand();
				}
			}

			// After the sibling items are expanded, the tree's height changes,
			// causing layout shift. Preserve the scroll position relative to
			// the current item to avoid disorienting the user.
			const rectBefore = event.currentTarget.getBoundingClientRect();
			flushSync();
			const rectAfter = event.currentTarget.getBoundingClientRect();
			window.scrollBy(0, rectAfter.top - rectBefore.top);
			break;
		}
		case "F2": {
			if (!editable) {
				break;
			}

			itemState.editing = true;
			break;
		}
		case "Delete": {
			// Collect the unique parents of the remaining selected items to delete
			// their selected children in one operation. If, instead, we delete each
			// item	individually, it would be very inefficient because a potentially
			// large portion of the array is repeatedly left-shifted.
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
			const deleted: FileTreeNode[] = [];
			const parentsOfDeleted = new Set<TreeItemData<FolderNode> | undefined>();
			for (const id of tree.selected) {
				const current = treeState.getItem(id);
				if (current === undefined) {
					continue;
				}

				// Don't delete an item twice. If an ancestor is selected,
				// its entire subtree will also be deleted.
				let hasSelectedAncestor = false;
				{
					let ancestor = current.parent;
					while (ancestor !== undefined) {
						if (ancestor.node.selected) {
							hasSelectedAncestor = true;
							break;
						}
						ancestor = ancestor.parent;
					}
				}

				if (hasSelectedAncestor) {
					continue;
				}

				deleted.push(current.node);
				parentsOfDeleted.add(current.parent);
			}

			if (deleted.length === 0) {
				break;
			}

			let focusTarget: TreeItemData | undefined = { node, index, parent };
			while (true) {
				let nearestUnselected: TreeItemData | undefined = focusTarget;
				while (nearestUnselected?.node.selected) {
					// The current item will be deleted, so we shouldn't traverse its children.
					tree.expanded.delete(nearestUnselected.node.id);
					nearestUnselected = getNext(tree, nearestUnselected);
				}

				if (nearestUnselected === undefined) {
					nearestUnselected = focusTarget;
					while (nearestUnselected?.node.selected) {
						nearestUnselected = getPrevious(tree, nearestUnselected);
					}
				}

				focusTarget = nearestUnselected;
				if (focusTarget === undefined) {
					break;
				}

				// If an item is not selected but one of its ancestors is, it will be deleted.
				let selectedAncestor: TreeItemData | undefined;
				{
					let ancestor = focusTarget.parent;
					while (ancestor !== undefined) {
						if (ancestor.node.selected) {
							selectedAncestor = ancestor;
						}
						ancestor = ancestor.parent;
					}
				}

				if (selectedAncestor === undefined) {
					break;
				}

				focusTarget = selectedAncestor;
			}

			for (const parent of parentsOfDeleted) {
				if (parent === undefined) {
					tree.nodes = tree.nodes.filter((node) => !node.selected);
				} else {
					parent.node.children = parent.node.children.filter((child) => !child.selected);
				}
			}

			if (focusTarget !== undefined) {
				getElement(treeId, focusTarget.node)?.focus();
			}

			onDelete(tree, deleted);
			callbacks.onDeleteItems(deleted);
			break;
		}
		case "a": {
			if (!isControlOrMeta(event)) {
				break;
			}

			tree.selectAll();
			break;
		}
		case "c": {
			if (!isControlOrMeta(event)) {
				break;
			}

			tree.copy(tree.selected);
			break;
		}
		case "v": {
			if (!isControlOrMeta(event)) {
				break;
			}

			const pasted: FileTreeNode[] = [];
			for (const id of tree.copied) {
				const current = treeState.getItem(id);
				if (current === undefined) {
					continue;
				}

				// Don't paste an item twice. If an ancestor is copied,
				// its entire subtree will also be pasted.
				let hasCopiedAncestor = false;
				{
					let ancestor = current.parent;
					while (ancestor !== undefined) {
						if (ancestor.node.copied) {
							hasCopiedAncestor = true;
							break;
						}
						ancestor = ancestor.parent;
					}
				}

				if (hasCopiedAncestor) {
					continue;
				}

				const clone = cloneNode(tree, current.node);
				pasted.push(clone);
			}

			if (pasted.length === 0) {
				break;
			}

			const shouldPasteInside = node.type === "folder" && node.expanded;
			const pasteTarget = shouldPasteInside ? node.children : getSiblings(tree, parent);

			const uniqueNames = new Set<string>();
			for (const sibling of pasteTarget) {
				uniqueNames.add(sibling.name);
			}

			for (const current of pasted) {
				let i = 1;
				let { name } = current;
				while (uniqueNames.has(name)) {
					i++;
					name = `${current.name} (${i})`;
				}
				current.name = name;
				uniqueNames.add(name);
			}

			let pasteIndex: number;
			if (shouldPasteInside) {
				pasteIndex = pasteTarget.length;
				pasteTarget.push(...pasted);
			} else {
				pasteIndex = index + 1;
				pasteTarget.splice(pasteIndex, 0, ...pasted);
			}

			tree.copied.clear();
			callbacks.onInsertItems(pasteTarget, pasteIndex, pasted.length);
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
		node.toggleSelected();
	} else if (event.shiftKey) {
		batchSelect(treeState, tree, treeId, node, event.currentTarget);
	} else {
		tree.selected.clear();
		tree.selected.add(node.id);
	}
};

const handleDragStart: EventHandler<DragEvent, HTMLDivElement> = (event) => {
	ondragstart?.(event);

	treeState.setDragged(node);

	if (event.dataTransfer !== null) {
		event.dataTransfer.effectAllowed = "move";
	}
};

const handleDragEnter: EventHandler<DragEvent, HTMLDivElement> = (event) => {
	ondragenter?.(event);

	if (!treeState.hasDragged()) {
		return;
	}

	{
		// Prevent the dragged item from being dropped inside itself.
		let current: TreeItemData | undefined = { node, index, parent };
		do {
			if (treeState.isDragged(current.node)) {
				return;
			}
			current = current.parent;
		} while (current !== undefined);
	}

	itemState.updateDropPosition(node, event.currentTarget.getBoundingClientRect(), event.clientY);

	if (event.dataTransfer !== null) {
		event.dataTransfer.dropEffect = "move";
	}

	event.preventDefault();
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

	// Destructure the event early because `event.currentTarget`
	// is set to `null` after the event is handled.
	const { currentTarget, clientY } = event;

	dragOverThrottled = true;
	window.requestAnimationFrame(() => {
		if (itemState.dropPosition !== undefined) {
			itemState.updateDropPosition(node, currentTarget.getBoundingClientRect(), clientY);
		}

		dragOverThrottled = false;
	});
};

const handleDragLeave: EventHandler<DragEvent, HTMLDivElement> = (event) => {
	ondragleave?.(event);

	const { currentTarget, relatedTarget } = event;
	if (relatedTarget instanceof Node && currentTarget.contains(relatedTarget)) {
		return;
	}

	itemState.clearDropPosition();
};

// TODO: dnd multiple items at once
const handleDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
	ondrop?.(event);

	const dragged = treeState.getDragged();
	if (dragged === undefined) {
		return;
	}

	const dropPosition = itemState.updateDropPosition(
		node,
		event.currentTarget.getBoundingClientRect(),
		event.clientY,
	);

	let dropTarget: FileTreeNode[];
	let dropIndex: number;
	switch (dropPosition) {
		case "before":
		case "after": {
			if (dragged.parent !== parent) {
				// Remove the dragged item from its parent.
				getSiblings(tree, dragged.parent).splice(dragged.index, 1);

				// Insert the dragged item into the new parent.
				dropTarget = getSiblings(tree, parent);
				dropIndex = dropPosition === "before" ? index : index + 1;
				dropTarget.splice(dropIndex, 0, dragged.node);

				// The dragged item is removed temporarily from the DOM, so it loses focus.
				flushSync();
				getElement(treeId, dragged.node)?.focus();
				break;
			}

			// Instead of removing the dragged item and inserting it back to the
			// same array, we can repeatedly swap it with its adjacent sibling
			// until it reaches the new index, which is more efficient.
			dropTarget = getSiblings(tree, parent);
			if (dragged.index < index) {
				// Case 1: Swap right
				//
				// 1 - 2 - 3 - 4 - 5
				// ^             *
				// 2 - 1 - 3 - 4 - 5
				// 2 - 3 - 1 - 4 - 5
				// 2 - 3 - 4 - 1 - 5
				dropIndex = dropPosition === "before" ? index - 1 : index;
				for (let i = dragged.index; i < dropIndex; i++) {
					const current = dropTarget[i];
					dropTarget[i] = dropTarget[i + 1];
					dropTarget[i + 1] = current;
				}
			} else {
				// Case 2: Swap left
				//
				// 1 - 2 - 3 - 4 - 5
				//   *         ^
				// 1 - 2 - 4 - 3 - 5
				// 1 - 4 - 2 - 3 - 5
				dropIndex = dropPosition === "before" ? index : index + 1;
				for (let i = dragged.index; i > dropIndex; i--) {
					const current = dropTarget[i];
					dropTarget[i] = dropTarget[i - 1];
					dropTarget[i - 1] = current;
				}
			}
			break;
		}
		case "inside": {
			if (node.type === "file") {
				throw new Error("Cannot drop an item inside a file");
			}

			// Remove the dragged item from its parent.
			getSiblings(tree, dragged.parent).splice(dragged.index, 1);

			// Insert the dragged item into the new parent.
			dropTarget = node.children;
			dropIndex = dropTarget.length;
			dropTarget.push(dragged.node);

			// The dragged item is removed temporarily from the DOM, so it loses focus.
			flushSync();
			getElement(treeId, dragged.node)?.focus();
			break;
		}
	}

	itemState.clearDropPosition();
	callbacks.onMoveItems(dropTarget, dropIndex, 1);
};

const handleDragEnd: EventHandler<DragEvent, HTMLDivElement> = (event) => {
	ondragend?.(event);

	treeState.clearDragged();
};
</script>

<div
	{...attributes}
	bind:this={element}
	id={getElementId(treeId, node)}
	role="treeitem"
	aria-selected={node.selected}
	aria-expanded={node.type === "folder" ? node.expanded : undefined}
	aria-level={depth + 1}
	aria-posinset={index + 1}
	aria-setsize={getSiblings(tree, parent).length}
	tabindex={treeState.isTabbable(tree, node) ? 0 : -1}
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
	{@render children()}
</div>
