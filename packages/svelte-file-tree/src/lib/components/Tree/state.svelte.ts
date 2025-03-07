import type { MaybePromise } from "$lib/internal/types.js";
import {
	FileNode,
	FolderNode,
	type FileTree,
	type FileTreeItemPosition,
	type FileTreeNode,
} from "$lib/tree.svelte.js";
import type {
	DeleteItemsArgs,
	InsertItemsArgs,
	MoveErrorArgs,
	MoveItemsArgs,
	NameConflictArgs,
	NameConflictResolution,
	PasteOperation,
	RenameErrorArgs,
	RenameItemArgs,
} from "./types.js";

export type TreeContextProps = {
	tree: () => FileTree;
	pasteOperation: () => PasteOperation | undefined;
	setPasteOperation: (value: PasteOperation | undefined) => void;
	id: () => string;
	generateCopyId: () => string;
	onRenameItem: (args: RenameItemArgs) => MaybePromise<boolean>;
	onRenameError: (args: RenameErrorArgs) => void;
	onMoveItems: (args: MoveItemsArgs) => MaybePromise<boolean>;
	onMoveError: (args: MoveErrorArgs) => void;
	onInsertItems: (args: InsertItemsArgs) => MaybePromise<boolean>;
	onNameConflict: (args: NameConflictArgs) => MaybePromise<NameConflictResolution>;
	onDeleteItems: (args: DeleteItemsArgs) => MaybePromise<boolean>;
};

export type DropPosition = "before" | "after" | "inside";

export class TreeContext {
	readonly #tree: () => FileTree;
	readonly #pasteOperation: () => PasteOperation | undefined;
	readonly #setPasteOperation: (value: PasteOperation | undefined) => void;
	readonly #id: () => string;
	readonly #generateCopyId: () => string;
	readonly #onRenameItem: (args: RenameItemArgs) => MaybePromise<boolean>;
	readonly #onRenameError: (args: RenameErrorArgs) => void;
	readonly #onMoveItems: (args: MoveItemsArgs) => MaybePromise<boolean>;
	readonly #onMoveError: (args: MoveErrorArgs) => void;
	readonly #onInsertItems: (args: InsertItemsArgs) => MaybePromise<boolean>;
	readonly #onNameConflict: (args: NameConflictArgs) => MaybePromise<NameConflictResolution>;
	readonly #onDeleteItems: (args: DeleteItemsArgs) => MaybePromise<boolean>;
	readonly #lookup = new Map<string, TreeItemContext>();
	tabbableId?: string = $state.raw();
	draggedId?: string = $state.raw();

	constructor(props: TreeContextProps) {
		this.#tree = props.tree;
		this.#pasteOperation = props.pasteOperation;
		this.#setPasteOperation = props.setPasteOperation;
		this.#id = props.id;
		this.#generateCopyId = props.generateCopyId;
		this.#onRenameItem = props.onRenameItem;
		this.#onRenameError = props.onRenameError;
		this.#onMoveItems = props.onMoveItems;
		this.#onMoveError = props.onMoveError;
		this.#onInsertItems = props.onInsertItems;
		this.#onNameConflict = props.onNameConflict;
		this.#onDeleteItems = props.onDeleteItems;
	}

	get tree(): FileTree {
		return this.#tree();
	}

	get pasteOperation(): PasteOperation | undefined {
		return this.#pasteOperation();
	}

	set pasteOperation(value: PasteOperation | undefined) {
		this.#setPasteOperation(value);
	}

	get id(): string {
		return this.#id();
	}

	getItem(id: string): TreeItemContext | undefined {
		return this.#lookup.get(id);
	}

	onSetItem(itemContext: TreeItemContext): void {
		this.#lookup.set(itemContext.node.id, itemContext);
	}

	onDestroyItem(id: string): void {
		this.tree.selectedIds.delete(id);
		this.tree.expandedIds.delete(id);
		this.#lookup.delete(id);

		if (this.tabbableId === id) {
			this.tabbableId = undefined;
		}

		if (this.draggedId === id) {
			this.draggedId = undefined;
		}
	}

	getItemElementId(id: string): string {
		return `${this.id}:${id}`;
	}

	getItemElement(id: string): HTMLElement | null {
		const elementId = this.getItemElementId(id);
		return document.getElementById(elementId);
	}

	getNextNonChildItem(current: FileTreeItemPosition): FileTreeItemPosition | undefined {
		let { index, parent } = current;
		while (true) {
			const siblings = parent?.node.children ?? this.tree.children;
			const nextIndex = index + 1;
			if (nextIndex !== siblings.length) {
				return {
					node: siblings[nextIndex],
					index: nextIndex,
					parent,
				};
			}

			if (parent === undefined) {
				return;
			}

			index = parent.index;
			parent = parent.parent;
		}
	}

