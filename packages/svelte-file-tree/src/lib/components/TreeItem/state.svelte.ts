import { isControlOrMeta } from "$lib/internal/helpers.svelte.js";
import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import { flushSync } from "svelte";
import type { EventHandler } from "svelte/elements";
import type { DropPosition, TreeItemPosition, TreeState } from "../Tree/state.svelte.js";

const getDropPosition = (node: FileTreeNode, rect: DOMRect, clientY: number): DropPosition => {
	switch (node.type) {
		case "file": {
			const midY = rect.top + rect.height / 2;
			return clientY < midY ? "before" : "after";
		}
		case "folder": {
			const { top, bottom, height } = rect;
			if (clientY < top + height / 3) {
				return "before";
			}
			if (clientY < bottom - height / 3) {
				return "inside";
			}
			return "after";
		}
	}
};

type DropPositionStateProps = {
	node: () => FileTreeNode;
};

const createDropPositionState = ({ node }: DropPositionStateProps) => {
	let dropPosition: DropPosition | undefined = $state.raw();
	let updateRequestId: number | undefined;

	const updateDropPosition = (element: HTMLElement, clientY: number): void => {
		if (updateRequestId !== undefined) {
			return;
		}

		updateRequestId = window.requestAnimationFrame(() => {
			dropPosition = getDropPosition(node(), element.getBoundingClientRect(), clientY);
			updateRequestId = undefined;
		});
	};

	const clearDropPosition = (): void => {
		dropPosition = undefined;

		if (updateRequestId !== undefined) {
			window.cancelAnimationFrame(updateRequestId);
			updateRequestId = undefined;
		}
	};

	return {
		dropPosition: () => dropPosition,
		updateDropPosition,
		clearDropPosition,
	};
};

export type TreeItemStateProps = {
	treeState: TreeState;
	node: () => FileTreeNode;
	index: () => number;
	depth: () => number;
	parent: () => TreeItemPosition<FolderNode> | undefined;
	editable: () => boolean;
	setEditing: (value: boolean) => void;
	disabled: () => boolean;
	onfocusin: EventHandler<FocusEvent, HTMLDivElement>;
	onkeydown: EventHandler<KeyboardEvent, HTMLDivElement>;
	onpointerdown: EventHandler<PointerEvent, HTMLDivElement>;
	ondragstart: EventHandler<DragEvent, HTMLDivElement>;
	ondragover: EventHandler<DragEvent, HTMLDivElement>;
	ondragleave: EventHandler<DragEvent, HTMLDivElement>;
	ondrop: EventHandler<DragEvent, HTMLDivElement>;
	ondragend: EventHandler<DragEvent, HTMLDivElement>;
};

