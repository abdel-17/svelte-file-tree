import type { MaybePromise } from "$lib/internal/types.js";
import { FileNode, type FileTree, type FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import { DEV } from "esm-env";
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

export type TreeItemPosition<TNode extends FileTreeNode = FileTreeNode> = {
	node: TNode;
	index: number;
	parent: TreeItemPosition<FolderNode> | undefined;
};

export type DropPosition = "before" | "after" | "inside";

const selectAll = (nodes: Array<FileTreeNode>): void => {
	for (const node of nodes) {
		node.select();

		if (node.type === "folder" && node.expanded) {
			selectAll(node.children);
		}
	}
};

export type TreeStateProps = {
	tree: () => FileTree;
	pasteOperation: () => PasteOperation | undefined;
	setPasteOperation: (value: PasteOperation | undefined) => void;
	treeId: () => string;
	generateCopyId: () => string;
	onRenameItem: (args: RenameItemArgs) => MaybePromise<boolean>;
	onRenameError: (args: RenameErrorArgs) => void;
	onMoveItems: (args: MoveItemsArgs) => MaybePromise<boolean>;
	onMoveError: (args: MoveErrorArgs) => void;
	onInsertItems: (args: InsertItemsArgs) => MaybePromise<boolean>;
	onNameConflict: (args: NameConflictArgs) => MaybePromise<NameConflictResolution>;
	onDeleteItems: (args: DeleteItemsArgs) => MaybePromise<boolean>;
};

export const createTreeState = ({
	tree,
	pasteOperation,
	setPasteOperation,
	treeId,
	generateCopyId,
	onRenameItem,
	onRenameError,
	onMoveItems,
	onMoveError,
	onInsertItems,
	onNameConflict,
	onDeleteItems,
}: TreeStateProps) => {
	const lookup = new Map<string, TreeItemPosition>();
	let tabbableId: string | undefined = $state.raw();
	let draggedId: string | undefined = $state.raw();

	const validateItem = (item: TreeItemPosition): void => {
		const owner = item.parent?.node ?? tree();
		if (owner.children[item.index] !== item.node) {
			throw new Error(`Item "${item.node.id}" not found at index ${item.index}`);
		}

		if (item.parent !== undefined) {
			validateItem(item.parent);
		}
	};

	const validateItemExists = (id: string): void => {
		if (!lookup.has(id)) {
			throw new Error(`Item "${id}" not found`);
		}
	};

	const validateDropPosition = (position: DropPosition, item: TreeItemPosition): void => {
		if (position === "inside" && item.node.type === "file") {
			throw new Error("Expected a folder, but found a file");
		}
	};

	const setTabbableId = (id: string): void => {
		if (DEV) {
			validateItemExists(id);
		}

		tabbableId = id;
	};

	const setDraggedId = (id: string | undefined): void => {
		if (DEV && id !== undefined) {
			validateItemExists(id);
		}

		draggedId = id;
	};

	const onSetItem = (item: TreeItemPosition): void => {
		if (DEV) {
			validateItem(item);
		}

		lookup.set(item.node.id, item);
	};

	const onDestroyItem = (id: string): void => {
		if (DEV) {
			validateItemExists(id);
		}

		tree().selected.delete(id);
		tree().expanded.delete(id);

		lookup.delete(id);

		if (tabbableId === id) {
			tabbableId = undefined;
		}

		if (draggedId === id) {
			draggedId = undefined;
		}
	};

	const getNextNonChildItem = (item: TreeItemPosition): TreeItemPosition | undefined => {
		if (DEV) {
			validateItem(item);
		}

		let { index, parent } = item;
		while (true) {
			const owner = parent?.node ?? tree();
			const nextIndex = index + 1;
			if (nextIndex !== owner.children.length) {
				return {
					node: owner.children[nextIndex],
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
	};

	const getNextItem = (item: TreeItemPosition): TreeItemPosition | undefined => {
		if (DEV) {
			validateItem(item);
		}

		if (item.node.type === "folder" && item.node.expanded && item.node.children.length !== 0) {
			return {
				node: item.node.children[0],
				index: 0,
				parent: item as TreeItemPosition<FolderNode>,
			};
		}

		return getNextNonChildItem(item);
	};

	const getPreviousItem = (item: TreeItemPosition): TreeItemPosition | undefined => {
		if (DEV) {
			validateItem(item);
		}

		if (item.index === 0) {
			return item.parent;
		}

		let parent = item.parent;
		let index = item.index - 1;
		let node = parent?.node.children[index] ?? tree().children[index];

		while (node.type === "folder" && node.expanded && node.children.length !== 0) {
			parent = { node, index, parent };
			index = node.children.length - 1;
			node = node.children[index];
		}

		return { node, index, parent };
	};

	const getItemElementId = (id: string): string => {
		return `${treeId()}:${id}`;
	};

	const getItemElement = (id: string): HTMLElement | null => {
		return document.getElementById(getItemElementId(id));
	};

	const selectUntil = (node: FileTreeNode, element: HTMLElement): void => {
		let lastSelected: TreeItemPosition | undefined;
		for (const id of tree().selected) {
			const selectedItem = lookup.get(id);
			if (selectedItem !== undefined) {
				lastSelected = selectedItem;
			}
		}

		if (lastSelected === undefined) {
			let current: TreeItemPosition | undefined = {
				node: tree().children[0],
				index: 0,
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

		const lastSelectedElement = getItemElement(lastSelected.node.id);
		if (lastSelectedElement === null) {
			return;
		}

		const positionBitmask = lastSelectedElement.compareDocumentPosition(element);
		const following = positionBitmask & Node.DOCUMENT_POSITION_FOLLOWING;
		const navigate = following ? getNextItem : getPreviousItem;

		let current: TreeItemPosition | undefined = lastSelected;
		while (current.node !== node) {
			current = navigate(current);
			if (current === undefined) {
				break;
			}
			current.node.select();
		}
	};

	const renameItem = async (name: string, item: TreeItemPosition): Promise<boolean> => {
		if (DEV) {
			validateItem(item);
		}

		if (name.length === 0) {
			onRenameError({
				error: "empty",
				target: item.node,
				name,
			});
			return false;
		}

		const owner = item.parent?.node ?? tree();
		for (const child of owner.children) {
			if (child !== item.node && name === child.name) {
				onRenameError({
					error: "already-exists",
					target: item.node,
					name,
				});
				return false;
			}
		}

		if (name === item.node.name) {
			return false;
		}

		return onRenameItem({
			target: item.node,
			name,
		});
	};

	const moveSelected = async (position: DropPosition, item: TreeItemPosition): Promise<boolean> => {
		if (DEV) {
			validateItem(item);
			validateDropPosition(position, item);
		}

		if (item.node.selected) {
			// Don't move an item next to or inside itself.
			onMoveError({
				error: "circular-reference",
				target: item.node,
			});
			return false;
		}

		for (let ancestor = item.parent; ancestor !== undefined; ancestor = ancestor.parent) {
			if (ancestor.node.selected) {
				// Don't move an item inside itself.
				onMoveError({
					error: "circular-reference",
					target: ancestor.node,
				});
				return false;
			}
		}

		let owner: FolderNode | FileTree;
		switch (position) {
			case "before":
			case "after": {
				owner = item.parent?.node ?? tree();
				break;
			}
			case "inside": {
				owner = item.node as FolderNode;
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
		outer: for (const id of tree().selected) {
			const selectedItem = lookup.get(id);
			if (selectedItem === undefined) {
				continue;
			}

			for (let ancestor = selectedItem.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (ancestor.node.selected) {
					// If an item is moved, its children are also moved along with it.
					continue outer;
				}
			}

			const selectedItemOwner = selectedItem.parent?.node ?? tree();
			if (selectedItemOwner !== owner && ownerChildrenNames.has(selectedItem.node.name)) {
				const result = onNameConflict({
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

					if (child === item.node) {
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

					if (child === item.node) {
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

		return onMoveItems({
			updates,
			moved,
		});
	};

	const copyNode = (node: FileTreeNode): FileTreeNode => {
		const id = generateCopyId();
		switch (node.type) {
			case "file": {
				return new FileNode({
					tree: tree(),
					id,
					name: node.name,
				});
			}
			case "folder": {
				return new FolderNode({
					tree: tree(),
					id,
					name: node.name,
					children: node.children.map(copyNode),
				});
			}
		}
	};

	const copyPasteSelected = async (
		position: DropPosition,
		item: TreeItemPosition,
	): Promise<boolean> => {
		if (DEV) {
			validateItem(item);
			validateDropPosition(position, item);
		}

		let owner: FolderNode | FileTree;
		switch (position) {
			case "before":
			case "after":
				owner = item.parent?.node ?? tree();
				break;
			case "inside": {
				owner = item.node as FolderNode;
				break;
			}
		}

		const ownerChildrenNames = new Set<string>();
		for (const child of owner.children) {
			ownerChildrenNames.add(child.name);
		}

		const copies: FileTreeNode[] = [];
		outer: for (const id of tree().selected) {
			const selectedItem = lookup.get(id);
			if (selectedItem === undefined) {
				continue;
			}

			for (let ancestor = selectedItem.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (ancestor.node.selected) {
					// If an item is copied, its children are also copied along with it.
					continue outer;
				}
			}

			const copy = copyNode(selectedItem.node);
			if (ownerChildrenNames.has(copy.name)) {
				const result = onNameConflict({
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

		let index: number;
		switch (position) {
			case "before": {
				index = item.index;
				break;
			}
			case "after": {
				index = item.index + 1;
				break;
			}
			case "inside": {
				index = owner.children.length;
				break;
			}
		}

		return onInsertItems({
			target: owner,
			inserted: copies,
			index,
		});
	};

	const pasteSelected = async (item: TreeItemPosition): Promise<boolean> => {
		if (DEV) {
			validateItem(item);
		}

		let position: DropPosition;
		switch (item.node.type) {
			case "file": {
				position = "after";
				break;
			}
			case "folder": {
				position = item.node.expanded ? "inside" : "after";
				break;
			}
		}

		let didPaste: boolean;
		switch (pasteOperation()) {
			case "copy": {
				didPaste = await copyPasteSelected(position, item);
				break;
			}
			case "cut": {
				didPaste = await moveSelected(position, item);
				break;
			}
			case undefined: {
				return false;
			}
		}

		if (didPaste) {
			setPasteOperation(undefined);
		}

		return didPaste;
	};

	const deleteSelected = async (item: TreeItemPosition): Promise<boolean> => {
		if (DEV) {
			validateItem(item);
		}

		const deleted: Array<FileTreeNode> = [];
		const deletedOwners = new Set<FolderNode | FileTree>();
		outer: for (const id of tree().selected) {
			const selectedItem = lookup.get(id);
			if (selectedItem === undefined) {
				continue;
			}

			for (let ancestor = selectedItem.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (ancestor.node.selected) {
					// If an item is deleted, it children are also deleted along with it.
					continue outer;
				}
			}

			deleted.push(selectedItem.node);
			deletedOwners.add(selectedItem.parent?.node ?? tree());
		}

		if (deleted.length === 0) {
			return false;
		}

		let focusTarget: TreeItemPosition | undefined = item;
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
				nearestUnselected = getNextNonChildItem(nearestUnselected);
			}

			if (nearestUnselected === undefined) {
				// Focus the nearest remaining item before this item.
				nearestUnselected = focusTarget;
				while (nearestUnselected?.node.selected) {
					nearestUnselected = getPreviousItem(nearestUnselected);
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

		const result = onDeleteItems({
			updates,
			deleted,
		});
		const didDelete = result instanceof Promise ? await result : result;

		if (didDelete && focusTarget !== undefined) {
			getItemElement(focusTarget.node.id)?.focus();
		}

		return didDelete;
	};

	return {
		tree,
		pasteOperation,
		setPasteOperation,
		treeId,
		tabbableId: () => tabbableId,
		setTabbableId,
		draggedId: () => draggedId,
		setDraggedId,
		onSetItem,
		onDestroyItem,
		getNextItem,
		getPreviousItem,
		getItemElementId,
		getItemElement,
		selectUntil,
		selectAll: (): void => {
			selectAll(tree().children);
		},
		renameItem,
		moveSelected,
		pasteSelected,
		deleteSelected,
	};
};

export type TreeState = ReturnType<typeof createTreeState>;