	getNextItem(current: FileTreeItemPosition): FileTreeItemPosition | undefined {
		const { node } = current;
		if (node.type === "folder" && node.expanded && node.children.length !== 0) {
			return {
				node: node.children[0],
				index: 0,
				parent: current as FileTreeItemPosition<FolderNode>,
			};
		}

		return this.getNextNonChildItem(current);
	}

	getPreviousItem(current: FileTreeItemPosition): FileTreeItemPosition | undefined {
		if (current.index === 0) {
			return current.parent;
		}

		let parent = current.parent;
		let index = current.index - 1;
		let node = parent?.node.children[index] ?? this.tree.children[index];

		while (node.type === "folder" && node.expanded && node.children.length !== 0) {
			parent = { node, index, parent };
			index = node.children.length - 1;
			node = node.children[index];
		}

		return { node, index, parent };
	}

	selectUntil(target: TreeItemContext, element: HTMLElement): void {
		let lastSelected: TreeItemContext | undefined;
		for (const id of this.tree.selectedIds) {
			const selectedItem = this.getItem(id);
			if (selectedItem !== undefined) {
				lastSelected = selectedItem;
			}
		}

		if (lastSelected === undefined) {
			let current: FileTreeItemPosition | undefined = {
				node: this.tree.children[0],
				index: 0,
				parent: undefined,
			};
			do {
				current.node.select();
				if (current.node === target.node) {
					break;
				}
				current = this.getNextItem(current);
			} while (current !== undefined);
			return;
		}

		const lastSelectedElement = this.getItemElement(lastSelected.node.id);
		if (lastSelectedElement === null) {
			return;
		}

		const positionBitmask = lastSelectedElement.compareDocumentPosition(element);
		const following = positionBitmask & Node.DOCUMENT_POSITION_FOLLOWING;

		let current: FileTreeItemPosition | undefined = lastSelected;
		while (current.node !== target.node) {
			current = following ? this.getNextItem(current) : this.getPreviousItem(current);
			if (current === undefined) {
				break;
			}
			current.node.select();
		}
	}

