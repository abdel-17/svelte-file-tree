<script lang="ts">
	import { isControlOrMeta } from "$lib/internal/helpers.js";
	import type { FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
	import { flushSync, getContext, hasContext } from "svelte";
	import type { EventHandler } from "svelte/elements";
	import { TreeContext, TreeItemContext, type TreeItemData } from "../Tree/context.svelte.js";
	import {
		getNextItem,
		getNextNonChildItem,
		getPreviousItem,
		hasSelectedAncestor,
	} from "../Tree/helpers.js";
	import type { TreeItemProps } from "./types.js";

	if (!hasContext(TreeItemContext.key)) {
		throw new Error("<TreeItem> must be a child of <Tree>");
	}

	const treeContext: TreeContext = getContext(TreeContext.key);
	const context: TreeItemContext = getContext(TreeItemContext.key);

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
		const { node, index, level, parent } = context;
		treeContext.setItem({ node, index, level, parent });
	});

	$effect(() => {
		return () => {
			treeContext.deleteItem(context.node);
		};
	});

	const handleFocusIn: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		onfocusin?.(event);

		treeContext.setTabbable(context.node);
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
		onkeydown?.(event);

		if (event.target !== event.currentTarget) {
			// Don't handle keydown events that bubble up from elements inside
			// like inputs and buttons to avoid conflicting with their behavior.
			return;
		}

		const { node, index, level, parent } = context;
		const { tree } = node;
		switch (event.key) {
			case "ArrowRight": {
				if (node.type === "file") {
					break;
				}

				if (!node.expanded) {
					node.expand();
				} else if (node.children.length !== 0) {
					treeContext.getItemElement(node.children[0])?.focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (node.type === "folder" && node.expanded) {
					node.collapse();
				} else if (parent !== undefined) {
					treeContext.getItemElement(parent.node)?.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const current = { node, index, level, parent };
				const next = event.key === "ArrowDown" ? getNextItem(current) : getPreviousItem(current);
				if (next === undefined) {
					break;
				}

				const nextElement = treeContext.getItemElement(next.node);
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
					document.getElementById(treeContext.id)!.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current = { node, index, level, parent };
				let currentElement: HTMLElement = event.currentTarget;
				while (true) {
					const next = down ? getNextItem(current) : getPreviousItem(current);
					if (next === undefined) {
						break;
					}

					const nextElement = treeContext.getItemElement(next.node);
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
				const first = tree.children[0];
				if (first === node) {
					break;
				}

				const firstElement = treeContext.getItemElement(first);
				if (firstElement === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: TreeItemData | undefined = { node, index, level, parent };
					do {
						current.node.select();
						current = getPreviousItem(current);
					} while (current !== undefined);
				}

				firstElement.focus();
				break;
			}
			case "End": {
				let last = tree.children[tree.children.length - 1];
				while (last.type === "folder" && last.expanded && last.children.length !== 0) {
					last = last.children[last.children.length - 1];
				}

				if (last === node) {
					break;
				}

				const lastElement = treeContext.getItemElement(last);
				if (lastElement === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: TreeItemData | undefined = { node, index, level, parent };
					do {
						current.node.select();
						current = getNextItem(current);
					} while (current !== undefined);
				}

				lastElement.focus();
				break;
			}
			case " ": {
				if (event.shiftKey) {
					treeContext.selectUntil(node, event.currentTarget);
				} else {
					node.toggleSelected();
				}
				break;
			}
			case "Escape": {
				tree.selected.clear();
				treeContext.clearClipboard();
				break;
			}
			case "*": {
				for (const current of level) {
					if (current.type === "folder") {
						current.expand();
					}
				}

				// After the items are expanded, the tree's height changes,
				// causing this item to move down. Scroll down to preserve
				// the scroll position relative to this item.
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

				context.editing = true;
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
				const parentsOfDeleted = new Set<FileTree | FolderNode>();
				for (const id of tree.selected) {
					const current = treeContext.getItem(id);
					if (current === undefined) {
						continue;
					}

					// Don't delete an item twice. If an ancestor is selected,
					// its entire subtree will also be deleted.
					if (hasSelectedAncestor(current)) {
						continue;
					}

					deleted.push(current.node);
					parentsOfDeleted.add(current.parent?.node ?? tree);
				}

				if (deleted.length === 0) {
					break;
				}

				let focusTarget: TreeItemData | undefined = { node, index, level, parent };
				do {
					{
						// If one of the ancestors is selected, this item will be deleted.
						let ancestor: TreeItemData | undefined = focusTarget.parent;
						while (ancestor !== undefined) {
							if (ancestor.node.selected) {
								focusTarget = ancestor;
							}
							ancestor = ancestor.parent;
						}
					}

					// Focus the nearest remaining item after this item.
					let nearestUnselected: TreeItemData | undefined = focusTarget;
					while (nearestUnselected?.node.selected) {
						// The current item will be deleted, so we shouldn't traverse its children.
						nearestUnselected = getNextNonChildItem(nearestUnselected);
					}

					if (nearestUnselected === undefined) {
						// Focus the nearest remaining item before this item.
						nearestUnselected = focusTarget;
						while (nearestUnselected?.node.selected) {
							nearestUnselected = getPreviousItem(nearestUnselected);
						}
					}

					if (nearestUnselected === focusTarget) {
						break;
					}

					focusTarget = nearestUnselected;
				} while (focusTarget !== undefined);

				for (const parent of parentsOfDeleted) {
					parent.children = parent.children.filter((child) => !child.selected);
				}

				if (focusTarget !== undefined) {
					treeContext.getItemElement(focusTarget.node)?.focus();
				}

				treeContext.callbacks.onDeleteItems({ deleted });
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

				treeContext.copySelected(tree);
				break;
			}
			case "x": {
				if (!isControlOrMeta(event)) {
					break;
				}

				treeContext.cutSelected(tree);
				break;
			}
			case "v": {
				if (!isControlOrMeta(event)) {
					break;
				}

				treeContext.paste(node, index, level, parent);
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

		const { node } = context;
		if (isControlOrMeta(event)) {
			node.toggleSelected();
		} else if (event.shiftKey) {
			treeContext.selectUntil(node, event.currentTarget);
		} else {
			node.tree.selected.clear();
			node.select();
		}
	};

	const handleDragStart: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragstart?.(event);

		treeContext.setDragged(context.node);

		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = "move";
		}
	};

	const handleDragEnter: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragenter?.(event);

		if (!treeContext.hasDragged()) {
			return;
		}

		const { node, index, level, parent } = context;
		{
			// Prevent the dragged item from being dropped inside itself.
			let current: TreeItemData | undefined = { node, index, level, parent };
			do {
				if (treeContext.isDragged(current.node)) {
					return;
				}
				current = current.parent;
			} while (current !== undefined);
		}

		context.updateDropPosition(event.currentTarget.getBoundingClientRect(), event.clientY);

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

		if (context.dropPosition === undefined) {
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
			if (context.dropPosition !== undefined) {
				context.updateDropPosition(currentTarget.getBoundingClientRect(), clientY);
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

		context.clearDropPosition();
	};

	// TODO: dnd multiple items at once
	const handleDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondrop?.(event);

		const dragged = treeContext.getDragged();
		if (dragged === undefined) {
			return;
		}

		const { node, index, level, parent } = context;
		const dropPosition = context.updateDropPosition(
			event.currentTarget.getBoundingClientRect(),
			event.clientY,
		);

		let dropParent: FolderNode | undefined;
		let dropLevel: FileTreeNode[];
		let dropIndex: number;
		switch (dropPosition) {
			case "before":
			case "after": {
				if (dragged.parent !== parent) {
					// Remove the dragged item from its parent.
					dragged.level.splice(dragged.index, 1);

					// Insert the dragged item into the new parent.
					dropParent = parent?.node;
					dropLevel = level;
					dropIndex = dropPosition === "before" ? index : index + 1;
					dropLevel.splice(dropIndex, 0, dragged.node);

					// The dragged item is removed temporarily from the DOM, so it loses focus.
					flushSync();
					treeContext.getItemElement(dragged.node)?.focus();
					break;
				}

				// Instead of removing the dragged item and inserting it back to the
				// same array, we can repeatedly swap it with its adjacent sibling
				// until it reaches the new index, which is more efficient.
				dropParent = parent?.node;
				dropLevel = level;
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
						const current = dropLevel[i];
						dropLevel[i] = dropLevel[i + 1];
						dropLevel[i + 1] = current;
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
						const current = dropLevel[i];
						dropLevel[i] = dropLevel[i - 1];
						dropLevel[i - 1] = current;
					}
				}
				break;
			}
			case "inside": {
				if (node.type === "file") {
					throw new Error("Cannot drop an item inside a file");
				}

				// Remove the dragged item from its parent.
				dragged.level.splice(dragged.index, 1);

				// Insert the dragged item into the new parent.
				dropParent = node;
				dropLevel = node.children;
				dropIndex = dropLevel.length;
				dropLevel.push(dragged.node);
				node.expand();

				// The dragged item is removed temporarily from the DOM, so it loses focus.
				flushSync();
				treeContext.getItemElement(dragged.node)?.focus();
				break;
			}
		}

		context.clearDropPosition();
		treeContext.callbacks.onMoveItems({
			moved: [dragged.node],
			start: dropIndex,
			level: dropLevel,
			parent: dropParent,
		});
	};

	const handleDragEnd: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragend?.(event);

		treeContext.clearDragged();
	};
</script>

<div
	{...attributes}
	bind:this={element}
	id={treeContext.getItemElementId(context.node)}
	role="treeitem"
	aria-selected={context.node.selected}
	aria-expanded={context.node.type === "folder" ? context.node.expanded : undefined}
	aria-level={context.depth + 1}
	aria-posinset={context.index + 1}
	aria-setsize={context.level.length}
	tabindex={treeContext.isTabbable(context.node) ? 0 : -1}
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
