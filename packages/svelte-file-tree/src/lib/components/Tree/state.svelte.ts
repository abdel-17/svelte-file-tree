import type { MaybePromise } from "$lib/internal/types.js";
import { FileNode, FolderNode, type FileTree } from "$lib/tree.svelte.js";
import { DEV } from "esm-env";

export type PasteOperation = "copy" | "cut";

export type RenameItemArgs = {
	target: FileTree.Node;
	name: string;
};

export type RenameErrorArgs = {
	error: "empty" | "already-exists";
	target: FileTree.Node;
	name: string;
};

export type MoveItemsArgs = {
	updates: Array<{
		target: FolderNode | FileTree;
		children: Array<FileTree.Node>;
	}>;
	moved: Array<FileTree.Node>;
};

export type MoveErrorArgs = {
	error: "circular-reference";
	target: FileTree.Node;
};

export type InsertItemsArgs = {
	target: FolderNode | FileTree;
	start: number;
	inserted: Array<FileTree.Node>;
};

export type NameConflictArgs = {
	operation: "move" | "insert";
	target: FileTree.Node;
};

export type NameConflictResolution = "skip" | "cancel";

export type DeleteItemsArgs = {
	updates: Array<{
		target: FolderNode | FileTree;
		children: Array<FileTree.Node>;
	}>;
	deleted: Array<FileTree.Node>;
};

export type TreeItemPosition<TNode extends FileTree.Node = FileTree.Node> = {
	node: TNode;
	index: number;
	parent?: TreeItemPosition<FolderNode>;
};

export type DropPosition = "before" | "after" | "inside";

export declare namespace TreeContext {
	type Props = {
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
}

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

	constructor(props: TreeContext.Props) {
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

	readonly #lookup = new Map<string, TreeItemContext>();
	tabbableId?: string = $state.raw();
	draggedId?: string = $state.raw();

	get tree(): FileTree {
		return this.#tree();
	}

	get pasteOperation(): PasteOperation | undefined {
		return this.#pasteOperation();
	}

	get id(): string {
		return this.#id();
	}

	onSetItem(context: TreeItemContext): void {
		this.#lookup.set(context.node.id, context);
	}

	onDestroyItem(id: string): void {
		this.tree.selectedIds.delete(id);
		this.tree.expandedIds.delete(id);
		this.tree.clipboardIds.delete(id);
		this.#lookup.delete(id);

		if (this.tabbableId === id) {
			this.tabbableId = undefined;
		}

		if (this.draggedId === id) {
			this.draggedId = undefined;
		}
	}

	getItem(id: string): TreeItemContext | undefined {
		return this.#lookup.get(id);
	}

	getItemElementId(id: string): string {
		return `${this.id}:${id}`;
	}

	getItemElement(id: string): HTMLElement | null {
		const elementId = this.getItemElementId(id);
		return document.getElementById(elementId);
	}

	getNextNonChildItem(current: TreeItemPosition): TreeItemPosition | undefined {
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

	getNextItem(current: TreeItemPosition): TreeItemPosition | undefined {
		if (
			current.node.type === "folder" &&
			current.node.expanded &&
			current.node.children.length !== 0
		) {
			return {
				node: current.node.children[0],
				index: 0,
				parent: current as TreeItemPosition<FolderNode>,
			};
		}

		return this.getNextNonChildItem(current);
	}

	getPreviousItem(current: TreeItemPosition): TreeItemPosition | undefined {
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

	selectUntil(context: TreeItemContext, element: HTMLElement): void {
		let lastSelected: TreeItemContext | undefined;
		for (const id of this.tree.selectedIds) {
			const item = this.getItem(id);
			if (item !== undefined) {
				lastSelected = item;
			}
		}

		if (lastSelected === undefined) {
			let current: TreeItemPosition | undefined = {
				node: this.tree.children[0],
				index: 0,
			};
			do {
				current.node.select();
				if (current.node === context.node) {
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

		let current: TreeItemPosition | undefined = lastSelected;
		while (current.node !== context.node) {
			current = following ? this.getNextItem(current) : this.getPreviousItem(current);
			if (current === undefined) {
				break;
			}
			current.node.select();
		}
	}

	copySelectedToClipboard(pasteOperation: PasteOperation): void {
		this.tree.clipboardIds.clear();

		for (const id of this.tree.selectedIds) {
			this.tree.clipboardIds.add(id);
		}

		if (this.tree.clipboardIds.size === 0) {
			this.#setPasteOperation(undefined);
		} else {
			this.#setPasteOperation(pasteOperation);
		}
	}

	clearClipboard(): void {
		this.tree.clipboardIds.clear();
		this.#setPasteOperation(undefined);
	}

	async renameItem(context: TreeItemContext, name: string): Promise<boolean> {
		if (name.length === 0) {
			this.#onRenameError({
				error: "empty",
				target: context.node,
				name,
			});
			return false;
		}

		const owner = context.parent?.node ?? this.tree;
		for (const child of owner.children) {
			if (child !== context.node && name === child.name) {
				this.#onRenameError({
					error: "already-exists",
					target: context.node,
					name,
				});
				return false;
			}
		}

		if (name === context.node.name) {
			return true;
		}

		const result = this.#onRenameItem({
			target: context.node,
			name,
		});
		return result instanceof Promise ? await result : result;
	}

