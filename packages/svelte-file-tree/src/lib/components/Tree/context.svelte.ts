import type { FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import { SvelteSet } from "svelte/reactivity";
import { copyNode, getNextItem, getPreviousItem, hasSelectedAncestor } from "./helpers.js";
import type { TreeItemDropPosition, TreeProps } from "./types.js";

export type TreeCallbacks = Required<
	Pick<
		TreeProps,
		| "onMoveItems"
		| "onMoveCircularReferenceError"
		| "onMoveNameConflictError"
		| "onInsertItems"
		| "onDeleteItems"
		| "onRenameItem"
		| "onRenameError"
	>
>;

export type TreeItemData<TNode extends FileTreeNode = FileTreeNode> = {
	node: TNode;
	index: number;
	level: FileTreeNode[];
	parent: TreeItemData<FolderNode> | undefined;
};

export type PasteAction = "copy" | "cut";

export type TreeContextProps = {
	id: () => string;
	callbacks: TreeCallbacks;
};

export class TreeContext {
	readonly #id: () => string;
	readonly callbacks: TreeCallbacks;
	readonly #items = new Map<string, TreeItemData>();
	readonly #clipboardIds = new SvelteSet<string>();
	#pasteAction?: PasteAction = $state.raw();
	#tabbableId?: string = $state.raw();
	#draggedId?: string = $state.raw();

	constructor(props: TreeContextProps) {
		this.#id = props.id;
		this.callbacks = props.callbacks;
	}

	get id(): string {
		return this.#id();
	}

	getItemElementId(node: FileTreeNode): string {
		return `${this.id}:${node.id}`;
	}

	getItemElement(node: FileTreeNode): HTMLElement | null {
		const elementId = this.getItemElementId(node);
		return document.getElementById(elementId);
	}

	getItem(id: string): TreeItemData | undefined {
		return this.#items.get(id);
	}

	setItem(item: TreeItemData): void {
		this.#items.set(item.node.id, item);
	}

	deleteItem(node: FileTreeNode): void {
		const { tree, id } = node;
		tree.selected.delete(id);
		tree.expanded.delete(id);

		this.#items.delete(id);
		this.#clipboardIds.delete(id);

		if (this.#tabbableId === id) {
			this.#tabbableId = undefined;
		}

		if (this.#draggedId === id) {
			this.#draggedId = undefined;
		}
	}

	isCopied(node: FileTreeNode): boolean {
		return this.#pasteAction === "copy" && this.#clipboardIds.has(node.id);
	}

	isCut(node: FileTreeNode): boolean {
		return this.#pasteAction === "cut" && this.#clipboardIds.has(node.id);
	}

	isTabbable(node: FileTreeNode): boolean {
		if (this.#tabbableId === undefined) {
			return node.tree.children[0] === node;
		}
		return this.#tabbableId === node.id;
	}

	setTabbable(node: FileTreeNode): void {
		this.#tabbableId = node.id;
	}

	hasDragged(): boolean {
		return this.#draggedId !== undefined;
	}

	isDragged(node: FileTreeNode): boolean {
		return this.#draggedId === node.id;
	}

	getDragged(): TreeItemData | undefined {
		if (this.#draggedId === undefined) {
			return;
		}
		return this.getItem(this.#draggedId);
	}

	setDragged(node: FileTreeNode): void {
		this.#draggedId = node.id;
	}

	clearDragged(): void {
		this.#draggedId = undefined;
	}

	copySelected(tree: FileTree): void {
		this.#setClipboardIds(tree);
		this.#pasteAction = "copy";
	}

	cutSelected(tree: FileTree): void {
		this.#setClipboardIds(tree);
		this.#pasteAction = "cut";
	}

	#setClipboardIds(tree: FileTree): void {
		this.#clipboardIds.clear();
		for (const id of tree.selected) {
			const current = this.getItem(id);
			if (current === undefined) {
				continue;
			}

			// Don't copy/cut an item twice. If an ancestor is selected,
			// its entire subtree will also be copied/cut.
			if (hasSelectedAncestor(current)) {
				continue;
			}

			this.#clipboardIds.add(id);
		}
	}

	async paste(
		node: FileTreeNode,
		index: number,
		level: FileTreeNode[],
		parent: TreeItemData<FolderNode> | undefined,
	): Promise<void> {
		if (this.#pasteAction === undefined) {
			return;
		}

		const shouldPasteInside = node.type === "folder" && node.expanded;
		const pasteParent = shouldPasteInside ? node : parent?.node;
		const pasteLevel = shouldPasteInside ? node.children : level;
		const pasteIndex = shouldPasteInside ? pasteLevel.length : index + 1;

		switch (this.#pasteAction) {
			case "copy": {
				const pasted: FileTreeNode[] = [];
				for (const id of this.#clipboardIds) {
					const current = this.getItem(id);
					if (current === undefined) {
						continue;
					}

					const copy = copyNode(current.node);
					pasted.push(copy);
				}

				if (pasted.length === 0) {
					break;
				}

				const uniqueNames = new Set<string>();
				for (const current of pasteLevel) {
					uniqueNames.add(current.name);
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

				if (shouldPasteInside) {
					pasteLevel.push(...pasted);
				} else {
					pasteLevel.splice(pasteIndex, 0, ...pasted);
				}

				this.clearClipboard();
				this.callbacks.onInsertItems({
					inserted: pasted,
					start: pasteIndex,
					level: pasteLevel,
					parent: pasteParent,
				});
				break;
			}
			case "cut": {
				// If one of the ancestors is cut, it will be pasted inside
				// one of its descendants, which causes a circular reference.
				let cutAncestor: FolderNode | undefined;
				{
					let ancestor = parent;
					while (ancestor !== undefined) {
						if (this.#clipboardIds.has(ancestor.node.id)) {
							cutAncestor = ancestor.node;
							break;
						}
						ancestor = ancestor.parent;
					}
				}

				if (cutAncestor !== undefined) {
					this.callbacks.onMoveCircularReferenceError({
						node: cutAncestor,
						descendant: node,
					});
					break;
				}

				const nameToNode = new Map<string, FileTreeNode>();
				for (const current of pasteLevel) {
					nameToNode.set(current.name, current);
				}

				const pasted: FileTreeNode[] = [];
				const parentsOfPasted = new Set<FileTree | FolderNode>();
				for (const id of this.#clipboardIds) {
					const current = this.getItem(id);
					if (current === undefined) {
						continue;
					}

					// If the current item is in the paste queue, skip it
					// to avoid pasting it inside itself.
					if (current.node === node) {
						continue;
					}

					const conflicting = nameToNode.get(current.node.name);
					if (conflicting === undefined) {
						pasted.push(current.node);
						parentsOfPasted.add(current.parent?.node ?? node.tree);
						continue;
					}

					const resolution = await this.callbacks.onMoveNameConflictError({
						node: current.node,
						conflicting,
					});

					switch (resolution ?? "stop") {
						case "skip": {
							continue;
						}
						case "stop": {
							return;
						}
					}
				}

				if (pasted.length === 0) {
					break;
				}

				for (const current of parentsOfPasted) {
					current.children = current.children.filter((child) => !this.#clipboardIds.has(child.id));
				}

				if (shouldPasteInside) {
					pasteLevel.push(...pasted);
				} else {
					pasteLevel.splice(pasteIndex, 0, ...pasted);
				}

				this.clearClipboard();
				this.callbacks.onMoveItems({
					moved: pasted,
					start: pasteIndex,
					level: pasteLevel,
					parent: pasteParent,
				});
				break;
			}
		}
	}

	clearClipboard(): void {
		this.#clipboardIds.clear();
		this.#pasteAction = undefined;
	}

	selectUntil(node: FileTreeNode, element: HTMLElement): void {
		const { tree } = node;

		let lastSelected: TreeItemData | undefined;
		for (const id of tree.selected) {
			const current = this.getItem(id);
			if (current !== undefined) {
				lastSelected = current;
			}
		}

		if (lastSelected === undefined) {
			let current: TreeItemData | undefined = {
				node: tree.children[0],
				index: 0,
				level: tree.children,
				parent: undefined,
			};
			do {
				current.node.select();
				if (current.node === node) {
					break;
				}
				current = getNextItem(current);
			} while (current !== undefined);
			return;
		}

		const lastSelectedElement = this.getItemElement(lastSelected.node);
		if (lastSelectedElement === null) {
			return;
		}

		const positionBitmask = lastSelectedElement.compareDocumentPosition(element);
		const following = positionBitmask & Node.DOCUMENT_POSITION_FOLLOWING;

		let current: TreeItemData | undefined = lastSelected;
		while (current.node !== node) {
			current = following ? getNextItem(current) : getPreviousItem(current);
			if (current === undefined) {
				break;
			}
			current.node.select();
		}
	}

	static readonly key = Symbol("TreeContext");
}

export type TreeItemContextProps = {
	node: () => FileTreeNode;
	index: () => number;
	level: () => FileTreeNode[];
	parent: () => TreeItemData<FolderNode> | undefined;
	depth: () => number;
};

export class TreeItemContext {
	readonly #node: () => FileTreeNode;
	readonly #index: () => number;
	readonly #level: () => FileTreeNode[];
	readonly #parent: () => TreeItemData<FolderNode> | undefined;
	readonly #depth: () => number;
	editing: boolean = $state.raw(false);
	#dropPosition?: TreeItemDropPosition = $state.raw();

	constructor(props: TreeItemContextProps) {
		this.#node = props.node;
		this.#index = props.index;
		this.#level = props.level;
		this.#parent = props.parent;
		this.#depth = props.depth;
	}

	get node(): FileTreeNode {
		return this.#node();
	}

	get index(): number {
		return this.#index();
	}

	get level(): FileTreeNode[] {
		return this.#level();
	}

	get parent(): TreeItemData<FolderNode> | undefined {
		return this.#parent();
	}

	get depth(): number {
		return this.#depth();
	}

	get dropPosition(): TreeItemDropPosition | undefined {
		return this.#dropPosition;
	}

	updateDropPosition(rect: DOMRect, clientY: number): TreeItemDropPosition {
		const { top, bottom, height } = rect;
		switch (this.node.type) {
			case "file": {
				if (clientY < top + height / 2) {
					this.#dropPosition = "before";
				} else {
					this.#dropPosition = "after";
				}
				break;
			}
			case "folder": {
				if (clientY < top + height / 3) {
					this.#dropPosition = "before";
				} else if (clientY > bottom - height / 3) {
					this.#dropPosition = "after";
				} else {
					this.#dropPosition = "inside";
				}
				break;
			}
		}
		return this.#dropPosition;
	}

	clearDropPosition(): void {
		this.#dropPosition = undefined;
	}

	static readonly key = Symbol("TreeItemProviderContext");
}
