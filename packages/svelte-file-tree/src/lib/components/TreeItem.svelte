<script lang="ts" module>
	import { isControlOrMeta } from "$lib/helpers.js";
	import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
	import type { HTMLDivAttributes } from "$lib/types.js";
	import { flushSync, getContext, setContext, type Snippet } from "svelte";
	import type { EventHandler } from "svelte/elements";
	import type { TreeState, EnumeratedTreeItem } from "./Tree.svelte";
	import { getTreeItemProviderContext } from "./TreeItemProvider.svelte";

	const contextKey = Symbol("TreeItemContext");

	export type TreeItemContext = {
		readonly treeState: TreeState;
		readonly getNode: () => FileTreeNode;
		readonly onEditingChange: (value: boolean) => void;
	};

	export function getTreeItemContext(): TreeItemContext {
		const context: TreeItemContext | undefined = getContext(contextKey);
		if (context === undefined) {
			throw new Error("No parent <Tree> found");
		}
		return context;
	}

	function isTabbable(treeState: TreeState, node: FileTreeNode): boolean {
		const { tabbableId = node.tree.nodes[0].id } = treeState;
		return tabbableId === node.id;
	}

	function getNext(
		treeState: TreeState,
		current: EnumeratedTreeItem,
	): EnumeratedTreeItem | undefined {
		let { node, index } = current;

		if (node.isFolder() && node.expanded && node.children.length !== 0) {
			node = node.children[0];
			index = treeState.getItem(node.id)!.index;
			return { node, index };
		}

		while (true) {
			if (index !== node.siblings.length - 1) {
				index++;
				node = node.siblings[index];
				break;
			}

			if (node.parent === undefined) {
				return;
			}
			node = node.parent;
			index = treeState.getItem(node.id)!.index;
		}
		return { node, index };
	}

	function getPrevious(
		treeState: TreeState,
		current: EnumeratedTreeItem,
	): EnumeratedTreeItem | undefined {
		let { node, index } = current;

		if (index === 0) {
			if (node.parent === undefined) {
				return;
			}
			node = node.parent;
			index = treeState.getItem(node.id)!.index;
			return { node, index };
		}

		index--;
		node = node.siblings[index];
		while (node.isFolder() && node.expanded && node.children.length !== 0) {
			index = node.children.length - 1;
			node = node.children[index];
		}
		return { node, index };
	}

	function batchSelect(treeState: TreeState, node: FileTreeNode, element: HTMLElement): void {
		let lastSelected: EnumeratedTreeItem | undefined;
		for (const id of node.tree.selected) {
			const item = treeState.getItem(id);
			if (item !== undefined) {
				lastSelected = item;
			}
		}

		if (lastSelected === undefined) {
			const first = { node: node.tree.nodes[0], index: 0 };
			let current: EnumeratedTreeItem | undefined = first;
			do {
				current.node.select();
				if (current.node === node) {
					break;
				}
				current = getNext(treeState, current);
			} while (current !== undefined);
			return;
		}

		const lastElement = treeState.getItemElement(lastSelected.node);
		if (lastElement === null) {
			return;
		}
		const following =
			lastElement.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING;

		let current: EnumeratedTreeItem | undefined = lastSelected;
		while (current.node !== node) {
			current = following ? getNext(treeState, current) : getPrevious(treeState, current);
			if (current === undefined) {
				break;
			}
			current.node.select();
		}
	}

	function selectAll(nodes: FileTreeNode[]): void {
		for (const node of nodes) {
			node.select();
			if (node.isFolder() && node.expanded) {
				selectAll(node.children);
			}
		}
	}

	function hasSelectedAncestor(node: FileTreeNode): boolean {
		let current = node.parent;
		while (current !== undefined) {
			if (current.selected) {
				return true;
			}
			current = current.parent;
		}
		return false;
	}

	function deleteSelected(nodes: FileTreeNode[], deleted: FileTreeNode[]): FileTreeNode[] {
		const remaining: FileTreeNode[] = [];
		for (const node of nodes) {
			if (node.selected) {
				onDelete(node);
				deleted.push(node);
			} else {
				remaining.push(node);
			}
		}
		return remaining;
	}

	function onDelete(node: FileTreeNode): boolean {
		const { selected, expanded } = node.tree;
		selected.delete(node.id);
		expanded.delete(node.id);

		if (selected.size === 0 || expanded.size === 0) {
			return true;
		}

		if (node.isFolder()) {
			for (const child of node.children) {
				const done = onDelete(child);
				if (done) {
					return true;
				}
			}
		}

		return false;
	}

	type DropPosition = "before" | "after" | "inside";

	class DropPositionState {
		#current?: DropPosition = $state.raw();

		get current(): DropPosition | undefined {
			return this.#current;
		}

		onUpdate(node: FileTreeNode, element: HTMLElement, clientY: number): void {
			this.#current = this.#getDropPosition(node, element, clientY);
		}

		onDragLeave(): void {
			this.#current = undefined;
		}

		onDrop(node: FileTreeNode, element: HTMLElement, clientY: number): DropPosition {
			this.#current = undefined;
			return this.#getDropPosition(node, element, clientY);
		}

		#getDropPosition(node: FileTreeNode, element: HTMLElement, clientY: number): DropPosition {
			const { top, bottom, height } = element.getBoundingClientRect();

			if (!node.isFolder()) {
				const midY = top + height / 2;
				return clientY < midY ? "before" : "after";
			}

			if (clientY < top + height / 3) {
				return "before";
			}
			if (clientY > bottom - height / 3) {
				return "after";
			}
			return "inside";
		}
	}
