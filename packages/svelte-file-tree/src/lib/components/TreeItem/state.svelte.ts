import { isControlOrMeta } from "$lib/internal/helpers.svelte.js";
import type { FileTreeItemPosition } from "$lib/tree.svelte.js";
import { flushSync } from "svelte";
import type { EventHandler } from "svelte/elements";
import type { DropPosition, TreeContext, TreeItemProviderContext } from "../Tree/state.svelte.js";

export type DropPositionStateProps = {
	itemProviderContext: TreeItemProviderContext;
};

export class DropPositionState {
	readonly #itemProviderContext: TreeItemProviderContext;

	constructor(props: DropPositionStateProps) {
		this.#itemProviderContext = props.itemProviderContext;
	}

	#current?: DropPosition = $state.raw();
	#updateRequestId?: number;

	get current(): DropPosition | undefined {
		return this.#current;
	}

	get(rect: DOMRect, clientY: number): DropPosition {
		switch (this.#itemProviderContext.node.type) {
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
	}

	update(element: HTMLElement, clientY: number): void {
		if (this.#updateRequestId !== undefined) {
			return;
		}

		this.#updateRequestId = window.requestAnimationFrame(() => {
			this.#current = this.get(element.getBoundingClientRect(), clientY);
			this.#updateRequestId = undefined;
		});
	}

	clear(): void {
		this.#current = undefined;

		if (this.#updateRequestId !== undefined) {
			window.cancelAnimationFrame(this.#updateRequestId);
			this.#updateRequestId = undefined;
		}
	}
}

export type TreeItemContextProps = {
	editable: () => boolean;
	editing: () => boolean;
	setEditing: (value: boolean) => void;
	disabled: () => boolean;
	dropPositionState: DropPositionState;
};

export class TreeItemContext {
	readonly #editable: () => boolean;
	readonly #editing: () => boolean;
	readonly #setEditing: (value: boolean) => void;
	readonly #disabled: () => boolean;
	readonly #dropPositionState: DropPositionState;

	constructor(props: TreeItemContextProps) {
		this.#editable = props.editable;
		this.#editing = props.editing;
		this.#setEditing = props.setEditing;
		this.#disabled = props.disabled;
		this.#dropPositionState = props.dropPositionState;
	}

	get editable(): boolean {
		return this.#editable();
	}

	get editing(): boolean {
		return this.#editing();
	}

	set editing(value: boolean) {
		this.#setEditing(value);
	}

	get disabled(): boolean {
		return this.#disabled();
	}

	get dropPosition(): DropPosition | undefined {
		return this.#dropPositionState.current;
	}
}

export type TreeItemAttributesProps = {
	treeContext: TreeContext;
	itemProviderContext: TreeItemProviderContext;
	itemContext: TreeItemContext;
	dropPositionState: DropPositionState;
};

export class TreeItemAttributes {
	readonly #treeContext: TreeContext;
	readonly #itemProviderContext: TreeItemProviderContext;
	readonly #itemContext: TreeItemContext;
	readonly #dropPositionState: DropPositionState;

	constructor(props: TreeItemAttributesProps) {
		this.#treeContext = props.treeContext;
		this.#itemProviderContext = props.itemProviderContext;
		this.#itemContext = props.itemContext;
		this.#dropPositionState = props.dropPositionState;
	}

	get id(): string {
		return this.#treeContext.getItemElementId(this.#itemProviderContext.node.id);
	}

	get ariaSelected(): boolean {
		return this.#itemProviderContext.node.selected;
	}

	get ariaExpanded(): boolean | undefined {
		const { node } = this.#itemProviderContext;
		if (node.type === "folder") {
			return node.expanded;
		}
	}

	get ariaLevel(): number {
		return this.#itemProviderContext.depth + 1;
	}

	get ariaPosInSet(): number {
		return this.#itemProviderContext.index + 1;
	}

	get ariaSetSize(): number {
		const owner = this.#itemProviderContext.parent?.node ?? this.#treeContext.tree;
		return owner.children.length;
	}

