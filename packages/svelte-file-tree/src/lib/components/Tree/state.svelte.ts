import type { MaybePromise } from "$lib/internal/types.js";
import { FileNode, FolderNode, type FileTree, type FileTreeNode } from "$lib/tree.svelte.js";
import { DEV } from "esm-env";
import { createDerived, createRawState } from "svelte-signals";
import type { SvelteSet } from "svelte/reactivity";
import type {
	AlreadyExistsErrorArgs,
	CircularReferenceErrorArgs,
	DropPosition,
	InsertItemsArgs,
	MoveItemsArgs,
	NameConflictResolution,
	PasteOperation,
	RemoveItemsArgs,
	RenameItemArgs,
	ResolveNameConflictArgs,
	TreeItemState,
} from "./types.js";

export type TreeStateProps = {
	tree: () => FileTree;
	selectedIds: () => SvelteSet<string>;
	expandedIds: () => SvelteSet<string>;
	clipboardIds: () => SvelteSet<string>;
	pasteOperation: () => PasteOperation | undefined;
	setPasteOperation: (operation: PasteOperation | undefined) => void;
	isItemEditable: (node: FileTreeNode) => boolean;
	isItemDisabled: (node: FileTreeNode) => boolean;
	id: () => string;
	generateCopyId: () => string;
	onRenameItem: (args: RenameItemArgs) => MaybePromise<boolean>;
	onMoveItems: (args: MoveItemsArgs) => MaybePromise<boolean>;
	onInsertItems: (args: InsertItemsArgs) => MaybePromise<boolean>;
	onRemoveItems: (args: RemoveItemsArgs) => MaybePromise<boolean>;
	onResolveNameConflict: (args: ResolveNameConflictArgs) => MaybePromise<NameConflictResolution>;
	onAlreadyExistsError: (args: AlreadyExistsErrorArgs) => void;
	onCircularReferenceError: (args: CircularReferenceErrorArgs) => void;
};

export type TreeItemPosition<TNode extends FileTreeNode = FileTreeNode> = {
	node: TNode;
	index: number;
	parent?: TreeItemPosition<FolderNode>;
};

function hasAncestor(
	item: TreeItemState,
	predicate: (ancestor: TreeItemState<FolderNode>) => boolean,
): boolean {
	for (let ancestor = item.parent; ancestor !== undefined; ancestor = ancestor.parent) {
		if (predicate(ancestor)) {
			return true;
		}
	}

	return false;
}

function isSelected(item: TreeItemState): boolean {
	return item.selected();
}

function isInClipboard(item: TreeItemState): boolean {
	return item.inClipboard();
}

