import type { MaybePromise } from "$lib/internal/types.js";
import { FileNode, type FileTree, type FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import { DEV } from "esm-env";
import { flushSync } from "svelte";
import type {
	CopyPasteItemsEvent,
	DeleteItemsEvent,
	NameConflictEvent,
	NameConflictResolution,
	PasteOperation,
	RenameErrorEvent,
	RenameItemEvent,
	Reorder,
	ReorderErrorEvent,
	ReorderItemsEvent,
} from "./types.js";

export type TreeItemPosition<TNode extends FileTreeNode = FileTreeNode> = {
	node: TNode;
	index: number;
	parent: TreeItemPosition<FolderNode> | undefined;
};

export type DropPosition = "before" | "inside" | "after";

const selectAll = (nodes: ReadonlyArray<FileTreeNode>): void => {
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
	onRenameItem: (event: RenameItemEvent) => void;
	onRenameError: (event: RenameErrorEvent) => void;
	onReorderItems: (event: ReorderItemsEvent) => void;
	onReorderError: (event: ReorderErrorEvent) => void;
	onCopyPasteItems: (event: CopyPasteItemsEvent) => void;
	onNameConflict: (event: NameConflictEvent) => MaybePromise<NameConflictResolution>;
	onDeleteItems: (event: DeleteItemsEvent) => void;
};

export const createTreeState = (props: TreeStateProps) => {
	const {
		tree,
		pasteOperation,
		setPasteOperation,
		treeId,
		generateCopyId,
		onRenameItem,
		onRenameError,
		onReorderItems,
		onReorderError,
		onCopyPasteItems,
		onNameConflict,
		onDeleteItems,
	} = props;

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

	const renameItem = (name: string, item: TreeItemPosition): boolean => {
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

		item.node.name = name;
		onRenameItem({
			target: item.node,
			name,
		});
		return true;
	};

	const reorderSelected = async (
		position: DropPosition,
		item: TreeItemPosition,
	): Promise<boolean> => {
		if (DEV) {
			validateItem(item);
			validateDropPosition(position, item);
		}

		if (item.node.selected) {
			// Don't move an item next to or inside itself.
			onReorderError({
				error: "circular-reference",
				target: item.node,
			});
			return false;
		}

		for (let ancestor = item.parent; ancestor !== undefined; ancestor = ancestor.parent) {
			if (ancestor.node.selected) {
				// Don't move an item inside itself.
				onReorderError({
					error: "circular-reference",
					target: ancestor.node,
				});
				return false;
			}
		}

		let parentNode: FolderNode | undefined;
		switch (position) {
			case "before":
			case "after":
				parentNode = item.parent?.node;
				break;
			case "inside": {
				parentNode = item.node as FolderNode;
				break;
			}
		}

		const owner = parentNode ?? tree();
		const ownerChildrenNames = new Set<string>();
		for (const child of owner.children) {
			ownerChildrenNames.add(child.name);
		}

		const moved: Array<TreeItemPosition> = [];
		const movedParents = new Set<TreeItemPosition<FolderNode> | undefined>();
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

			if (
				selectedItem.parent?.node !== parentNode &&
				ownerChildrenNames.has(selectedItem.node.name)
			) {
				const result = onNameConflict({
					target: selectedItem.node,
					operation: "reorder",
				});
				const conflictResolution = result instanceof Promise ? await result : result;
				switch (conflictResolution) {
					case "skip": {
						skippedIds.add(selectedItem.node.id);
						continue;
					}
					case "cancel":
					case "default": {
						return false;
					}
				}
			}

			ownerChildrenNames.add(selectedItem.node.name);
			moved.push(selectedItem);
			movedParents.add(selectedItem.parent);
		}

		if (moved.length === 0) {
			return false;
		}

		const reorders: Array<Reorder> = [];
		for (const movedParent of movedParents) {
			const movedParentNode = movedParent?.node;
			if (movedParentNode === parentNode) {
				// This case is handled separately below.
				continue;
			}

			const movedOwner = movedParentNode ?? tree();
			const remainingChildren: Array<FileTreeNode> = [];
			for (let i = 0, children = movedOwner.children; i < children.length; i++) {
				const child = children[i];
				if (child.selected && !skippedIds.has(child.id)) {
					continue;
				}

				const newIndex = remainingChildren.push(child) - 1;
				if (i !== newIndex) {
					reorders.push({
						target: child,
						parentNode: movedParentNode,
						index: newIndex,
					});
				}
			}

			movedOwner.children = remainingChildren;
		}

		switch (position) {
			case "before":
			case "after": {
				const newChildren: Array<FileTreeNode> = [];
				for (let i = 0, children = owner.children; i < children.length; i++) {
					const child = children[i];
					if (child.selected && !skippedIds.has(child.id)) {
						continue;
					}

					if (child === item.node && position === "before") {
						for (const movedItem of moved) {
							const newIndex = newChildren.push(movedItem.node) - 1;
							if (movedItem.parent?.node !== parentNode || movedItem.index !== newIndex) {
								reorders.push({
									target: movedItem.node,
									parentNode,
									index: newIndex,
								});
							}
						}
					}

					const newIndex = newChildren.push(child) - 1;
					if (i !== newIndex) {
						reorders.push({
							target: child,
							parentNode: parentNode,
							index: newIndex,
						});
					}

					if (child === item.node && position === "after") {
						for (const movedItem of moved) {
							const newIndex = newChildren.push(movedItem.node) - 1;
							if (movedItem.parent?.node !== parentNode || movedItem.index !== newIndex) {
								reorders.push({
									target: movedItem.node,
									parentNode,
									index: newIndex,
								});
							}
						}
					}
				}

				owner.children = newChildren;
				break;
			}
			case "inside": {
				const newChildren: Array<FileTreeNode> = [];
				for (let i = 0, children = parentNode!.children; i < children.length; i++) {
					const child = children[i];
					if (child.selected && !skippedIds.has(child.id)) {
						continue;
					}

					const newIndex = newChildren.push(child) - 1;
					if (i !== newIndex) {
						reorders.push({
							target: child,
							parentNode,
							index: newIndex,
						});
					}
				}

				for (const movedItem of moved) {
					const newIndex = newChildren.push(movedItem.node) - 1;
					if (movedItem.parent?.node !== parentNode || movedItem.index !== newIndex) {
						reorders.push({
							target: movedItem.node,
							parentNode,
							index: newIndex,
						});
					}
				}

				parentNode!.children = newChildren;
				parentNode!.expand();
				break;
			}
		}

		// If an item is moved inside a different parent, it will be
		// destroyed and recreated, causing it to get deselected, so
		// we need to reselect the moved items after reordering.
		flushSync();
		tree().selected.clear();
		for (const movedItem of moved) {
			movedItem.node.select();
		}

		onReorderItems({ reorders });
		return true;
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

		let parentNode: FolderNode | undefined;
		switch (position) {
			case "before":
			case "after":
				parentNode = item.parent?.node;
				break;
			case "inside": {
				parentNode = item.node as FolderNode;
				break;
			}
		}

		const owner = parentNode ?? tree();
		const ownerChildrenNames = new Set<string>();
		for (const child of owner.children) {
			ownerChildrenNames.add(child.name);
		}

		const copies: FileTreeNode[] = [];
		for (const id of tree().selected) {
			const selectedItem = lookup.get(id);
			if (selectedItem === undefined) {
				continue;
			}

			const copy = copyNode(selectedItem.node);
			if (ownerChildrenNames.has(copy.name)) {
				const result = onNameConflict({
					target: copy,
					operation: "copy-paste",
				});
				const conflictResolution = result instanceof Promise ? await result : result;
				switch (conflictResolution) {
					case "skip": {
						continue;
					}
					case "cancel": {
						return false;
					}
					case "default": {
						let i = 1;
						let name: string;
						do {
							name = `${copy.name} (${i})`;
							i++;
						} while (ownerChildrenNames.has(name));

						copy.name = name;
						break;
					}
				}
			}

			ownerChildrenNames.add(copy.name);
			copies.push(copy);
		}

		if (copies.length === 0) {
			return false;
		}

		const reorders: Array<Reorder> = [];
		let start: number;
		switch (position) {
			case "before":
			case "after": {
				start = position === "before" ? item.index : item.index + 1;
				owner.children.splice(start, 0, ...copies);

				for (let i = start + copies.length, children = owner.children; i < children.length; i++) {
					reorders.push({
						target: children[i],
						parentNode,
						index: i,
					});
				}
				break;
			}
			case "inside": {
				start = parentNode!.children.length;
				parentNode!.children.push(...copies);
				parentNode!.expand();
				break;
			}
		}

		onCopyPasteItems({ copies, parentNode, start, reorders });
		return true;
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
				didPaste = await reorderSelected(position, item);
				break;
			}
			default: {
				return false;
			}
		}

		if (!didPaste) {
			return false;
		}

		setPasteOperation(undefined);
		return true;
	};

	const deleteSelected = (item: TreeItemPosition): void => {
		if (DEV) {
			validateItem(item);
		}

		const deleted: Array<FileTreeNode> = [];
		const deletedParents = new Set<TreeItemPosition<FolderNode> | undefined>();
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
			deletedParents.add(selectedItem.parent);
		}

		if (deleted.length === 0) {
			return;
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

		const reorders: Array<Reorder> = [];
		for (const deletedParent of deletedParents) {
			const deletedParentNode = deletedParent?.node;
			const deletedOwner = deletedParentNode ?? tree();
			const remainingChildren: Array<FileTreeNode> = [];
			for (let i = 0, children = deletedOwner.children; i < children.length; i++) {
				const child = children[i];
				if (child.selected) {
					continue;
				}

				const newIndex = remainingChildren.push(child) - 1;
				if (i !== newIndex) {
					reorders.push({
						target: child,
						parentNode: deletedParentNode,
						index: newIndex,
					});
				}
			}

			deletedOwner.children = remainingChildren;
		}

		if (focusTarget !== undefined) {
			getItemElement(focusTarget.node.id)?.focus();
		}

		onDeleteItems({ deleted, reorders });
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
		selectAll: () => selectAll(tree().children),
		renameItem,
		reorderSelected,
		pasteSelected,
		deleteSelected,
	};
};

export type TreeState = ReturnType<typeof createTreeState>;