export const createTreeItemState = ({
	treeState,
	node,
	index,
	depth,
	parent,
	editable,
	setEditing,
	disabled,
	onfocusin,
	onkeydown,
	onpointerdown,
	ondragstart,
	ondragover,
	ondragleave,
	ondrop,
	ondragend,
}: TreeItemStateProps) => {
	const {
		tree,
		setPasteOperation,
		treeId,
		tabbableId,
		setTabbableId,
		draggedId,
		setDraggedId,
		onSetItem,
		onDestroyItem,
		getNextItem,
		getPreviousItem,
		getItemElementId,
		getItemElement,
		selectUntil,
		selectAll,
		moveSelected,
		pasteSelected,
		deleteSelected,
	} = treeState;

	const { dropPosition, updateDropPosition, clearDropPosition } = createDropPositionState({ node });

	const treeItemId = (): string => getItemElementId(node().id);

	const ariaSelected = (): boolean => node().selected;

	const ariaExpanded = (): boolean | undefined => {
		const currentNode = node();
		if (currentNode.type === "folder") {
			return currentNode.expanded;
		}
	};

	const ariaLevel = (): number => depth() + 1;

	const ariaPosInSet = (): number => index() + 1;

	const ariaSetSize = (): number => {
		const owner = parent()?.node ?? tree();
		return owner.children.length;
	};

	const tabIndex = (): 0 | -1 => {
		const id = tabbableId() ?? tree().children[0].id;
		return id === node().id ? 0 : -1;
	};

	const dragged = (): boolean => draggedId() === node().id;

	$effect(() => {
		onSetItem({
			node: node(),
			index: index(),
			parent: parent(),
		});
	});

	$effect(() => {
		return () => {
			onDestroyItem(node().id);
		};
	});

	const handleFocusIn: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
		onfocusin(event);
		setTabbableId(node().id);
	};

	const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
		onkeydown(event);

		if (event.defaultPrevented || disabled()) {
			return;
		}

		if (event.target !== event.currentTarget) {
			// Don't handle keydown events that bubble up from child elements.
			// This can cause unexpected behavior with child inputs.
			return;
		}

		const item = {
			node: node(),
			index: index(),
			parent: parent(),
		};

		switch (event.key) {
			case "ArrowRight": {
				if (item.node.type === "file") {
					break;
				}

				if (!item.node.expanded) {
					item.node.expand();
				} else if (item.node.children.length !== 0) {
					getItemElement(item.node.children[0].id)?.focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (item.node.type === "folder" && item.node.expanded) {
					item.node.collapse();
				} else if (item.parent !== undefined) {
					getItemElement(item.parent.node.id)?.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const next = event.key === "ArrowDown" ? getNextItem(item) : getPreviousItem(item);
				if (next === undefined) {
					break;
				}

				const nextElement = getItemElement(next.node.id);
				if (nextElement === null) {
					break;
				}

				if (event.shiftKey) {
					item.node.select();
					next.node.select();
				}

				nextElement.focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const navigate = event.key === "PageDown" ? getNextItem : getPreviousItem;
				const maxScrollDistance = Math.min(
					document.getElementById(treeId())!.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current = item;
				let currentElement: HTMLElement = event.currentTarget;
				while (true) {
					const next = navigate(current);
					if (next === undefined) {
						break;
					}

					const nextElement = getItemElement(next.node.id);
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

				if (current === item) {
					break;
				}

				if (event.shiftKey) {
					current.node.select();
				}

				currentElement.focus();
				break;
			}
			case "Home": {
				const first = tree().children[0];
				if (first === item.node) {
					break;
				}

				const firstElement = getItemElement(first.id);
				if (firstElement === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: TreeItemPosition | undefined = item;
					do {
						current.node.select();
						current = getPreviousItem(current);
					} while (current !== undefined);
				}

				firstElement.focus();
				break;
			}
			case "End": {
				let last = tree().children.at(-1)!;
				while (last.type === "folder" && last.expanded && last.children.length !== 0) {
					last = last.children.at(-1)!;
				}

				if (last === item.node) {
					break;
				}

				const lastElement = getItemElement(last.id);
				if (lastElement === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: TreeItemPosition | undefined = item;
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
					selectUntil(item.node, event.currentTarget);
				} else {
					item.node.toggleSelected();
				}
				break;
			}
			case "Escape": {
				tree().selected.clear();
				setPasteOperation(undefined);
				break;
			}
			case "*": {
				const owner = item.parent?.node ?? tree();
				for (const child of owner.children) {
					if (child.type === "folder") {
						child.expand();
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
				if (editable()) {
					setEditing(true);
				}
				break;
			}
			case "Delete": {
				void deleteSelected(item);
				break;
			}
			case "a": {
				if (isControlOrMeta(event)) {
					selectAll();
				}
				break;
			}
			case "c": {
				if (isControlOrMeta(event)) {
					setPasteOperation("copy");
				}
				break;
			}
			case "x": {
				if (isControlOrMeta(event)) {
					setPasteOperation("cut");
				}
				break;
			}
			case "v": {
				if (isControlOrMeta(event)) {
					void pasteSelected(item);
				}
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	const handlePointerDown: EventHandler<PointerEvent, HTMLDivElement> = (event) => {
		onpointerdown(event);

		if (event.defaultPrevented || disabled()) {
			return;
		}

		if (isControlOrMeta(event)) {
			node().toggleSelected();
		} else if (event.shiftKey) {
			selectUntil(node(), event.currentTarget);
		} else {
			tree().selected.clear();
			node().select();
		}
	};

	const handleDragStart: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragstart(event);

		if (event.defaultPrevented || disabled()) {
			return;
		}

		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = "move";
		}

		setDraggedId(node().id);
		node().select();
	};

	const handleDragOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragover(event);

		if (event.defaultPrevented || disabled()) {
			clearDropPosition();
			return;
		}

		if (draggedId() === undefined) {
			return;
		}

		if (dragged()) {
			// Don't drop the dragged item on itself.
			return;
		}

		event.preventDefault();

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}

		updateDropPosition(event.currentTarget, event.clientY);
	};

	const handleDragLeave: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragleave(event);

		if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
			// Skip if the pointer moves to a child element.
			return;
		}

		clearDropPosition();
	};

	const handleDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondrop(event);

		if (event.defaultPrevented || disabled()) {
			clearDropPosition();
			return;
		}

		const currentDraggedId = draggedId();
		if (currentDraggedId === undefined) {
			return;
		}

		event.preventDefault();

		const position = getDropPosition(
			node(),
			event.currentTarget.getBoundingClientRect(),
			event.clientY,
		);
		clearDropPosition();

		tree().selected.add(currentDraggedId);
		void moveSelected(position, {
			node: node(),
			index: index(),
			parent: parent(),
		}).then((didMove) => {
			if (didMove) {
				getItemElement(currentDraggedId)?.focus();
			}
		});
	};

	const handleDragEnd: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		ondragend(event);
		setDraggedId(undefined);
	};

	return {
		treeItemId,
		ariaSelected,
		ariaExpanded,
		ariaLevel,
		ariaPosInSet,
		ariaSetSize,
		tabIndex,
		dragged,
		dropPosition,
		handleFocusIn,
		handleKeyDown,
		handlePointerDown,
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd,
	};
};

export type TreeItemState = ReturnType<typeof createTreeItemState>;
