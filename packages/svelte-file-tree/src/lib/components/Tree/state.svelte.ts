import type { MaybePromise } from "$lib/internal/types.js";
import {
	FileNode,
	FolderNode,
	type FileTree,
	type FileTreeNode,
	type FileTreeNodeData,
} from "$lib/tree.svelte.js";
import { DEV } from "esm-env";
import { createDerived, createRawState } from "svelte-signals";
import type { SvelteSet } from "svelte/reactivity";
import type {
	AlreadyExistsErrorArgs,
	CircularReferenceErrorArgs,
	CopyPasteItemsArgs,
	DropPosition,
	MoveItemsArgs,
	NameConflictResolution,
	PasteOperation,
	RemoveItemsArgs,
	RenameItemArgs,
	ResolveNameConflictArgs,
	TreeItemState,
} from "./types.js";

export type TreeStateProps<TData extends FileTreeNodeData = FileTreeNodeData> = {
	tree: () => FileTree<TData>;
	selectedIds: () => SvelteSet<string>;
	expandedIds: () => SvelteSet<string>;
	clipboardIds: () => SvelteSet<string>;
	pasteOperation: () => PasteOperation | undefined;
	setPasteOperation: (operation: PasteOperation | undefined) => void;
	isItemEditable: (node: FileTreeNode<TData>) => boolean;
	isItemDisabled: (node: FileTreeNode<TData>) => boolean;
	id: () => string;
	generateCopyId: () => string;
	onRenameItem: (args: RenameItemArgs<TData>) => MaybePromise<boolean>;
	onMoveItems: (args: MoveItemsArgs<TData>) => MaybePromise<boolean>;
	onCopyPasteItems: (args: CopyPasteItemsArgs<TData>) => MaybePromise<boolean>;
	onRemoveItems: (args: RemoveItemsArgs<TData>) => MaybePromise<boolean>;
	onResolveNameConflict: (args: ResolveNameConflictArgs) => MaybePromise<NameConflictResolution>;
	onAlreadyExistsError: (args: AlreadyExistsErrorArgs) => void;
	onCircularReferenceError: (args: CircularReferenceErrorArgs<TData>) => void;
};

export type TreeItemPosition<
	TData extends FileTreeNodeData = FileTreeNodeData,
	TNode extends FileTreeNode<TData> = FileTreeNode<TData>,
> = {
	node: TNode;
	index: number;
	parent?: TreeItemPosition<TData, FolderNode<TData>>;
};

function getNearestAncestor<TParent extends { parent?: TParent }>(
	item: { parent?: TParent },
	predicate: (ancestor: TParent) => boolean,
): TParent | undefined {
	for (let ancestor = item.parent; ancestor !== undefined; ancestor = ancestor.parent) {
		if (predicate(ancestor)) {
			return ancestor;
		}
	}
}

function isSelected(item: TreeItemState): boolean {
	return item.selected();
}

function isInClipboard(item: TreeItemState): boolean {
	return item.inClipboard();
}