	async renameItem(name: string, target: TreeItemContext): Promise<boolean> {
		if (name.length === 0) {
			this.#onRenameError({
				error: "empty",
				target: target.node,
				name,
			});
			return false;
		}

		const owner = target.parent?.node ?? this.tree;
		for (const child of owner.children) {
			if (child !== target.node && name === child.name) {
				this.#onRenameError({
					error: "already-exists",
					target: target.node,
					name,
				});
				return false;
			}
		}

		if (name === target.node.name) {
			return false;
		}

		return this.#onRenameItem({
			target: target.node,
			name,
		});
	}

	async moveSelected(position: DropPosition, target: TreeItemContext): Promise<boolean> {
		if (target.node.selected) {
			// Don't move an item next to or inside itself.
			this.#onMoveError({
				error: "circular-reference",
				target: target.node,
			});
			return false;
		}

		if (target.nearestSelectedAncestor !== undefined) {
			// Don't move an item inside itself.
			this.#onMoveError({
				error: "circular-reference",
				target: target.nearestSelectedAncestor.node,
			});
			return false;
		}

		let owner: FolderNode | FileTree;
		switch (position) {
			case "before":
			case "after": {
				owner = target.parent?.node ?? this.tree;
				break;
			}
			case "inside": {
				if (target.node.type === "file") {
					return false;
				}

				owner = target.node;
				break;
			}
		}

		const ownerChildrenNames = new Set<string>();
		for (const child of owner.children) {
			ownerChildrenNames.add(child.name);
		}

		const moved: Array<FileTreeNode> = [];
		const movedOwners = new Set<FolderNode | FileTree>();
		const skippedIds = new Set<string>();
		for (const id of this.tree.selectedIds) {
			const selectedItem = this.getItem(id);
			if (selectedItem === undefined || selectedItem.nearestSelectedAncestor !== undefined) {
				continue;
			}

			const selectedItemOwner = selectedItem.parent?.node ?? this.tree;
			if (selectedItemOwner !== owner && ownerChildrenNames.has(selectedItem.node.name)) {
				const result = this.#onNameConflict({
					operation: "move",
					target: selectedItem.node,
				});
				const conflictResolution = result instanceof Promise ? await result : result;
				switch (conflictResolution) {
					case "skip": {
						skippedIds.add(selectedItem.node.id);
						continue;
					}
					case "cancel": {
						return false;
					}
				}
			}

			ownerChildrenNames.add(selectedItem.node.name);
			moved.push(selectedItem.node);
			movedOwners.add(selectedItemOwner);
		}

		if (moved.length === 0) {
			return false;
		}

		const updates: MoveItemsArgs["updates"] = [];
		for (const movedOwner of movedOwners) {
			if (movedOwner !== owner) {
				updates.push({
					target: movedOwner,
					children: movedOwner.children.filter(
						(child) => !child.selected || skippedIds.has(child.id),
					),
				});
			}
		}

		let children: Array<FileTreeNode>;
		switch (position) {
			case "before": {
				children = [];
				for (const child of owner.children) {
					if (child.selected) {
						continue;
					}

					if (child === target.node) {
						children.push(...moved);
					}

					children.push(child);
				}
				break;
			}
			case "after": {
				children = [];
				for (const child of owner.children) {
					if (child.selected) {
						continue;
					}

					children.push(child);

					if (child === target.node) {
						children.push(...moved);
					}
				}
				break;
			}
			case "inside": {
				children = owner.children.filter((child) => !child.selected);
				children.push(...moved);
				break;
			}
		}

		updates.push({
			target: owner,
			children,
		});

		return this.#onMoveItems({
			updates,
			moved,
		});
	}

	#copyNode(node: FileTreeNode): FileTreeNode {
		const id = this.#generateCopyId();
		switch (node.type) {
			case "file": {
				return new FileNode({
					tree: this.tree,
					id,
					name: node.name,
				});
			}
			case "folder": {
				return new FolderNode({
					tree: this.tree,
					id,
					name: node.name,
					children: node.children.map(this.#copyNode, this),
				});
			}
		}
	}

	async #copyPasteSelected(position: DropPosition, target: TreeItemContext): Promise<boolean> {
		let owner: FolderNode | FileTree;
		switch (position) {
			case "before":
			case "after":
				owner = target.parent?.node ?? this.tree;
				break;
			case "inside": {
				if (target.node.type === "file") {
					return false;
				}

				owner = target.node;
				break;
			}
		}

		const ownerChildrenNames = new Set<string>();
		for (const child of owner.children) {
			ownerChildrenNames.add(child.name);
		}

		const copies: Array<FileTreeNode> = [];
		for (const id of this.tree.selectedIds) {
			const selectedItem = this.getItem(id);
			if (selectedItem === undefined || selectedItem.nearestSelectedAncestor !== undefined) {
				continue;
			}

			const copy = this.#copyNode(selectedItem.node);
			if (ownerChildrenNames.has(copy.name)) {
				const result = this.#onNameConflict({
					operation: "insert",
					target: copy,
				});
				const conflictResolution = result instanceof Promise ? await result : result;
				switch (conflictResolution) {
					case "skip": {
						continue;
					}
					case "cancel": {
						return false;
					}
				}
			}

			ownerChildrenNames.add(copy.name);
			copies.push(copy);
		}

		if (copies.length === 0) {
			return false;
		}

		let start: number;
		switch (position) {
			case "before": {
				start = target.index;
				break;
			}
			case "after": {
				start = target.index + 1;
				break;
			}
			case "inside": {
				start = owner.children.length;
				break;
			}
		}

		return this.#onInsertItems({
			target: owner,
			start,
			inserted: copies,
		});
	}

	async pasteSelected(position: DropPosition, target: TreeItemContext): Promise<boolean> {
		let didPaste: boolean;
		switch (this.pasteOperation) {
			case "copy": {
				didPaste = await this.#copyPasteSelected(position, target);
				break;
			}
			case "cut": {
				didPaste = await this.moveSelected(position, target);
				break;
			}
			case undefined: {
				return false;
			}
		}

		if (didPaste) {
			this.pasteOperation = undefined;
		}

		return didPaste;
	}

	async deleteSelected(target: TreeItemContext): Promise<boolean> {
		const deleted: Array<FileTreeNode> = [];
		const deletedOwners = new Set<FolderNode | FileTree>();
		for (const id of this.tree.selectedIds) {
			const selectedItem = this.getItem(id);
			if (selectedItem === undefined || selectedItem.nearestSelectedAncestor !== undefined) {
				continue;
			}

			deleted.push(selectedItem.node);
			deletedOwners.add(selectedItem.parent?.node ?? this.tree);
		}

		if (deleted.length === 0) {
			return false;
		}

		let focusTarget: FileTreeItemPosition | undefined = target;
		do {
			// Move to the highest selected ancestor as all its children will be deleted.
			for (
				let ancestor: FileTreeItemPosition<FolderNode> | undefined = focusTarget.parent;
				ancestor !== undefined;
				ancestor = ancestor.parent
			) {
				if (ancestor.node.selected) {
					focusTarget = ancestor;
				}
			}

			// Focus the nearest remaining item after this item.
			let nearestUnselected: FileTreeItemPosition | undefined = focusTarget;
			while (nearestUnselected?.node.selected) {
				// The current item will be deleted, so we shouldn't traverse its children.
				nearestUnselected = this.getNextNonChildItem(nearestUnselected);
			}

			if (nearestUnselected === undefined) {
				// Focus the nearest remaining item before this item.
				nearestUnselected = focusTarget;
				while (nearestUnselected?.node.selected) {
					nearestUnselected = this.getPreviousItem(nearestUnselected);
				}
			}

			if (focusTarget === nearestUnselected) {
				break;
			}

			// This item might be inside a selected folder, so we need to continue the loop.
			focusTarget = nearestUnselected;
		} while (focusTarget !== undefined);

		const updates: DeleteItemsArgs["updates"] = [];
		for (const deletedOwner of deletedOwners) {
			updates.push({
				target: deletedOwner,
				children: deletedOwner.children.filter((child) => !child.selected),
			});
		}

		const result = this.#onDeleteItems({
			updates,
			deleted,
		});
		const didDelete = result instanceof Promise ? await result : result;

		if (didDelete && focusTarget !== undefined) {
			this.getItemElement(focusTarget.node.id)?.focus();
		}

		return didDelete;
	}
}

