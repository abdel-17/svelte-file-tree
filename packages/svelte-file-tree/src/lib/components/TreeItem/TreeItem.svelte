<script lang="ts">
	import { WritableRef } from "$lib/internal/box.svelte.js";
	import { isControlOrMeta } from "$lib/internal/helpers.js";
	import { flushSync } from "svelte";
	import type { EventHandler } from "svelte/elements";
	import { TreeContext, TreeItemProviderContext } from "../Tree/context.js";
	import { TreeItemContext } from "./context.js";
	import { DropPositionState } from "./state.svelte.js";
	import type { TreeItemProps } from "./types.js";

	const { node, index, depth, parent } = TreeItemProviderContext.get();
	const {
		tree,
		treeElement,
		clipboardState,
		focusState,
		dragState,
		getNextItem,
		getPreviousItem,
		selectUntil,
		deleteSelected,
		dropSelected,
	} = TreeContext.get();

	let {
		children,
		editable = false,
		editing = $bindable(false),
		onfocusin,
		onkeydown,
		onpointerdown,
		ondragstart,
		ondragover,
		ondragleave,
		ondrop,
		ondragend,
		...attributes
	}: TreeItemProps = $props();

	const editingRef = new WritableRef(
		() => editing,
		(value) => {
			editing = value;
		},
	);

	const dropPositionState = new DropPositionState(node);
	const dragged = $derived(dragState.draggedId === node.current.id);

	TreeItemContext.set({
		editing: editingRef,
	});

	const handleFocusIn: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		onfocusin?.(event);

		focusState.setTabbable(node.current);
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
				if (node.current.type === "file") {
					break;
				}

				if (!node.current.expanded) {
					tree.current.expand(node.current);
				} else if (node.current.children.length !== 0) {
					node.current.children[0].element?.focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (node.current.type === "folder" && node.current.expanded) {
					tree.current.collapse(node.current);
				} else {
					parent.current?.node.element?.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const current = {
					node: node.current,
					index: index.current,
					parent: parent.current,
				};
				const next = event.key === "ArrowDown" ? getNextItem(current) : getPreviousItem(current);
				if (next === undefined || next.node.element === null) {
					break;
				}

				if (event.shiftKey) {
					tree.current.select(node.current);
					tree.current.select(next.node);
				}

				next.node.element.focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const navigate = event.key === "PageDown" ? getNextItem : getPreviousItem;
				const maxScrollDistance = Math.min(
					treeElement.current!.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current = {
					node: node.current,
					index: index.current,
					parent: parent.current,
				};
				let currentElement: HTMLElement = event.currentTarget;
				while (true) {
					const next = navigate(current);
					if (next === undefined || next.node.element === null) {
						break;
					}

					const nextRect = next.node.element.getBoundingClientRect();
					const distance = Math.abs(nextRect.top - itemRect.top);
					if (distance > maxScrollDistance) {
						break;
					}

					if (event.shiftKey) {
						tree.current.select(current.node);
					}

					current = next;
					currentElement = next.node.element;
				}

				if (current.node === node.current) {
					break;
				}

				if (event.shiftKey) {
					tree.current.select(current.node);
				}

				currentElement.focus();
				break;
			}
			case "Home": {
				const first = tree.current.children[0];
				if (first === node.current || first.element === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: TreeContext.Item | undefined = {
						node: node.current,
						index: index.current,
						parent: parent.current,
					};
					do {
						tree.current.select(current.node);
						current = getPreviousItem(current);
					} while (current !== undefined);
				}

				first.element.focus();
				break;
			}
			case "End": {
				let last = tree.current.children.at(-1)!;
				while (last.type === "folder" && last.expanded && last.children.length !== 0) {
					last = last.children.at(-1)!;
				}

				if (last === node.current || last.element === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: TreeContext.Item | undefined = {
						node: node.current,
						index: index.current,
						parent: parent.current,
					};
					do {
						tree.current.select(current.node);
						current = getNextItem(current);
					} while (current !== undefined);
				}

				last.element.focus();
				break;
			}
			case " ": {
				if (event.shiftKey) {
					selectUntil(node.current, event.currentTarget);
				} else {
					tree.current.toggleSelected(node.current);
				}
				break;
			}
			case "Escape": {
				tree.current.selectedIds.clear();
				clipboardState.clear();
				break;
			}
			case "*": {
				const siblings = parent.current?.node.children ?? tree.current.children;
				for (const sibling of siblings) {
					if (sibling.type === "folder") {
						tree.current.expand(sibling);
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

				editing = true;
				break;
			}
			case "Delete": {
				deleteSelected(node.current, index.current, parent.current);
				break;
			}
			case "a": {
				if (!isControlOrMeta(event)) {
					break;
				}

				tree.current.selectAll();
				break;
			}
			case "c": {
				if (!isControlOrMeta(event)) {
					break;
				}

				clipboardState.copy(tree.current.selectedIds);
				break;
			}
			case "x": {
				if (!isControlOrMeta(event)) {
					break;
				}

				clipboardState.cut(tree.current.selectedIds);
				break;
			}
			case "v": {
				if (!isControlOrMeta(event)) {
					break;
				}

				// TODO:
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	const handlePointerDown: EventHandler<PointerEvent, HTMLDivElement> = (event) => {
		onpointerdown?.(event);

		if (isControlOrMeta(event)) {
			tree.current.toggleSelected(node.current);
		} else if (event.shiftKey) {
			selectUntil(node.current, event.currentTarget);
		} else {
			tree.current.selectedIds.clear();
			tree.current.select(node.current);
		}
	};

	const handleDragStart: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragstart?.(event);

		dragState.setDragged(node.current);
		tree.current.select(node.current);

		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = "move";
		}
	};

	const handleDragOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragover?.(event);

		if (dragState.draggedId === undefined) {
			return;
		}

		if (node.current.selected) {
			// Prevent a selected item from being dropped onto itself.
			dropPositionState.clear();
			return;
		}

		dropPositionState.update(event.currentTarget, event.clientY);

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}

		event.preventDefault();
	};

	const handleDragLeave: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragleave?.(event);

		const { currentTarget, relatedTarget } = event;
		if (relatedTarget instanceof Node && currentTarget.contains(relatedTarget)) {
			// Skip if the pointer moves to a child element.
			return;
		}

		dropPositionState.clear();
	};

	const handleDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondrop?.(event);

		if (dragState.draggedId === undefined) {
			return;
		}

		const position = dropPositionState.get(
			event.currentTarget.getBoundingClientRect(),
			event.clientY,
		);
		dropPositionState.clear();

		tree.current.selectedIds.add(dragState.draggedId);
		dropSelected(node.current, parent.current, position);

		event.preventDefault();
	};

	const handleDragEnd: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragend?.(event);

		dragState.clearDragged();
	};
</script>

<div
	{...attributes}
	bind:this={node.current.element}
	role="treeitem"
	aria-selected={node.current.selected}
	aria-expanded={node.current.type === "folder" ? node.current.expanded : undefined}
	aria-level={depth.current + 1}
	aria-posinset={index.current + 1}
	aria-setsize={parent.current?.node.children.length ?? tree.current.children.length}
	tabindex={focusState.tabbableId === node.current.id ? 0 : -1}
	onfocusin={handleFocusIn}
	onkeydown={handleKeyDown}
	onpointerdown={handlePointerDown}
	ondragstart={handleDragStart}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	ondragend={handleDragEnd}
>
	{@render children(editing, dragged, dropPositionState.current)}
</div>
