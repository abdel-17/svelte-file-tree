import type { MaybePromise } from "$lib/internal/types.js";
import type { FileNode, FolderNode, DefaultTFolder, FileTree } from "$lib/tree.svelte.js";
import { DEV } from "esm-env";
import type { SvelteSet } from "svelte/reactivity";
import type {
	CircularReferenceErrorArgs,
	CopyPasteItemsArgs,
	DropPosition,
	MoveItemsArgs,
	NameConflictResolution,
	PasteOperation,
	RemoveItemsArgs,
	ResolveNameConflictArgs,
	TreeItemState,
} from "./types.js";

export type TreeItemPosition<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
	TNode extends TFile | TFolder = TFile | TFolder,
> = {
	node: TNode;
	index: number;
	parent?: TreeItemPosition<TFile, TFolder, TFolder>;
};

class TreeItemStateImpl<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
	TNode extends TFile | TFolder = TFile | TFolder,
> implements TreeItemState<TFile, TFolder, TNode>
{
	constructor(
		readonly node: TNode,
		readonly index: number,
		readonly parent: TreeItemState<TFile, TFolder, TFolder> | undefined,
		readonly depth: number,
		readonly selectedIds: () => SvelteSet<string>,
		readonly expandedIds: () => SvelteSet<string>,
		readonly clipboardIds: () => SvelteSet<string>,
		readonly isItemDisabled: (node: TFile | TFolder) => boolean,
		readonly draggedId: () => string | undefined,
	) {}

	readonly selected = $derived.by(() => this.selectedIds().has(this.node.id));

	readonly expanded = $derived.by(() => this.expandedIds().has(this.node.id));

	readonly inClipboard = $derived.by(() => this.clipboardIds().has(this.node.id));

	readonly disabled = $derived.by(() => {
		if (this.parent?.disabled) {
			return true;
		}

		return this.isItemDisabled(this.node);
	});

	readonly visible = $derived.by(() => {
		if (this.parent === undefined) {
			return true;
		}

		return this.parent.expanded && this.parent.visible;
	});

	readonly dragged = $derived.by(() => {
		if (this.parent?.dragged) {
			return true;
		}

		if (this.draggedId() === undefined) {
			return false;
		}

		return this.draggedId() === this.node.id || this.selected;
	});
}

function getNearestAncestor<TParent extends { parent?: TParent }>(
	item: { parent?: TParent },
	predicate: (ancestor: TParent) => boolean,
) {
	for (let ancestor = item.parent; ancestor !== undefined; ancestor = ancestor.parent) {
		if (predicate(ancestor)) {
			return ancestor;
		}
	}
}

function isItemSelected(item: TreeItemState) {
	return item.selected;
}

function isItemInClipboard(item: TreeItemState) {
	return item.inClipboard;
}

export type TreeStateProps<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile, TFolder> = FileTree<TFile, TFolder>,
> = {
	tree: () => TTree;
	selectedIds: () => SvelteSet<string>;
	expandedIds: () => SvelteSet<string>;
	clipboardIds: () => SvelteSet<string>;
	pasteOperation: () => PasteOperation | undefined;
	setPasteOperation: (value: PasteOperation | undefined) => void;
	isItemDisabled: (node: TFile | TFolder) => boolean;
	id: () => string;
	copyNode: (node: TFile | TFolder) => TFile | TFolder;
	onMoveItems: (args: MoveItemsArgs<TFile, TFolder, TTree>) => MaybePromise<boolean>;
	onCopyPasteItems: (args: CopyPasteItemsArgs<TFile, TFolder, TTree>) => MaybePromise<boolean>;
	onRemoveItems: (args: RemoveItemsArgs<TFile, TFolder, TTree>) => MaybePromise<boolean>;
	onResolveNameConflict: (args: ResolveNameConflictArgs) => MaybePromise<NameConflictResolution>;
	onCircularReferenceError: (args: CircularReferenceErrorArgs<TFile, TFolder>) => void;
};