	async #moveItems(
		context: TreeItemContext,
		position: DropPosition,
		movedIds: Iterable<string>,
		isMoved: (node: FileTree.Node) => boolean,
	) {
		for (
			let current: TreeItemContext | undefined = context;
			current !== undefined;
			current = current.parent
		) {
			if (isMoved(current.node)) {
				// Don't move an item next to or inside itself.
				this.#onMoveError({
					error: "circular-reference",
					target: current.node,
				});
				return false;
			}
		}

		let owner: FileTree | FolderNode;
		switch (position) {
			case "before":
			case "after": {
				owner = context.parent?.node ?? this.tree;
				break;
			}
			case "inside": {
				if (context.node.type === "file") {
					if (DEV) {
						throw new Error("Cannot move an item inside a file");
					}
					return false;
				}

				owner = context.node;
				break;
			}
		}

		const ownerChildrenNames = new Set<string>();
		for (const child of owner.children) {
			ownerChildrenNames.add(child.name);
		}

		const moved: Array<FileTree.Node> = [];
		const movedOwners = new Set<FolderNode | FileTree>();
		const skippedIds = new Set<string>();
		outer: for (const id of movedIds) {
			const item = this.getItem(id);
			if (item === undefined) {
				continue;
			}

			for (let ancestor = item.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (isMoved(ancestor.node)) {
					// If an ancestor is moved, its children are moved along with it.
					continue outer;
				}
			}

			const itemOwner = item.parent?.node ?? this.tree;
			if (itemOwner !== owner && ownerChildrenNames.has(item.node.name)) {
				const result = this.#onNameConflict({
					operation: "move",
					target: item.node,
				});
				const conflictResolution = result instanceof Promise ? await result : result;
				switch (conflictResolution) {
					case "skip": {
						skippedIds.add(item.node.id);
						continue;
					}
					case "cancel": {
						return false;
					}
				}
			}

			ownerChildrenNames.add(item.node.name);
			moved.push(item.node);
			movedOwners.add(itemOwner);
		}

		if (moved.length === 0) {
			return true;
		}

		const updates: MoveItemsArgs["updates"] = [];
		for (const movedOwner of movedOwners) {
			if (movedOwner !== owner) {
				updates.push({
					target: movedOwner,
					children: movedOwner.children.filter(
						(child) => !isMoved(child) || skippedIds.has(child.id),
					),
				});
			}
		}

		let children: Array<FileTree.Node>;
		switch (position) {
			case "before": {
				children = [];
				for (const child of owner.children) {
					if (isMoved(child)) {
						continue;
					}

					if (child === context.node) {
						children.push(...moved);
					}

					children.push(child);
				}
				break;
			}
			case "after": {
				children = [];
				for (const child of owner.children) {
					if (isMoved(child)) {
						continue;
					}

					children.push(child);

					if (child === context.node) {
						children.push(...moved);
					}
				}
				break;
			}
			case "inside": {
				children = owner.children.filter((child) => !isMoved(child));
				children.push(...moved);
				break;
			}
		}

		updates.push({
			target: owner,
			children,
		});

		const result = this.#onMoveItems({
			updates,
			moved,
		});
		return result instanceof Promise ? await result : result;
	}

	moveSelected(context: TreeItemContext, position: DropPosition): Promise<boolean> {
		return this.#moveItems(context, position, this.tree.selectedIds, (node) => node.selected);
	}

	#copyNode(node: FileTree.Node): FileTree.Node {
		const id = this.#generateCopyId();
		switch (node.type) {
			case "file": {
				return new FileNode({
					tree: node.tree,
					id,
					name: node.name,
				});
			}
			case "folder": {
				return new FolderNode({
					tree: node.tree,
					id,
					name: node.name,
					children: node.children.map(this.#copyNode, this),
				});
			}
		}
	}

	async #copyPaste(context: TreeItemContext, position: DropPosition): Promise<boolean> {
		let owner: FileTree | FolderNode;
		switch (position) {
			case "before":
			case "after": {
				owner = context.parent?.node ?? this.tree;
				break;
			}
			case "inside": {
				if (context.node.type === "file") {
					if (DEV) {
						throw new Error("Cannot move an item inside a file");
					}
					return false;
				}

				owner = context.node;
				break;
			}
		}

		const ownerChildrenNames = new Set<string>();
		for (const child of owner.children) {
			ownerChildrenNames.add(child.name);
		}

		const copies: Array<FileTree.Node> = [];
		outer: for (const id of this.tree.clipboardIds) {
			const item = this.getItem(id);
			if (item === undefined) {
				continue;
			}

			for (let ancestor = item.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (ancestor.node.inClipboard) {
					// If an ancestor is copied, its children are copied along with it.
					continue outer;
				}
			}

			const copy = this.#copyNode(item.node);
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
			return true;
		}

		let start: number;
		switch (position) {
			case "before": {
				start = context.index;
				break;
			}
			case "after": {
				start = context.index + 1;
				break;
			}
			case "inside": {
				start = owner.children.length;
				break;
			}
		}

		const result = this.#onInsertItems({
			target: owner,
			start,
			inserted: copies,
		});
		return result instanceof Promise ? await result : result;
	}

	async paste(context: TreeItemContext, position: DropPosition): Promise<boolean> {
		let didPaste: boolean;
		switch (this.pasteOperation) {
			case "copy": {
				didPaste = await this.#copyPaste(context, position);
				break;
			}
			case "cut": {
				didPaste = await this.#moveItems(
					context,
					position,
					this.tree.clipboardIds,
					(node) => node.inClipboard,
				);
				break;
			}
			case undefined: {
				return false;
			}
		}

		if (didPaste) {
			this.clearClipboard();
		}

		return didPaste;
	}

	async deleteSelected(context: TreeItemContext): Promise<boolean> {
		const deleted: Array<FileTree.Node> = [];
		const deletedOwners = new Set<FolderNode | FileTree>();
		outer: for (const id of this.tree.selectedIds) {
			const item = this.getItem(id);
			if (item === undefined) {
				continue;
			}

			if (item.nearestSelectedAncestor !== undefined) {
				// If an ancestor is deleted, its children are deleted along with it.
				continue outer;
			}

			deleted.push(item.node);
			deletedOwners.add(item.parent?.node ?? this.tree);
		}

		if (deleted.length === 0) {
			return true;
		}

		let focusTarget: TreeItemPosition | undefined = context;
		do {
			// Move to the highest selected ancestor as all its children will be deleted.
			for (
				let ancestor: TreeItemPosition<FolderNode> | undefined = focusTarget.parent;
				ancestor !== undefined;
				ancestor = ancestor.parent
			) {
				if (ancestor.node.selected) {
					focusTarget = ancestor;
				}
			}

			// Focus the nearest remaining item after this item.
			let nearestUnselected: TreeItemPosition | undefined = focusTarget;
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
	node: () => FileTree.Node;
};

export class DropPositionState {
	readonly #node: () => FileTree.Node;

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

export declare namespace TreeItemContext {
	type Props<TNode extends FileTree.Node = FileTree.Node> = {
		treeContext: TreeContext;
		parent: TreeItemContext<FolderNode> | undefined;
		node: () => TNode;
		index: () => number;
		editable: () => boolean;
		disabled: () => boolean;
	};
}

export class TreeItemContext<TNode extends FileTree.Node = FileTree.Node> {
	readonly #treeContext: TreeContext;
	readonly parent?: TreeItemContext<FolderNode>;
	readonly #node: () => TNode;
	readonly #index: () => number;
	readonly #editable: () => boolean;
	readonly #disabled: () => boolean;
	readonly depth: number;
	readonly dropPosition: DropPositionState;

	constructor(props: TreeItemContext.Props<TNode>) {
		this.#treeContext = props.treeContext;
		this.parent = props.parent;
		this.#node = props.node;
		this.#index = props.index;
		this.#editable = props.editable;
		this.#disabled = props.disabled;
		this.depth = props.parent !== undefined ? props.parent.depth + 1 : 0;
		this.dropPosition = new DropPositionState(props);

		$effect(() => {
			props.treeContext.onSetItem(this);
		});

		$effect(() => {
			return () => {
				props.treeContext.onDestroyItem(this.node.id);
			};
		});
	}

	editing: boolean = $state.raw(false);

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
}

export class TreeItemSnippetArgs {
	readonly #context: TreeItemContext;

	constructor(context: TreeItemContext) {
		this.#context = context;
	}

	get node(): FileTree.Node {
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