export type DropPositionStateProps = {
	node: () => FileTreeNode;
};

export class DropPositionState {
	readonly #node: () => FileTreeNode;

	constructor(props: DropPositionStateProps) {
		this.#node = props.node;
	}

	#current?: DropPosition = $state.raw();
	#updateRequestId?: number;

	get current(): DropPosition | undefined {
		return this.#current;
	}

	get(rect: DOMRect, clientY: number): DropPosition {
		const node = this.#node();
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

export type TreeItemContextProps<TNode extends FileTreeNode = FileTreeNode> = {
	treeContext: TreeContext;
	parent: TreeItemContext<FolderNode> | undefined;
	node: () => TNode;
	index: () => number;
	editable: () => boolean;
	disabled: () => boolean;
};

export class TreeItemContext<TNode extends FileTreeNode = FileTreeNode> {
	readonly #treeContext: TreeContext;
	readonly #node: () => TNode;
	readonly #index: () => number;
	readonly #editable: () => boolean;
	readonly #disabled: () => boolean;
	readonly parent?: TreeItemContext<FolderNode>;
	readonly depth: number;
	readonly dropPosition: DropPositionState;
	editing: boolean = $state.raw(false);

	constructor(props: TreeItemContextProps<TNode>) {
		this.#treeContext = props.treeContext;
		this.#node = props.node;
		this.#index = props.index;
		this.#editable = props.editable;
		this.#disabled = props.disabled;
		this.parent = props.parent;
		this.depth = props.parent !== undefined ? props.parent.depth + 1 : 0;
		this.dropPosition = new DropPositionState(props);
	}

	get node(): TNode {
		return this.#node();
	}

	get index(): number {
		return this.#index();
	}

	get editable(): boolean {
		return this.#editable();
	}

	readonly disabled: boolean = $derived.by(() => {
		if (this.parent?.disabled) {
			return true;
		}
		return this.#disabled();
	});

	readonly nearestSelectedAncestor: TreeItemContext<FolderNode> | undefined = $derived.by(() => {
		if (this.parent === undefined) {
			return;
		}
		if (this.parent.node.selected) {
			return this.parent;
		}
		return this.parent.nearestSelectedAncestor;
	});

	readonly dragged: boolean = $derived.by(() => {
		if (this.#treeContext.draggedId === undefined) {
			return false;
		}
		if (this.#treeContext.draggedId === this.node.id) {
			return true;
		}
		return this.node.selected && this.nearestSelectedAncestor === undefined;
	});

	onDestroy(): void {
		this.dropPosition.clear();
		this.editing = false;
	}
}

export class TreeItemSnippetArgs {
	readonly #context: TreeItemContext;

	constructor(context: TreeItemContext) {
		this.#context = context;
	}

	get node(): FileTreeNode {
		return this.#context.node;
	}

	get index(): number {
		return this.#context.index;
	}

	get depth(): number {
		return this.#context.depth;
	}

	get editable(): boolean {
		return this.#context.editable;
	}

	get editing(): boolean {
		return this.#context.editing;
	}

	set editing(value: boolean) {
		this.#context.editing = value;
	}

	get disabled(): boolean {
		return this.#context.disabled;
	}

	get dragged(): boolean {
		return this.#context.dragged;
	}

	get dropPosition(): DropPosition | undefined {
		return this.#context.dropPosition.current;
	}
}