export function createTreeState<TData extends FileTreeNodeData>({
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
	onCopyPasteItems,
	onRemoveItems,
	onResolveNameConflict,
	onAlreadyExistsError,
	onCircularReferenceError,
}: TreeStateProps<TData>) {
	const [tabbableId, setTabbableId] = createRawState<string>();
	const [draggedId, setDraggedId] = createRawState<string>();

	function isItemTabbable(itemId: string): boolean {
		if (tabbableId() === undefined) {
			return tree().children[0].id === itemId;
		}

		return tabbableId() === itemId;
	}

	const items = createDerived(function createItems(
		result: Array<TreeItemState<TData>> = [],
		nodes: Array<FileTreeNode<TData>> = tree().children,
		parent?: TreeItemState<TData, FolderNode<TData>>,
	): Array<TreeItemState<TData>> {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const selected = createDerived((): boolean => selectedIds().has(node.id));
			const item: TreeItemState<TData> = {
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
				createItems(result, node.children, item as TreeItemState<TData, FolderNode<TData>>);
			}
		}

		return result;
	});

	const lookup = createDerived((): Map<string, TreeItemState<TData>> => {
		const result = new Map<string, TreeItemState<TData>>();
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

	function getNextNonChildItem(
		current: TreeItemPosition<TData>,
	): TreeItemPosition<TData> | undefined {
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

	function getNextItem(current: TreeItemPosition<TData>): TreeItemPosition<TData> | undefined {
		const { node } = current;
		if (node.type === "folder" && expandedIds().has(node.id) && node.children.length !== 0) {
			return {
				node: node.children[0],
				index: 0,
				parent: current as TreeItemPosition<TData, FolderNode<TData>>,
			};
		}
		return getNextNonChildItem(current);
	}

	function getPreviousItem(current: TreeItemPosition<TData>): TreeItemPosition<TData> | undefined {
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

	function toggleSelection(target: TreeItemState<TData>): void {
		if (target.selected()) {
			selectedIds().delete(target.node.id);
		} else {
			selectedIds().add(target.node.id);
		}
	}

	function _selectAll(nodes: Array<FileTreeNode<TData>>): void {
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

	function selectUntil(target: TreeItemState<TData>, element: HTMLElement): void {
		let lastSelected: TreeItemState<TData> | undefined;
		for (const id of selectedIds()) {
			const current = lookup().get(id);
			if (current !== undefined) {
				lastSelected = current;
			}
		}

		if (lastSelected === undefined) {
			let current: TreeItemPosition<TData> | undefined = items()[0];
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

		let current: TreeItemPosition<TData> | undefined = lastSelected;
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

	async function rename(target: TreeItemState<TData>, name: string): Promise<boolean> {
		if (name.length === 0) {
			return false;
		}

		const owner = target.parent?.node ?? tree();
		for (const child of owner.children) {
			if (child !== target.node && name === child.data.name) {
				onAlreadyExistsError({ name });
				return false;
			}
		}

		if (name === target.node.data.name) {
			return true;
		}

		return await onRenameItem({
			target: target.node,
			name,
		});
	}

	async function moveItems(
		movedIds: Set<string>,
		isMoved: (item: TreeItemState<TData>) => boolean,
		target: TreeItemState<TData>,
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

		const nearestMovedAncestor = getNearestAncestor(target, isMoved);
		if (nearestMovedAncestor !== undefined) {
			// Don't move the ancestor inside itself.
			onCircularReferenceError({
				target: nearestMovedAncestor.node,
				position: "inside",
			});
			return false;
		}

		let owner: FolderNode<TData> | FileTree<TData>;
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
			ownerChildrenNames.add(child.data.name);
		}

		const moved: Array<FileTreeNode<TData>> = [];
		const movedOwners = new Set<FolderNode<TData> | FileTree<TData>>();
		const skippedIds = new Set<string>();
		for (const id of movedIds) {
			const current = lookup().get(id);
			if (current === undefined) {
				continue;
			}

			if (getNearestAncestor(current, isMoved) !== undefined) {
				// If an ancestor is moved, its children are moved along with it.
				continue;
			}

			const currentOwner = current.parent?.node ?? tree();
			const { name } = current.node.data;
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

		const updates: MoveItemsArgs<TData>["updates"] = [];
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

		let children: Array<FileTreeNode<TData>>;
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

	function drop(target: TreeItemState<TData>, position: DropPosition): Promise<boolean> {
		return moveItems(selectedIds(), isSelected, target, position);
	}

	function copyNode(node: FileTreeNode<TData>): FileTreeNode<TData> {
		if (DEV && Object.getPrototypeOf(node.data) !== Object.prototype) {
			throw new Error(`Expected the data property to be a POJO`);
		}

		const id = generateCopyId();
		const data = $state.snapshot(node.data) as TData;
		switch (node.type) {
			case "file": {
				return new FileNode({
					id,
					data,
				});
			}
			case "folder": {
				return new FolderNode({
					id,
					data,
					children: node.children.map(copyNode),
				});
			}
		}
	}

	async function copyPaste(target: TreeItemState<TData>, position: DropPosition): Promise<boolean> {
		let owner: FolderNode<TData> | FileTree<TData>;
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
			ownerChildrenNames.add(child.data.name);
		}

		const copies: Array<FileTreeNode<TData>> = [];
		const originals: Array<FileTreeNode<TData>> = [];
		for (const id of clipboardIds()) {
			const current = lookup().get(id);
			if (current === undefined) {
				continue;
			}

			if (getNearestAncestor(current, isInClipboard) !== undefined) {
				// If an ancestor is copied, its children are copied along with it.
				continue;
			}

			const original = current.node;
			const { name } = original.data;
			if (ownerChildrenNames.has(name)) {
				const resolution = await onResolveNameConflict({
					operation: "copy-paste",
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
			copies.push(copyNode(original));
			originals.push(original);
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

		return await onCopyPasteItems({
			target: owner,
			start,
			copies,
			originals,
		});
	}

	async function paste(target: TreeItemState<TData>, position?: DropPosition): Promise<boolean> {
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

	async function remove(target: TreeItemState<TData>): Promise<boolean> {
		const removed: Array<FileTreeNode<TData>> = [];
		const removedOwners = new Set<FolderNode<TData> | FileTree<TData>>();
		for (const id of selectedIds()) {
			const current = lookup().get(id);
			if (current === undefined) {
				continue;
			}

			if (getNearestAncestor(current, isSelected) !== undefined) {
				// If an ancestor is removed, its children are removed along with it.
				continue;
			}

			removed.push(current.node);
			removedOwners.add(current.parent?.node ?? tree());
		}

		if (getNearestAncestor(target, isSelected) === undefined) {
			removed.push(target.node);
			removedOwners.add(target.parent?.node ?? tree());
		}

		let focusTarget = getNextNonChildItem(target) ?? getPreviousItem(target);
		while (focusTarget !== undefined) {
			// Move to the highest selected ancestor as all its children will be removed.
			for (
				let ancestor: TreeItemPosition<TData, FolderNode<TData>> | undefined = focusTarget.parent;
				ancestor !== undefined;
				ancestor = ancestor.parent
			) {
				if (selectedIds().has(ancestor.node.id)) {
					focusTarget = ancestor;
				}
			}

			// Focus the nearest remaining item after this item.
			let nearestUnselected: TreeItemPosition<TData> | undefined = focusTarget;
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

		const updates: RemoveItemsArgs<TData>["updates"] = [];
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

export type TreeState<TData extends FileTreeNodeData = FileTreeNodeData> = ReturnType<
	typeof createTreeState<TData>
>;
