<script lang="ts" generics="TValue">
	import { isControlOrMeta } from "$lib/helpers.js";
	import { flushSync } from "svelte";
	import type { EventHandler } from "svelte/elements";
	import { TreeContext, TreeItemContext } from "./context.svelte.js";
	import type { LinkedTreeItem } from "./tree.svelte.js";
	import type { TreeItemProps } from "./types.js";

	let {
		item,
		index,
		children,
		editable = false,
		editing = $bindable(false),
		draggable = false,
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
	}: TreeItemProps<TValue> = $props();

	const context = TreeContext.get<TValue>();
	const tabbable = $derived(context.tabbable === item);
	const dragged = $derived(context.dragged === item);

	TreeItemContext.set({
		context,
		item: () => item,
		editing: () => editing,
		onEditingChange(value) {
			editing = value;
		},
	});

	$effect.pre(() => {
		if (!editable && editing) {
			editing = false;
		}
	});

	$effect(() => {
		context.lookup.set(item.id, item);
		return () => {
			context.lookup.delete(item.id);
			if (tabbable) {
				context.tabbable = undefined;
			}
			if (dragged) {
				context.dragged = undefined;
			}
		};
	});

	function previousItem(item: LinkedTreeItem<TValue>) {
		const { previousSibling } = item;
		if (previousSibling === undefined) {
			return item.parent;
		}

		let current = previousSibling;
		while (current.expanded) {
			const lastChild = current.children.tail;
			if (lastChild === undefined) {
				break;
			}
			current = lastChild;
		}
		return current;
	}

	function nextItem(item: LinkedTreeItem<TValue>) {
		if (item.expanded) {
			const firstChild = item.children.head;
			if (firstChild !== undefined) {
				return firstChild;
			}
		}

		let current: LinkedTreeItem<TValue> | undefined = item;
		do {
			const { nextSibling } = current;
			if (nextSibling !== undefined) {
				return nextSibling;
			}
			current = current.parent;
		} while (current !== undefined);
	}

	function selectMultiple(
		item: LinkedTreeItem<TValue>,
		itemElement: HTMLElement,
	) {
		// Select all items from the last selected item up to this item.
		let lastSelected: LinkedTreeItem<TValue> | undefined;
		for (const id of context.tree.selected) {
			const item = context.lookup.get(id);
			if (item !== undefined) {
				lastSelected = item;
			}
		}

		// If no item is selected, select all items from the first item up to this item.
		if (lastSelected === undefined) {
			let current = context.tree.items.head;
			while (current !== undefined) {
				current.select();
				if (current === item) {
					break;
				}
				current = nextItem(current);
			}
			return;
		}

		const lastSelectedElement = context.treeItemElement(lastSelected.id);
		if (lastSelectedElement === null) {
			return;
		}

		const down =
			lastSelectedElement.compareDocumentPosition(itemElement) &
			Node.DOCUMENT_POSITION_FOLLOWING;

		let current: LinkedTreeItem<TValue> | undefined = lastSelected;
		do {
			current = down ? nextItem(current) : previousItem(current);
			if (current === undefined) {
				break;
			}
			current.select();
		} while (current !== item);
	}

	function calculateDropPosition(dropTarget: HTMLElement, clientY: number) {
		const { top, bottom, height } = dropTarget.getBoundingClientRect();
		const topBoundary = top + height / 3;
		const bottomBoundary = bottom - height / 3;
		if (clientY < topBoundary) {
			return "before";
		}
		if (clientY < bottomBoundary) {
			return "inside";
		}
		return "after";
	}

	const handleFocusIn: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		onfocusin?.(event);
		context.tabbable = item;
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (
		event,
	) => {
		onkeydown?.(event);

		if (event.target !== event.currentTarget) {
			// Don't handle keydown events that bubble up from child elements
			// to avoid conflict with the input during editing mode.
			return;
		}

		switch (event.key) {
			case "ArrowRight": {
				const firstChild = item.children.head;
				if (firstChild === undefined) {
					break;
				}

				if (!item.expanded) {
					item.expand();
				} else {
					context.treeItemElement(firstChild.id)?.focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (item.expanded && item.children.length !== 0) {
					item.collapse();
				} else if (item.parent !== undefined) {
					context.treeItemElement(item.parent.id)?.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const down = event.key === "ArrowDown";
				const next = down ? nextItem(item) : previousItem(item);
				if (next === undefined) {
					break;
				}

				const nextElement = context.treeItemElement(next.id);
				if (nextElement === null) {
					break;
				}

				const shouldSelect = event.shiftKey;
				if (shouldSelect) {
					item.select();
					next.select();
				}

				nextElement.focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const down = event.key === "PageDown";
				const next = down ? nextItem(item) : previousItem(item);
				if (next === undefined) {
					break;
				}

				const nextElement = context.treeItemElement(next.id);
				if (nextElement === null) {
					break;
				}

				const shouldSelect = event.shiftKey;
				if (shouldSelect) {
					item.select();
					next.select();
				}

				const maxScrollDistance = Math.min(
					context.treeElement!.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemTop = event.currentTarget.getBoundingClientRect().top;

				let current = next;
				let currentElement = nextElement;
				while (true) {
					const next = down ? nextItem(current) : previousItem(current);
					if (next === undefined) {
						break;
					}

					const nextElement = context.treeItemElement(next.id);
					if (nextElement === null) {
						break;
					}

					const nextTop = nextElement.getBoundingClientRect().top;
					const distance = Math.abs(nextTop - itemTop);
					if (distance > maxScrollDistance) {
						break;
					}

					current = next;
					currentElement = nextElement;

					if (shouldSelect) {
						current.select();
					}
				}

				currentElement.focus();
				break;
			}
			case "Home": {
				const first = context.tree.items.head;
				if (first === undefined || first === item) {
					break;
				}

				const firstElement = context.treeItemElement(first.id);
				if (firstElement === null) {
					break;
				}

				const shouldSelect = event.shiftKey && isControlOrMeta(event);
				if (shouldSelect) {
					let current: LinkedTreeItem<TValue> | undefined = item;
					do {
						current.select();
						current = previousItem(current);
					} while (current !== undefined);
				}

				firstElement.focus();
				break;
			}
			case "End": {
				let last = context.tree.items.tail;
				while (last !== undefined && last.expanded) {
					const lastChild = last.children.tail;
					if (lastChild === undefined) {
						break;
					}
					last = lastChild;
				}

				if (last === undefined || last === item) {
					break;
				}

				const lastElement = context.treeItemElement(last.id);
				if (lastElement === null) {
					break;
				}

				const shouldSelect = event.shiftKey && isControlOrMeta(event);
				if (shouldSelect) {
					let current: LinkedTreeItem<TValue> | undefined = item;
					do {
						current.select();
						current = nextItem(current);
					} while (current !== undefined);
				}

				lastElement.focus();
				break;
			}
			case " ": {
				const shouldSelectMultiple = event.shiftKey;
				if (shouldSelectMultiple) {
					selectMultiple(item, event.currentTarget);
				} else {
					item.selected = !item.selected;
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
				const shouldSelectAll = isControlOrMeta(event);
				if (shouldSelectAll) {
					context.tree.selectAll();
				}
				break;
			}
			case "Escape": {
				context.tree.selected.clear();
				break;
			}
			case "*": {
				const topBefore = event.currentTarget.getBoundingClientRect().top;
				let current = item.siblings.head;
				while (current !== undefined) {
					if (current.children.length !== 0) {
						current.expand();
					}
					current = current.nextSibling;
				}

				// After the sibling nodes are all expanded, the tree's height changes,
				// causing a lot of layout shift. Preserve the position of the focused
				// node relative to the viewport to avoid disorienting the user.
				flushSync();
				const topAfter = event.currentTarget.getBoundingClientRect().top;
				window.scrollBy(0, topAfter - topBefore);
				break;
			}
			case "Delete": {
				// Focus the nearest item that will not be deleted.
				let fallback: LinkedTreeItem<TValue> | undefined = item;
				while (fallback !== undefined && fallback.selected) {
					if (fallback.expanded) {
						// Avoid focusing a child of an item that is about to be deleted.
						fallback.collapse();
					}
					fallback = nextItem(fallback);
				}

				// If none are found, focus the nearest item before this item.
				if (fallback === undefined) {
					fallback = item;
					while (fallback !== undefined && fallback.selected) {
						fallback = previousItem(fallback);
					}
				}

				const { selected } = context.tree;
				for (const id of selected) {
					const item = context.lookup.get(id);
					if (item === undefined) {
						selected.delete(id);
					} else {
						item.remove();
					}
				}

				if (fallback !== undefined) {
					context.treeItemElement(fallback.id)?.focus();
				}
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

		const shouldToggleSelection = isControlOrMeta(event);
		if (shouldToggleSelection) {
			item.selected = !item.selected;
			return;
		}

		const shouldSelectMultiple = event.shiftKey;
		if (shouldSelectMultiple) {
			selectMultiple(item, event.currentTarget);
			return;
		}

		context.tree.selected.clear();
		item.select();
	};

	let draggedOver = false;
	let dragOverThrottled = false;
	let dropPosition: "before" | "inside" | "after" | undefined = $state.raw();
	const withinDragged = $derived(
		context.dragged !== undefined && context.dragged.contains(item),
	);

	const handleDragStart: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragstart?.(event);
		context.dragged = item;
		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = "move";
		}
	};

	const handleDragEnter: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragenter?.(event);

		if (withinDragged) {
			return;
		}

		// The default behavior prevents the drop event from firing.
		event.preventDefault();

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}

		draggedOver = true;
	};

	const handleDragOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragover?.(event);

		if (withinDragged) {
			return;
		}

		// The default behavior prevents the drop event from firing.
		event.preventDefault();

		// The dragover event fires at a high rate, so the next section
		// needs to be throttled to avoid performance issues.
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
	};

	const handleDragLeave: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragleave?.(event);

		if (withinDragged) {
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
	};

	const handleDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondrop?.(event);

		const { dragged } = context;
		if (dragged !== undefined) {
			const { currentTarget, clientY } = event;
			const dropPosition = calculateDropPosition(currentTarget, clientY);
			switch (dropPosition) {
				case "before": {
					dragged.moveBefore(item);
					break;
				}
				case "inside": {
					dragged.appendTo(item);
					item.expand();
					break;
				}
				case "after": {
					dragged.moveAfter(item);
					break;
				}
			}

			flushSync();
			context.treeItemElement(dragged.id)?.focus();
		}

		draggedOver = false;
		dropPosition = undefined;
	};

	const handleDragEnd: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragend?.(event);
		context.dragged = undefined;
	};
</script>

<div
	{...attributes}
	bind:this={element}
	id={context.treeItemElementId(item.id)}
	role="treeitem"
	aria-selected={item.selected}
	aria-expanded={item.children.length !== 0 ? item.expanded : undefined}
	aria-level={item.depth + 1}
	aria-posinset={index + 1}
	aria-setsize={item.siblings.length}
	tabindex={tabbable ? 0 : -1}
	{draggable}
	data-dragged={dragged ? "" : undefined}
	data-drop-position={dropPosition}
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
	{@render children({ editing })}
</div>