	get tabIndex(): 0 | -1 {
		const tabbableId = this.#treeContext.tabbableId ?? this.#treeContext.tree.children[0].id;
		return tabbableId === this.#itemProviderContext.node.id ? 0 : -1;
	}

	readonly onfocusin: EventHandler<FocusEvent, HTMLElement> = () => {
		this.#treeContext.tabbableId = this.#itemProviderContext.node.id;
	};

	readonly onkeydown: EventHandler<KeyboardEvent, HTMLElement> = (event) => {
		if (this.#itemContext.disabled) {
			return;
		}

		if (event.target !== event.currentTarget) {
			// Don't handle keydown events that bubble up from child elements.
			// This can cause unexpected behavior with child inputs.
			return;
		}

		switch (event.key) {
			case "ArrowRight": {
				if (this.#itemProviderContext.node.type === "file") {
					break;
				}

				if (!this.#itemProviderContext.node.expanded) {
					this.#itemProviderContext.node.expand();
				} else if (this.#itemProviderContext.node.children.length !== 0) {
					this.#treeContext.getItemElement(this.#itemProviderContext.node.children[0].id)?.focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (
					this.#itemProviderContext.node.type === "folder" &&
					this.#itemProviderContext.node.expanded
				) {
					this.#itemProviderContext.node.collapse();
				} else if (this.#itemProviderContext.parent !== undefined) {
					this.#treeContext.getItemElement(this.#itemProviderContext.parent.node.id)?.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const down = event.key === "ArrowDown";
				const next = down
					? this.#treeContext.tree.getNextItem(this.#itemProviderContext)
					: this.#treeContext.tree.getPreviousItem(this.#itemProviderContext);
				if (next === undefined) {
					break;
				}

				const nextElement = this.#treeContext.getItemElement(next.node.id);
				if (nextElement === null) {
					break;
				}

				if (event.shiftKey) {
					this.#itemProviderContext.node.select();
					next.node.select();
				}

				nextElement.focus();
				break;
			}
			case "PageDown":
			case "PageUp": {
				const down = event.key === "PageDown";
				const maxScrollDistance = Math.min(
					document.getElementById(this.#treeContext.id)!.clientHeight,
					document.documentElement.clientHeight,
				);
				const itemRect = event.currentTarget.getBoundingClientRect();

				let current: FileTreeItemPosition = this.#itemProviderContext;
				let currentElement: HTMLElement = event.currentTarget;
				while (true) {
					const next = down
						? this.#treeContext.tree.getNextItem(current)
						: this.#treeContext.tree.getPreviousItem(current);
					if (next === undefined) {
						break;
					}

					const nextElement = this.#treeContext.getItemElement(next.node.id);
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

				if (current === this.#itemProviderContext) {
					break;
				}

				if (event.shiftKey) {
					current.node.select();
				}

				currentElement.focus();
				break;
			}
			case "Home": {
				const first = this.#treeContext.tree.children[0];
				if (first === this.#itemProviderContext.node) {
					break;
				}

				const firstElement = this.#treeContext.getItemElement(first.id);
				if (firstElement === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: FileTreeItemPosition | undefined = this.#itemProviderContext;
					do {
						current.node.select();
						current = this.#treeContext.tree.getPreviousItem(current);
					} while (current !== undefined);
				}

				firstElement.focus();
				break;
			}
			case "End": {
				let last = this.#treeContext.tree.children.at(-1)!;
				while (last.type === "folder" && last.expanded && last.children.length !== 0) {
					last = last.children.at(-1)!;
				}

				if (last === this.#itemProviderContext.node) {
					break;
				}

				const lastElement = this.#treeContext.getItemElement(last.id);
				if (lastElement === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: FileTreeItemPosition | undefined = this.#itemProviderContext;
					do {
						current.node.select();
						current = this.#treeContext.tree.getNextItem(current);
					} while (current !== undefined);
				}

				lastElement.focus();
				break;
			}
			case " ": {
				if (event.shiftKey) {
					this.#treeContext.selectUntil(this.#itemProviderContext, event.currentTarget);
				} else {
					this.#itemProviderContext.node.toggleSelected();
				}
				break;
			}
			case "Escape": {
				this.#treeContext.tree.selectedIds.clear();
				this.#treeContext.pasteOperation = undefined;
				break;
			}
			case "*": {
				const owner = this.#itemProviderContext.parent?.node ?? this.#treeContext.tree;
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
				if (this.#itemContext.editable) {
					this.#itemContext.editing = true;
				}
				break;
			}
			case "Delete": {
				void this.#treeContext.deleteSelected(this.#itemProviderContext);
				break;
			}
			case "a": {
				if (isControlOrMeta(event)) {
					this.#treeContext.tree.selectVisible();
				}
				break;
			}
			case "c": {
				if (isControlOrMeta(event)) {
					this.#treeContext.pasteOperation = "copy";
				}
				break;
			}
			case "x": {
				if (isControlOrMeta(event)) {
					this.#treeContext.pasteOperation = "cut";
				}
				break;
			}
			case "v": {
				if (isControlOrMeta(event)) {
					let position: DropPosition;
					switch (this.#itemProviderContext.node.type) {
						case "file": {
							position = "after";
							break;
						}
						case "folder": {
							position = this.#itemProviderContext.node.expanded ? "inside" : "after";
							break;
						}
					}

					void this.#treeContext.pasteSelected(position, this.#itemProviderContext);
				}
				break;
			}
			default: {
				return;
			}
		}

		event.preventDefault();
	};

	readonly onclick: EventHandler<MouseEvent, HTMLElement> = (event) => {
		if (this.#itemContext.disabled) {
			return;
		}

		if (isControlOrMeta(event)) {
			this.#itemProviderContext.node.toggleSelected();
		} else if (event.shiftKey) {
			this.#treeContext.selectUntil(this.#itemProviderContext, event.currentTarget);
		} else {
			this.#treeContext.tree.selectedIds.clear();
			this.#itemProviderContext.node.select();
		}
	};

	readonly ondragstart: EventHandler<DragEvent, HTMLElement> = (event) => {
		if (this.#itemContext.disabled) {
			return;
		}

		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = "move";
		}

		this.#treeContext.draggedId = this.#itemProviderContext.node.id;

		if (event.shiftKey) {
			this.#treeContext.selectUntil(this.#itemProviderContext, event.currentTarget);
		} else {
			this.#itemProviderContext.node.select();
		}
	};

	readonly ondragover: EventHandler<DragEvent, HTMLElement> = (event) => {
		if (
			this.#itemContext.disabled ||
			this.#treeContext.draggedId === undefined ||
			this.#itemProviderContext.node.selected ||
			this.#itemProviderContext.nearestSelectedAncestor !== undefined
		) {
			// If the dragged item is dropped next to or inside a selected item,
			// it would cause a circular reference because the selected item
			// would be moved inside itself.
			this.#dropPositionState.clear();
			return;
		}

		this.#dropPositionState.update(event.currentTarget, event.clientY);

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = "move";
		}

		event.preventDefault();
	};

	readonly ondragleave: EventHandler<DragEvent, HTMLElement> = (event) => {
		if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
			// Skip if the pointer moves to a child element.
			return;
		}

		this.#dropPositionState.clear();
	};

	readonly ondrop: EventHandler<DragEvent, HTMLElement> = (event) => {
		this.#dropPositionState.clear();

		const draggedId = this.#treeContext.draggedId;
		if (this.#itemContext.disabled || draggedId === undefined) {
			return;
		}

		const position = this.#dropPositionState.get(
			event.currentTarget.getBoundingClientRect(),
			event.clientY,
		);

		this.#treeContext.tree.selectedIds.add(draggedId);
		void this.#treeContext.moveSelected(position, this.#itemProviderContext).then((didMove) => {
			if (didMove) {
				this.#treeContext.getItemElement(draggedId)?.focus();
			}
		});

		event.preventDefault();
	};

	readonly ondragend: EventHandler<DragEvent, HTMLElement> = () => {
		this.#treeContext.draggedId = undefined;
	};
}