export function createTreeState({
	tree,
	selectedIds,
	expandedIds,
	clipboardIds,
	pasteOperation,
	setPasteOperation,
	isItemEditable,
	isItemDisabled,
	id,
	generateCopyId,
	onRenameItem,
	onMoveItems,
	onInsertItems,
	onRemoveItems,
	onResolveNameConflict,
	onAlreadyExistsError,
	onCircularReferenceError,
}: TreeStateProps) {
	const [tabbableId, setTabbableId] = createRawState<string>();
	const [draggedId, setDraggedId] = createRawState<string>();

	function isItemTabbable(itemId: string): boolean {
		if (tabbableId() === undefined) {
			return tree().children[0].id === itemId;
		}

		return tabbableId() === itemId;
	}

	const items = createDerived(function createItems(
		result: Array<TreeItemState> = [],
		nodes: Array<FileTreeNode> = tree().children,
		parent?: TreeItemState<FolderNode>,
	): Array<TreeItemState> {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const selected = createDerived((): boolean => selectedIds().has(node.id));
			const item: TreeItemState = {
				node,
				index: i,
				parent,
				depth: parent === undefined ? 0 : parent.depth + 1,
				selected,
				expanded: createDerived(() => expandedIds().has(node.id)),
				inClipboard: createDerived(() => clipboardIds().has(node.id)),
				editable: createDerived(() => isItemEditable(node)),
				disabled: createDerived(() => {
					if (parent?.disabled() === true) {
						return true;
					}

					return isItemDisabled(node);
				}),
				visible: createDerived(() => {
					if (parent === undefined) {
						return true;
					}

					return parent.expanded() && parent.visible();
				}),
				dragged: createDerived(() => {
					if (draggedId() === undefined) {
						return false;
					}

					if (draggedId() === node.id) {
						return true;
					}

					return selected() && parent?.dragged() !== true;
				}),
			};
			result.push(item);

			if (node.type === "folder") {
				createItems(result, node.children, item as TreeItemState<FolderNode>);
			}
		}

		return result;
	});

	const lookup = createDerived((): Map<string, TreeItemState> => {
		const result = new Map<string, TreeItemState>();
		for (const item of items()) {
			result.set(item.node.id, item);
		}
		return result;
	});

	function getItemElementId(itemId: string): string {
		return `${id()}:${itemId}`;
	}

	function getItemElement(itemId: string): HTMLElement | null {
		const elementId = getItemElementId(itemId);
		return document.getElementById(elementId);
	}

	function getNextNonChildItem(current: TreeItemPosition): TreeItemPosition | undefined {
		let { index, parent } = current;
		while (true) {
			const siblings = parent?.node.children ?? tree().children;
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

	function getNextItem(current: TreeItemPosition): TreeItemPosition | undefined {
		const { node } = current;
		if (node.type === "folder" && expandedIds().has(node.id) && node.children.length !== 0) {
			return {
				node: node.children[0],
				index: 0,
				parent: current as TreeItemPosition<FolderNode>,
			};
		}
		return getNextNonChildItem(current);
	}

	function getPreviousItem(current: TreeItemPosition): TreeItemPosition | undefined {
		if (current.index === 0) {
			return current.parent;
		}

		let parent = current.parent;
		let index = current.index - 1;
		let node = parent?.node.children[index] ?? tree().children[index];
		while (node.type === "folder" && expandedIds().has(node.id) && node.children.length !== 0) {
			parent = { node, index, parent };
			index = node.children.length - 1;
			node = node.children[index];
		}

		return { node, index, parent };
	}

	function toggleSelection(target: TreeItemState): void {
		if (target.selected()) {
			selectedIds().delete(target.node.id);
		} else {
			selectedIds().add(target.node.id);
		}
	}

	function _selectAll(nodes: Array<FileTreeNode>): void {
		for (const node of nodes) {
			selectedIds().add(node.id);

			if (node.type === "folder" && expandedIds().has(node.id)) {
				_selectAll(node.children);
			}
		}
	}

	function selectAll(): void {
		_selectAll(tree().children);
	}

	function selectUntil(target: TreeItemState, element: HTMLElement): void {
		let lastSelected: TreeItemState | undefined;
		for (const id of selectedIds()) {
			const current = lookup().get(id);
			if (current !== undefined) {
				lastSelected = current;
			}
		}

		if (lastSelected === undefined) {
			let current: TreeItemPosition | undefined = items()[0];
			do {
				selectedIds().add(current.node.id);
				if (current.node === target.node) {
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
		const navigate = following !== 0 ? getNextItem : getPreviousItem;

		let current: TreeItemPosition | undefined = lastSelected;
		while (current.node !== target.node) {
			current = navigate(current);
			if (current === undefined) {
				break;
			}
			selectedIds().add(current.node.id);
		}
	}

	function copySelectedToClipboard(operation: PasteOperation): void {
		if (selectedIds().size === 0) {
			return;
		}

		clipboardIds().clear();

		for (const id of selectedIds()) {
			clipboardIds().add(id);
		}

		setPasteOperation(operation);
	}

	function clearClipboard(): void {
		clipboardIds().clear();
		setPasteOperation(undefined);
	}

	async function rename(target: TreeItemState, name: string): Promise<boolean> {
		if (name.length === 0) {
			return false;
		}

		const owner = target.parent?.node ?? tree();
		for (const child of owner.children) {
			if (child !== target.node && name === child.name) {
				onAlreadyExistsError({ name });
				return false;
			}
		}

		if (name === target.node.name) {
			return true;
		}

		return await onRenameItem({
			target: target.node,
			name,
		});
	}

	async function moveItems(
		movedIds: Set<string>,
		isMoved: (item: TreeItemState) => boolean,
		target: TreeItemState,
		position: DropPosition,
	): Promise<boolean> {
		if (isMoved(target)) {
			// Don't move the target next to or inside itself.
			onCircularReferenceError({
				target: target.node,
				position,
			});
			return false;
		}

		for (let ancestor = target.parent; ancestor !== undefined; ancestor = ancestor.parent) {
			if (isMoved(ancestor)) {
				// Don't move the ancestor inside itself.
				onCircularReferenceError({
					target: ancestor.node,
					position: "inside",
				});
				return false;
			}
		}

		let owner: FolderNode | FileTree;
		switch (position) {
			case "before":
			case "after": {
				owner = target.parent?.node ?? tree();
				break;
			}
			case "inside": {
				if (target.node.type === "file") {
					if (DEV) {
						throw new Error("Cannot move an item inside a file");
					}

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
		for (const id of movedIds) {
			const current = lookup().get(id);
			if (current === undefined) {
				continue;
			}

			if (hasAncestor(current, isMoved)) {
				// If an ancestor is moved, its children are moved along with it.
				continue;
			}

			const currentOwner = current.parent?.node ?? tree();
			const { name } = current.node;
			if (currentOwner !== owner && ownerChildrenNames.has(name)) {
				const resolution = await onResolveNameConflict({
					operation: "move",
					name,
				});
				switch (resolution) {
					case "skip": {
						skippedIds.add(current.node.id);
						continue;
					}
					case "cancel": {
						return false;
					}
				}
			}

			ownerChildrenNames.add(name);
			moved.push(current.node);
			movedOwners.add(currentOwner);
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
						(child) => !movedIds.has(child.id) || skippedIds.has(child.id),
					),
				});
			}
		}

		let children: Array<FileTreeNode>;
		switch (position) {
			case "before": {
				children = [];
				for (const child of owner.children) {
					if (movedIds.has(child.id)) {
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
					if (movedIds.has(child.id)) {
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
				children = owner.children.filter((child) => !movedIds.has(child.id));
				children.push(...moved);
				break;
			}
		}

		updates.push({
			target: owner,
			children,
		});

		return await onMoveItems({
			updates,
			moved,
		});
	}

	function drop(target: TreeItemState, position: DropPosition): Promise<boolean> {
		return moveItems(selectedIds(), isSelected, target, position);
	}

	function copyNode(node: FileTreeNode): FileTreeNode {
		const id = generateCopyId();
		switch (node.type) {
			case "file": {
				return new FileNode({
					id,
					name: node.name,
				});
			}
			case "folder": {
				return new FolderNode({
					id,
					name: node.name,
					children: node.children.map(copyNode),
				});
			}
		}
	}

	async function copyPaste(target: TreeItemState, position: DropPosition): Promise<boolean> {
		let owner: FolderNode | FileTree;
		switch (position) {
			case "before":
			case "after": {
				owner = target.parent?.node ?? tree();
				break;
			}
			case "inside": {
				if (target.node.type === "file") {
					if (DEV) {
						throw new Error("Cannot move an item inside a file");
					}

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
		for (const id of clipboardIds()) {
			const current = lookup().get(id);
			if (current === undefined) {
				continue;
			}

			if (hasAncestor(current, isInClipboard)) {
				// If an ancestor is copied, its children are copied along with it.
				continue;
			}

			const copy = copyNode(current.node);
			const { name } = copy;
			if (ownerChildrenNames.has(name)) {
				const resolution = await onResolveNameConflict({
					operation: "insert",
					name,
				});
				switch (resolution) {
					case "skip": {
						continue;
					}
					case "cancel": {
						return false;
					}
				}
			}

			ownerChildrenNames.add(name);
			copies.push(copy);
		}

		if (copies.length === 0) {
			return true;
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

		return await onInsertItems({
			target: owner,
			start,
			inserted: copies,
		});
	}

	async function paste(target: TreeItemState, position?: DropPosition): Promise<boolean> {
		if (position === undefined) {
			switch (target.node.type) {
				case "file": {
					position = "after";
					break;
				}
				case "folder": {
					position = target.expanded() ? "inside" : "after";
					break;
				}
			}
		}

		let didPaste: boolean;
		switch (pasteOperation()) {
			case "copy": {
				didPaste = await copyPaste(target, position);
				break;
			}
			case "cut": {
				didPaste = await moveItems(clipboardIds(), isInClipboard, target, position);
				break;
			}
			case undefined: {
				return false;
			}
		}

		if (didPaste) {
			clearClipboard();
		}

		return didPaste;
	}

	async function remove(target: TreeItemState): Promise<boolean> {
		const removed: Array<FileTreeNode> = [];
		const removedOwners = new Set<FolderNode | FileTree>();
		for (const id of selectedIds()) {
			const current = lookup().get(id);
			if (current === undefined) {
				continue;
			}

			if (hasAncestor(current, isSelected)) {
				// If an ancestor is removed, its children are removed along with it.
				continue;
			}

			removed.push(current.node);
			removedOwners.add(current.parent?.node ?? tree());
		}

		if (!hasAncestor(target, isSelected)) {
			removed.push(target.node);
			removedOwners.add(target.parent?.node ?? tree());
		}

		let focusTarget = getNextNonChildItem(target) ?? getPreviousItem(target);
		while (focusTarget !== undefined) {
			// Move to the highest selected ancestor as all its children will be removed.
			for (
				let ancestor: TreeItemPosition<FolderNode> | undefined = focusTarget.parent;
				ancestor !== undefined;
				ancestor = ancestor.parent
			) {
				if (selectedIds().has(ancestor.node.id)) {
					focusTarget = ancestor;
				}
			}

			// Focus the nearest remaining item after this item.
			let nearestUnselected: TreeItemPosition | undefined = focusTarget;
			while (nearestUnselected !== undefined && selectedIds().has(nearestUnselected.node.id)) {
				// The current item will be removed, so we shouldn't traverse its children.
				nearestUnselected = getNextNonChildItem(nearestUnselected);
			}

			if (nearestUnselected === undefined) {
				// Focus the nearest remaining item before this item.
				nearestUnselected = focusTarget;
				while (nearestUnselected !== undefined && selectedIds().has(nearestUnselected.node.id)) {
					nearestUnselected = getPreviousItem(nearestUnselected);
				}
			}

			if (focusTarget === nearestUnselected) {
				break;
			}

			// This item might be inside a selected folder, so we need to continue the loop.
			focusTarget = nearestUnselected;
		}

		const updates: RemoveItemsArgs["updates"] = [];
		for (const removedOwner of removedOwners) {
			updates.push({
				target: removedOwner,
				children: removedOwner.children.filter(
					(child) => child !== target.node && !selectedIds().has(child.id),
				),
			});
		}

		const didRemove = await onRemoveItems({
			updates,
			removed,
		});

		if (didRemove && focusTarget !== undefined) {
			getItemElement(focusTarget.node.id)?.focus();
		}

		return didRemove;
	}

	function onItemRemoved(id: string): void {
		selectedIds().delete(id);
		expandedIds().delete(id);
		clipboardIds().delete(id);
	}

	function onItemDestroyed(id: string): void {
		if (tabbableId() === id) {
			setTabbableId(undefined);
		}

		if (draggedId() === id) {
			setDraggedId(undefined);
		}
	}

	return {
		tree,
		selectedIds,
		expandedIds,
		clipboardIds,
		pasteOperation,
		id,
		tabbableId,
		isItemTabbable,
		setTabbableId,
		draggedId,
		setDraggedId,
		items,
		lookup,
		getItemElementId,
		getItemElement,
		getNextItem,
		getPreviousItem,
		toggleSelection,
		selectAll,
		selectUntil,
		copySelectedToClipboard,
		clearClipboard,
		rename,
		drop,
		paste,
		remove,
		onItemRemoved,
		onItemDestroyed,
	};
}

export type TreeState = ReturnType<typeof createTreeState>;
