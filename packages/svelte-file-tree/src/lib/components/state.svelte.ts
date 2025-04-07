import type { MaybePromise } from "$lib/internal/types.js";
import { FileNode, FolderNode, type FileTree, type FileTreeNode } from "$lib/tree.svelte.js";
import { DEV } from "esm-env";
import type { SvelteSet } from "svelte/reactivity";
import type {
	CircularReferenceErrorArgs,
	CopyPasteItemsArgs,
	DropPosition,
	MoveItemsArgs,
	NameConflictResolution,
	ParentFileTreeNode,
	PasteOperation,
	RemoveItemsArgs,
	ResolveNameConflictArgs,
	TreeItemState,
} from "./types.js";

export type TreeStateProps<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = {
	tree: () => FileTree<TNode>;
	selectedIds: () => SvelteSet<string>;
	expandedIds: () => SvelteSet<string>;
	clipboardIds: () => SvelteSet<string>;
	pasteOperation: () => PasteOperation | undefined;
	setPasteOperation: (value: PasteOperation | undefined) => void;
	isItemDisabled: (node: TNode) => boolean;
	id: () => string;
	copyNode: (node: TNode) => TNode;
	onMoveItems: (args: MoveItemsArgs<TNode>) => MaybePromise<boolean>;
	onCopyPasteItems: (args: CopyPasteItemsArgs<TNode>) => MaybePromise<boolean>;
	onRemoveItems: (args: RemoveItemsArgs<TNode>) => MaybePromise<boolean>;
	onResolveNameConflict: (args: ResolveNameConflictArgs) => MaybePromise<NameConflictResolution>;
	onCircularReferenceError: (args: CircularReferenceErrorArgs<TNode>) => void;
};

export type TreeItemPosition<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = {
	node: TNode;
	index: number;
	parent?: TreeItemPosition<ParentFileTreeNode<TNode>>;
};

class TreeItemStateImpl<TNode extends FileNode | FolderNode<TNode> = FileTreeNode>
	implements TreeItemState<TNode>
{
	readonly depth: number;

	constructor(
		readonly node: TNode,
		readonly index: number,
		readonly parent: TreeItemState<ParentFileTreeNode<TNode>> | undefined,
		readonly selectedIds: () => SvelteSet<string>,
		readonly expandedIds: () => SvelteSet<string>,
		readonly clipboardIds: () => SvelteSet<string>,
		readonly isItemDisabled: (node: TNode) => boolean,
		readonly draggedId: () => string | undefined,
	) {
		if (parent === undefined) {
			this.depth = 0;
		} else {
			this.depth = parent.depth + 1;
		}
	}

	readonly selected: boolean = $derived.by(() => this.selectedIds().has(this.node.id));

	readonly expanded: boolean = $derived.by(() => this.expandedIds().has(this.node.id));

	readonly inClipboard: boolean = $derived.by(() => this.clipboardIds().has(this.node.id));

	readonly disabled: boolean = $derived.by(() => {
		if (this.parent?.disabled === true) {
			return true;
		}

		return this.isItemDisabled(this.node);
	});

	readonly visible: boolean = $derived.by(() => {
		if (this.parent === undefined) {
			return true;
		}

		return this.parent.expanded && this.parent.visible;
	});

	readonly dragged: boolean = $derived.by(() => {
		if (this.draggedId() === undefined) {
			return false;
		}

		if (this.draggedId() === this.node.id) {
			return true;
		}

		return this.selected && this.parent?.dragged !== true;
	});
}

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

function isItemSelected(item: TreeItemState): boolean {
	return item.selected;
}

function isItemInClipboard(item: TreeItemState): boolean {
	return item.inClipboard;
}