export function createTreeState<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile, TFolder> = FileTree<TFile, TFolder>,
>({
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
}: TreeStateProps<TFile, TFolder, TTree>) {
	let tabbableId: string | undefined = $state.raw();
	let draggedId: string | undefined = $state.raw();

	function isItemTabbable(itemId: string) {
		if (tabbableId === undefined) {
			return tree().children[0].id === itemId;
		}

		return tabbableId === itemId;
	}

	function setTabbableId(value: string | undefined) {
		tabbableId = value;
	}

	function getDraggedId() {
		return draggedId;
	}

	function setDraggedId(value: string | undefined) {
		draggedId = value;
	}

	const items = $derived.by(function createItems(
		nodes = tree().children,
		parent?: TreeItemState<TFile, TFolder, TFolder>,
		depth = 0,
		result: Array<TreeItemState<TFile, TFolder>> = [],
	) {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const item = new TreeItemStateImpl(
				node,
				i,
				parent,
				depth,
				selectedIds,
				expandedIds,
				clipboardIds,
				isItemDisabled,
				getDraggedId,
			);
			result.push(item);

			if (node.type === "folder") {
				createItems(
					node.children,
					item as TreeItemState<TFile, TFolder, TFolder>,
					depth + 1,
					result,
				);
			}
		}

		return result;
	});

	const lookup = $derived.by(() => {
		const result = new Map<string, TreeItemState<TFile, TFolder>>();
		for (const item of items) {
			result.set(item.node.id, item);
		}
		return result;
	});

	function getItem(itemId: string) {
		return lookup.get(itemId);
	}

	function getItemElementId(itemId: string) {
		return `${id()}:${itemId}`;
	}

	function getItemElement(itemId: string) {
		const elementId = getItemElementId(itemId);
		return document.getElementById(elementId);
	}

	function getNextNonChildItem(
		current: TreeItemPosition<TFile, TFolder>,
	): TreeItemPosition<TFile, TFolder> | undefined {
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

	function getNextItem(
		current: TreeItemPosition<TFile, TFolder>,
	): TreeItemPosition<TFile, TFolder> | undefined {
		const { node } = current;
		if (node.type === "folder" && expandedIds().has(node.id) && node.children.length !== 0) {
			return {
				node: node.children[0],
				index: 0,
				parent: current as TreeItemPosition<TFile, TFolder, TFolder>,
			};
		}
		return getNextNonChildItem(current);
	}

	function getPreviousItem(
		current: TreeItemPosition<TFile, TFolder>,
	): TreeItemPosition<TFile, TFolder> | undefined {
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

	function toggleSelection(target: TreeItemState<TFile, TFolder>) {
		if (target.selected) {
			selectedIds().delete(target.node.id);
		} else {
			selectedIds().add(target.node.id);
		}
	}

	function _selectAll(nodes: Array<TFile | TFolder>) {
		for (const node of nodes) {
			selectedIds().add(node.id);

			if (node.type === "folder" && expandedIds().has(node.id)) {
				_selectAll(node.children);
			}
		}
	}

	function selectAll() {
		_selectAll(tree().children);
	}

	function selectUntil(target: TreeItemState<TFile, TFolder>, element: HTMLElement) {
		let lastSelected: TreeItemPosition<TFile, TFolder> | undefined;
		for (const id of selectedIds()) {
			const current = getItem(id);
			if (current !== undefined) {
				lastSelected = current;
			}
		}

		if (lastSelected === undefined) {
			let current: TreeItemPosition<TFile, TFolder> | undefined = items[0];
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

		let current: TreeItemPosition<TFile, TFolder> | undefined = lastSelected;
		while (current.node !== target.node) {
			current = navigate(current);
			if (current === undefined) {
				break;
			}
			selectedIds().add(current.node.id);
		}
	}

	function copy(target: TreeItemState<TFile, TFolder>, operation: PasteOperation) {
		clipboardIds().clear();

		for (const id of selectedIds()) {
			clipboardIds().add(id);
		}
		clipboardIds().add(target.node.id);

		setPasteOperation(operation);
	}

	function clearClipboard() {
		clipboardIds().clear();
		setPasteOperation(undefined);
	}

	async function moveItems(
		movedIds: Set<string>,
		isItemMoved: (item: TreeItemState<TFile, TFolder>) => boolean,
		target: TreeItemState<TFile, TFolder>,
		position: DropPosition,
	) {
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

		let owner: TFolder | TTree;
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

		const moved: Array<TFile | TFolder> = [];
		const movedOwners = new Set<TFolder | TTree>();
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

		const updates: MoveItemsArgs<TFile, TFolder, TTree>["updates"] = [];
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

		let children: Array<TFile | TFolder>;
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

	async function drop(target: TreeItemState<TFile, TFolder>, position: DropPosition) {
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

	async function copyPaste(target: TreeItemState<TFile, TFolder>, position: DropPosition) {
		let owner: TFolder | TTree;
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

		const copies: Array<TFile | TFolder> = [];
		const originals: Array<TFile | TFolder> = [];
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

	async function paste(target: TreeItemState<TFile, TFolder>, position?: DropPosition) {
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

	async function remove(target: TreeItemState<TFile, TFolder>) {
		const removed: Array<TFile | TFolder> = [];
		const removedOwners = new Set<TFolder | TTree>();
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
			for (let ancestor = focusTarget.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (selectedIds().has(ancestor.node.id)) {
					focusTarget = ancestor;
				}
			}

			// Focus the nearest remaining item after this item.
			let nearestUnselected: TreeItemPosition<TFile, TFolder> | undefined = focusTarget;
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

		const updates: RemoveItemsArgs<TFile, TFolder, TTree>["updates"] = [];
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

	function onItemRemoved(id: string) {
		selectedIds().delete(id);
		expandedIds().delete(id);
		clipboardIds().delete(id);

		if (clipboardIds().size === 0) {
			setPasteOperation(undefined);
		}
	}

	function onItemDestroyed(id: string) {
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

export type TreeState<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
	TTree extends FileTree<TFile, TFolder> = FileTree<TFile, TFolder>,
> = ReturnType<typeof createTreeState<TFile, TFolder, TTree>>;

export type TreeItemDragStateProps = {
	draggedId: () => string | undefined;
	item: () => TreeItemState;
};

export function createTreeItemDragState({ draggedId, item }: TreeItemDragStateProps) {
	let dropPosition: DropPosition | undefined = $state.raw();
	let updateRequestId: number | undefined;

	const canDrop = $derived.by(() => {
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

	function updateDropPosition(element: HTMLElement, clientY: number) {
		if (updateRequestId !== undefined) {
			return;
		}

		updateRequestId = window.requestAnimationFrame(() => {
			dropPosition = getLatestDropPosition(element.getBoundingClientRect(), clientY);
			updateRequestId = undefined;
		});
	}

	function clearDropPosition() {
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
