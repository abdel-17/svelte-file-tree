import { isControlOrMeta } from "$lib/internal/helpers.svelte.js";
import { flushSync } from "svelte";
import type { EventHandler } from "svelte/elements";
import type { TreeContext, TreeItemContext, TreeItemPosition } from "../Tree/state.svelte.js";
import type { DropPosition } from "../Tree/types.js";

export type TreeItemAttributesProps = {
	treeContext: TreeContext;
	itemContext: TreeItemContext;
};

export class TreeItemAttributes {
	readonly #treeContext: TreeContext;
	readonly #itemContext: TreeItemContext;

	constructor(props: TreeItemAttributesProps) {
		this.#treeContext = props.treeContext;
		this.#itemContext = props.itemContext;
	}

	get id(): string {
		return this.#treeContext.getItemElementId(this.#itemContext.node.id);
	}

	get ariaSelected(): boolean {
		return this.#itemContext.node.selected;
	}

	get ariaExpanded(): boolean | undefined {
		if (this.#itemContext.node.type === "folder") {
			return this.#itemContext.node.expanded;
		}
	}

	get ariaLevel(): number {
		return this.#itemContext.depth + 1;
	}

	get ariaPosInSet(): number {
		return this.#itemContext.index + 1;
	}

	get ariaSetSize(): number {
		const owner = this.#itemContext.parent?.node ?? this.#treeContext.tree;
		return owner.children.length;
	}

	get tabIndex(): 0 | -1 {
		const tabbableId = this.#treeContext.tabbableId ?? this.#treeContext.tree.children[0].id;
		return tabbableId === this.#itemContext.node.id ? 0 : -1;
	}

	readonly onfocusin: EventHandler<FocusEvent, HTMLElement> = () => {
		this.#treeContext.tabbableId = this.#itemContext.node.id;
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
				if (this.#itemContext.node.type === "file") {
					break;
				}

				if (!this.#itemContext.node.expanded) {
					this.#itemContext.node.expand();
				} else if (this.#itemContext.node.children.length !== 0) {
					this.#treeContext.getItemElement(this.#itemContext.node.children[0].id)?.focus();
				}
				break;
			}
			case "ArrowLeft": {
				if (this.#itemContext.node.type === "folder" && this.#itemContext.node.expanded) {
					this.#itemContext.node.collapse();
				} else if (this.#itemContext.parent !== undefined) {
					this.#treeContext.getItemElement(this.#itemContext.parent.node.id)?.focus();
				}
				break;
			}
			case "ArrowDown":
			case "ArrowUp": {
				const down = event.key === "ArrowDown";
				const next = down
					? this.#treeContext.getNextItem(this.#itemContext)
					: this.#treeContext.getPreviousItem(this.#itemContext);
				if (next === undefined) {
					break;
				}

				const nextElement = this.#treeContext.getItemElement(next.node.id);
				if (nextElement === null) {
					break;
				}

				if (event.shiftKey) {
					this.#itemContext.node.select();
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

				let current: TreeItemPosition = this.#itemContext;
				let currentElement: HTMLElement = event.currentTarget;
				while (true) {
					const next = down
						? this.#treeContext.getNextItem(current)
						: this.#treeContext.getPreviousItem(current);
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

				if (current === this.#itemContext) {
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
				if (first === this.#itemContext.node) {
					break;
				}

				const firstElement = this.#treeContext.getItemElement(first.id);
				if (firstElement === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: TreeItemPosition | undefined = this.#itemContext;
					do {
						current.node.select();
						current = this.#treeContext.getPreviousItem(current);
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

				if (last === this.#itemContext.node) {
					break;
				}

				const lastElement = this.#treeContext.getItemElement(last.id);
				if (lastElement === null) {
					break;
				}

				if (event.shiftKey && isControlOrMeta(event)) {
					let current: TreeItemPosition | undefined = this.#itemContext;
					do {
						current.node.select();
						current = this.#treeContext.getNextItem(current);
					} while (current !== undefined);
				}

				lastElement.focus();
				break;
			}
			case " ": {
				if (event.shiftKey) {
					this.#treeContext.selectUntil(this.#itemContext, event.currentTarget);
				} else {
					this.#itemContext.node.toggleSelected();
				}
				break;
			}
			case "Escape": {
				this.#treeContext.tree.selectedIds.clear();
				this.#treeContext.clearClipboard();
				break;
			}
			case "*": {
				const owner = this.#itemContext.parent?.node ?? this.#treeContext.tree;
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
				void this.#treeContext.deleteSelected(this.#itemContext);
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
					this.#treeContext.copySelectedToClipboard("copy");
				}
				break;
			}
			case "x": {
				if (isControlOrMeta(event)) {
					this.#treeContext.copySelectedToClipboard("cut");
				}
				break;
			}
			case "v": {
				if (isControlOrMeta(event)) {
					let position: DropPosition;
					switch (this.#itemContext.node.type) {
						case "file": {
							position = "after";
							break;
						}
						case "folder": {
							position = this.#itemContext.node.expanded ? "inside" : "after";
							break;
						}
					}

					void this.#treeContext.paste(this.#itemContext, position);
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
			this.#itemContext.node.toggleSelected();
		} else if (event.shiftKey) {
			this.#treeContext.selectUntil(this.#itemContext, event.currentTarget);
		} else {
			this.#treeContext.tree.selectedIds.clear();
			this.#itemContext.node.select();
		}
	};

	readonly ondragstart: EventHandler<DragEvent, HTMLElement> = (event) => {
		if (this.#itemContext.disabled) {
			return;
		}

		if (event.dataTransfer !== null) {
			event.dataTransfer.effectAllowed = "move";
		}

		this.#treeContext.draggedId = this.#itemContext.node.id;

		if (event.shiftKey) {
			this.#treeContext.selectUntil(this.#itemContext, event.currentTarget);
		} else {
			this.#itemContext.node.select();
		}
	};

	readonly ondragover: EventHandler<DragEvent, HTMLElement> = (event) => {
		if (
			this.#itemContext.disabled ||
			this.#treeContext.draggedId === undefined ||
			this.#itemContext.node.selected ||
			this.#itemContext.nearestSelectedAncestor !== undefined
		) {
			// If the dragged item is dropped next to or inside a selected item,
			// it would cause a circular reference because the selected item
			// would be moved next to or inside itself.
			this.#itemContext.dropPosition.clear();
			return;
		}

		this.#itemContext.dropPosition.update(event.currentTarget, event.clientY);

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

		this.#itemContext.dropPosition.clear();
	};

	readonly ondrop: EventHandler<DragEvent, HTMLElement> = (event) => {
		this.#itemContext.dropPosition.clear();

		const draggedId = this.#treeContext.draggedId;
		if (this.#itemContext.disabled || draggedId === undefined) {
			return;
		}

		const position = this.#itemContext.dropPosition.get(
			event.currentTarget.getBoundingClientRect(),
			event.clientY,
		);

		this.#treeContext.tree.selectedIds.add(draggedId);
		void this.#treeContext.moveSelected(this.#itemContext, position).then((didMove) => {
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