export function createTreeState<TNode extends FileNode | FolderNode<TNode>>({
	tree,
	selectedIds,
	expandedIds,
	clipboardIds,
	pasteOperation,
	setPasteOperation,
	isItemDisabled,
	id,
	copyNode,
	onMoveItems,
	onCopyPasteItems,
	onRemoveItems,
	onResolveNameConflict,
	onCircularReferenceError,
}: TreeStateProps<TNode>) {
	let tabbableId: string | undefined = $state.raw();
	let draggedId: string | undefined = $state.raw();

	function isItemTabbable(itemId: string): boolean {
		if (tabbableId === undefined) {
			return tree().children[0].id === itemId;
		}

		return tabbableId === itemId;
	}

	function setTabbableId(value: string | undefined): void {
		tabbableId = value;
	}

	function getDraggedId(): string | undefined {
		return draggedId;
	}

	function setDraggedId(value: string | undefined): void {
		draggedId = value;
	}

	const items: Array<TreeItemState<TNode>> = $derived.by(function createItems(
		result: Array<TreeItemState<TNode>> = [],
		nodes: Array<TNode> = tree().children,
		parent?: TreeItemState<ParentFileTreeNode<TNode>>,
	) {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const item = new TreeItemStateImpl(
				node,
				i,
				parent,
				selectedIds,
				expandedIds,
				clipboardIds,
				isItemDisabled,
				getDraggedId,
			);
			result.push(item);

			if (node.type === "folder") {
				createItems(result, node.children, item as never);
			}
		}

		return result;
	});

	const lookup: Map<string, TreeItemState<TNode>> = $derived.by(() => {
		const result = new Map<string, TreeItemState<TNode>>();
		for (const item of items) {
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
		current: TreeItemPosition<TNode>,
	): TreeItemPosition<TNode> | undefined {
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

	function getNextItem(current: TreeItemPosition<TNode>): TreeItemPosition<TNode> | undefined {
		const { node } = current;
		if (node.type === "folder" && expandedIds().has(node.id) && node.children.length !== 0) {
			return {
				node: node.children[0],
				index: 0,
				parent: current as never,
			};
		}
		return getNextNonChildItem(current);
	}

	function getPreviousItem(current: TreeItemPosition<TNode>): TreeItemPosition<TNode> | undefined {
		if (current.index === 0) {
			return current.parent;
		}

		let parent = current.parent;
		let index = current.index - 1;
		let node = parent?.node.children[index] ?? tree().children[index];
		while (node.type === "folder" && expandedIds().has(node.id) && node.children.length !== 0) {
			parent = {
				node: node as never,
				index,
				parent,
			};
			index = node.children.length - 1;
			node = node.children[index];
		}

		return { node, index, parent };
	}

	function toggleSelection(target: TreeItemState<TNode>): void {
		if (target.selected) {
			selectedIds().delete(target.node.id);
		} else {
			selectedIds().add(target.node.id);
		}
	}

	function _selectAll(nodes: Array<TNode>): void {
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

	function selectUntil(target: TreeItemState<TNode>, element: HTMLElement): void {
		let lastSelected: TreeItemState<TNode> | undefined;
		for (const id of selectedIds()) {
			const current = lookup.get(id);
			if (current !== undefined) {
				lastSelected = current;
			}
		}

		if (lastSelected === undefined) {
			let current: TreeItemPosition<TNode> | undefined = items[0];
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

		let current: TreeItemPosition<TNode> | undefined = lastSelected;
		while (current.node !== target.node) {
			current = navigate(current);
			if (current === undefined) {
				break;
			}
			selectedIds().add(current.node.id);
		}
	}

	function copy(target: TreeItemState<TNode>, operation: PasteOperation): void {
		clipboardIds().clear();

		for (const id of selectedIds()) {
			clipboardIds().add(id);
		}
		clipboardIds().add(target.node.id);

		setPasteOperation(operation);
	}

	function clearClipboard(): void {
		clipboardIds().clear();
		setPasteOperation(undefined);
	}

	async function moveItems(
		movedIds: Set<string>,
		isItemMoved: (item: TreeItemState<TNode>) => boolean,
		target: TreeItemState<TNode>,
		position: DropPosition,
	): Promise<boolean> {
		if (isItemMoved(target)) {
			// Don't move the target next to or inside itself.
			onCircularReferenceError({
				target: target.node,
				position,
			});
			return false;
		}

		const nearestMovedAncestor = getNearestAncestor(target, isItemMoved);
		if (nearestMovedAncestor !== undefined) {
			// Don't move the ancestor inside itself.
			onCircularReferenceError({
				target: nearestMovedAncestor.node,
				position: "inside",
			});
			return false;
		}

		let owner: ParentFileTreeNode<TNode> | FileTree<TNode>;
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

				owner = target.node as never;
				break;
			}
		}

		const ownerChildrenNames = new Set<string>();
		for (const child of owner.children) {
			ownerChildrenNames.add(child.name);
		}

		const moved: Array<TNode> = [];
		const movedOwners = new Set<ParentFileTreeNode<TNode> | FileTree<TNode>>();
		const skippedIds = new Set<string>();
		for (const id of movedIds) {
			const current = lookup.get(id);
			if (current === undefined) {
				continue;
			}

			if (getNearestAncestor(current, isItemMoved) !== undefined) {
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

		const updates: MoveItemsArgs<TNode>["updates"] = [];
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

		let children: Array<TNode>;
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

	async function drop(target: TreeItemState<TNode>, position: DropPosition): Promise<boolean> {
		const currentDraggedId = draggedId;
		if (currentDraggedId === undefined) {
			return false;
		}

		selectedIds().add(currentDraggedId);
		const didMove = await moveItems(selectedIds(), isItemSelected, target, position);

		if (didMove) {
			getItemElement(currentDraggedId)?.focus();
		}

		return didMove;
	}

	async function copyPaste(target: TreeItemState<TNode>, position: DropPosition): Promise<boolean> {
		let owner: ParentFileTreeNode<TNode> | FileTree<TNode>;
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

				owner = target.node as never;
				break;
			}
		}

		const ownerChildrenNames = new Set<string>();
		for (const child of owner.children) {
			ownerChildrenNames.add(child.name);
		}

		const copies: Array<TNode> = [];
		const originals: Array<TNode> = [];
		for (const id of clipboardIds()) {
			const current = lookup.get(id);
			if (current === undefined) {
				continue;
			}

			if (getNearestAncestor(current, isItemInClipboard) !== undefined) {
				// If an ancestor is copied, its children are copied along with it.
				continue;
			}

			const { name } = current.node;
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
			copies.push(copyNode(current.node));
			originals.push(current.node);
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

	async function paste(target: TreeItemState<TNode>, position?: DropPosition): Promise<boolean> {
		if (position === undefined) {
			switch (target.node.type) {
				case "file": {
					position = "after";
					break;
				}
				case "folder": {
					position = target.expanded ? "inside" : "after";
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
				didPaste = await moveItems(clipboardIds(), isItemInClipboard, target, position);
				break;
			}
			case undefined: {
				return false;
			}
		}

		if (didPaste) {
			clearClipboard();

			// After pasting, the order of the items changes, which may cause focus
			// to be lost.
			// https://github.com/sveltejs/svelte/issues/15634
			getItemElement(target.node.id)?.focus();
		}

		return didPaste;
	}

	async function remove(target: TreeItemState<TNode>): Promise<boolean> {
		const removed: Array<TNode> = [];
		const removedOwners = new Set<ParentFileTreeNode<TNode> | FileTree<TNode>>();
		for (const id of selectedIds()) {
			const current = lookup.get(id);
			if (current === undefined) {
				continue;
			}

			if (getNearestAncestor(current, isItemSelected) !== undefined) {
				// If an ancestor is removed, its children are removed along with it.
				continue;
			}

			removed.push(current.node);
			removedOwners.add(current.parent?.node ?? tree());
		}

		if (getNearestAncestor(target, isItemSelected) === undefined) {
			removed.push(target.node);
			removedOwners.add(target.parent?.node ?? tree());
		}

		let focusTarget = getNextNonChildItem(target) ?? getPreviousItem(target);
		while (focusTarget !== undefined) {
			// Move to the highest selected ancestor as all its children will be removed.
			for (
				let ancestor: TreeItemPosition<TNode> | undefined = focusTarget.parent;
				ancestor !== undefined;
				ancestor = ancestor.parent
			) {
				if (selectedIds().has(ancestor.node.id)) {
					focusTarget = ancestor;
				}
			}

			// Focus the nearest remaining item after this item.
			let nearestUnselected: TreeItemPosition<TNode> | undefined = focusTarget;
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

		const updates: RemoveItemsArgs<TNode>["updates"] = [];
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

		if (clipboardIds().size === 0) {
			setPasteOperation(undefined);
		}
	}

	function onItemDestroyed(id: string): void {
		if (tabbableId === id) {
			setTabbableId(undefined);
		}

		if (draggedId === id) {
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
		isItemTabbable,
		setTabbableId,
		draggedId: getDraggedId,
		setDraggedId,
		items: () => items,
		lookup: () => lookup,
		getItemElementId,
		getItemElement,
		getNextItem,
		getPreviousItem,
		toggleSelection,
		selectAll,
		selectUntil,
		copy,
		clearClipboard,
		drop,
		paste,
		remove,
		onItemRemoved,
		onItemDestroyed,
	};
}

export type TreeState<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = ReturnType<
	typeof createTreeState<TNode>
>;

export type TreeItemDragStateProps = {
	draggedId: () => string | undefined;
	item: () => TreeItemState;
};

export function createTreeItemDragState({ draggedId, item }: TreeItemDragStateProps) {
	let dropPosition: DropPosition | undefined = $state.raw();
	let updateRequestId: number | undefined;

	const canDrop: boolean = $derived.by(() => {
		if (draggedId() === undefined) {
			return false;
		}

		if (item().disabled) {
			return false;
		}

		if (item().selected || getNearestAncestor(item(), isItemSelected) !== undefined) {
			// If the dragged item is dropped next to or inside a selected item,
			// it would cause a circular reference.
			return false;
		}

		return true;
	});

	function getLatestDropPosition(rect: DOMRect, clientY: number): DropPosition {
		switch (item().node.type) {
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

	function updateDropPosition(element: HTMLElement, clientY: number): void {
		if (updateRequestId !== undefined) {
			return;
		}

		updateRequestId = window.requestAnimationFrame(() => {
			dropPosition = getLatestDropPosition(element.getBoundingClientRect(), clientY);
			updateRequestId = undefined;
		});
	}

	function clearDropPosition(): void {
		dropPosition = undefined;

		if (updateRequestId !== undefined) {
			window.cancelAnimationFrame(updateRequestId);
			updateRequestId = undefined;
		}
	}

	return {
		dropPosition: () => dropPosition,
		canDrop: () => canDrop,
		getLatestDropPosition,
		updateDropPosition,
		clearDropPosition,
	};
}

export type TreeItemDragState = ReturnType<typeof createTreeItemDragState>;