</script>

<script lang="ts">
	const { treeState, getNode, getIndex } = getTreeItemProviderContext();
	const node = $derived.by(getNode);
	const index = $derived.by(getIndex);
	const dragged = $derived(treeState.draggedId === node.id);
	const dropPositionState = new DropPositionState();

	interface Props extends Omit<HTMLDivAttributes, "children"> {
		children: Snippet<
			[
				props: {
					readonly node: FileTreeNode;
					readonly index: number;
					readonly editing: boolean;
					readonly dragged: boolean;
					readonly dropPosition: DropPosition | undefined;
				},
			]
		>;
		editable?: boolean;
		editing?: boolean;
		element?: HTMLDivElement | null;
		onMoveItem?: (node: FileTreeNode, index: number) => void;
		onDeleteItems?: (nodes: FileTreeNode[]) => void;
	}

	let {
		children,
		editable = false,
		editing = $bindable(false),
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

	const context: TreeItemContext = {
		treeState,
		getNode,
		onEditingChange(value) {
			editing = value;
		},
	};
	setContext(contextKey, context);

	$effect(() => {
		if (!editable) {
			editing = false;
		}
	});

	const handleFocusIn: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		onfocusin?.(event);

		treeState.onFocusInItem(node);
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
				const next =
					event.key === "ArrowDown"
						? getNext(treeState, { node, index })
						: getPrevious(treeState, { node, index });
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
				const maxScrollDistance = Math.min(
					document.getElementById(treeState.id)!.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current = { node, index };
				let currentElement: HTMLElement = event.currentTarget;
				while (true) {
					const next =
						event.key === "PageDown"
							? getNext(treeState, current)
							: getPrevious(treeState, current);
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
						current = getPrevious(treeState, current);
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
						current = getNext(treeState, current);
					} while (current !== undefined);
				}

				lastElement.focus();
				break;
			}
			case " ": {
				if (event.shiftKey) {
					batchSelect(treeState, node, event.currentTarget);
				} else {
					node.toggleSelection();
				}
				break;
			}
			case "F2": {
				if (editable) {
					editing = true;
				}
				break;
			}
			case "a": {
				if (isControlOrMeta(event)) {
					selectAll(node.tree.nodes);
				}
				break;
			}
			case "Escape": {
				node.tree.selected.clear();
				break;
			}
			case "*": {
				const rectBefore = event.currentTarget.getBoundingClientRect();
				for (const sibling of node.siblings) {
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
				if (tree.selected.size === 0) {
					break;
				}

				// Focus the first item that will not be deleted.
				let fallback: EnumeratedTreeItem | undefined;
				if (node.selected || hasSelectedAncestor(node)) {
					fallback = { node, index };
					do {
						// Avoid focusing a child of an item that is about to be deleted.
						if (fallback.node.isFolder() && fallback.node.expanded) {
							fallback.node.collapse();
						}

						fallback = getNext(treeState, fallback);
					} while (fallback !== undefined && fallback.node.selected);

					if (fallback === undefined) {
						fallback = { node, index };
						do {
							fallback = getPrevious(treeState, fallback);
						} while (fallback !== undefined && fallback.node.selected);
					}
				}

				const deleted: FileTreeNode[] = [];
				tree.nodes = deleteSelected(tree.nodes, deleted);

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
				for (const id of tree.selected) {
					const item = treeState.getItem(id);
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
					parent.children = deleteSelected(parent.children, deleted);
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
			batchSelect(treeState, node, event.currentTarget);
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

		treeState.onDragStartItem(node);
	};

	const handleDragEnter: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragenter?.(event);

		if (dragged || treeState.draggedId === undefined) {
			return;
		}
		const { node: draggedNode } = treeState.getItem(treeState.draggedId)!;

		// An item cannot be dropped inside itself.
		if (draggedNode.isFolder() && draggedNode.contains(node)) {
			return;
		}

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}
		event.preventDefault();

		dropPositionState.onUpdate(node, event.currentTarget, event.clientY);
	};

	// The dragover event fires at a high rate, so computing
	// the drop position needs to be throttled to avoid jank.
	let dragOverThrottled = false;

	const handleDragOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragover?.(event);

		if (dropPositionState.current === undefined) {
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
			if (dropPositionState.current !== undefined) {
				dropPositionState.onUpdate(node, currentTarget, clientY);
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

		dropPositionState.onDragLeave();
	};

	const handleDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondrop?.(event);

		if (treeState.draggedId === undefined) {
			return;
		}
		const { node: draggedNode, index: draggedIndex } = treeState.getItem(treeState.draggedId)!;

		let dropIndex: number;
		const dropPosition = dropPositionState.onDrop(node, event.currentTarget, event.clientY);
		switch (dropPosition) {
			case "before":
			case "after": {
				if (draggedNode.parent !== node.parent) {
					draggedNode.siblings.splice(draggedIndex, 1);
					draggedNode.parent = node.parent;
					dropIndex = dropPosition === "before" ? index : index + 1;
					node.siblings.splice(dropIndex, 0, draggedNode);

					// The dragged item is removed temporarily from the DOM, so it loses focus.
					flushSync();
					treeState.getItemElement(draggedNode)?.focus();
					break;
				}

				// Instead of removing the dragged item and inserting it back to the
				// same array, we can repeatedly swap it with its adjacent sibling
				// until it reaches the new index, which is more efficient.
				const { siblings } = node;
				if (draggedIndex < index) {
					// 1 - 2 - 3 - 4 - 5
					// ^             ^
					// 2 - 1 - 3 - 4 - 5
					// 2 - 3 - 1 - 4 - 5
					// 2 - 3 - 4 - 1 - 5
					dropIndex = dropPosition === "before" ? index - 1 : index;
					for (let i = draggedIndex; i < dropIndex; i++) {
						siblings[i] = siblings[i + 1];
						siblings[i + 1] = draggedNode;
					}
				} else {
					// 1 - 2 - 3 - 4 - 5
					//   ^         ^
					// 1 - 2 - 4 - 3 - 5
					// 1 - 4 - 2 - 3 - 5
					dropIndex = dropPosition === "before" ? index : index + 1;
					for (let i = draggedIndex; i > dropIndex; i--) {
						siblings[i] = siblings[i - 1];
						siblings[i - 1] = draggedNode;
					}
				}
				break;
			}
			case "inside": {
				if (!node.isFolder()) {
					throw new Error("Cannot drop an item inside a file");
				}

				draggedNode.siblings.splice(draggedIndex, 1);
				draggedNode.parent = node;
				node.expand();
				dropIndex = node.children.length;
				node.children.push(draggedNode);

				// The dragged item is removed temporarily from the DOM, so it loses focus.
				flushSync();
				treeState.getItemElement(draggedNode)?.focus();
				break;
			}
		}

		onMoveItem?.(draggedNode, dropIndex);
	};

	const handleDragEnd: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragend?.(event);

		treeState.onDragEndItem();
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
	tabindex={isTabbable(treeState, node) ? 0 : -1}
	data-editing={editing ? "" : undefined}
	data-dragged={dragged ? "" : undefined}
	data-drop-position={dropPositionState.current}
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
	{@render children({
		node,
		index,
		editing,
		dragged,
		dropPosition: dropPositionState.current,
	})}
</div>
