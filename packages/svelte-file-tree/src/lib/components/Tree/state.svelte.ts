import type { MaybePromise } from "$lib/internal/types.js";
import { FileNode, FolderNode, type FileTree, type FileTreeNode } from "$lib/tree.svelte.js";
import { DEV } from "esm-env";
import { createDerived, createRawState } from "svelte-signals";
import type { SvelteSet } from "svelte/reactivity";
import type {
	DeleteItemsArgs,
	DropPosition,
	InsertItemsArgs,
	MoveErrorArgs,
	MoveItemsArgs,
	NameConflictArgs,
	NameConflictResolution,
	PasteOperation,
	RenameErrorArgs,
	RenameItemArgs,
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
	onRenameError: (args: RenameErrorArgs) => void;
	onMoveItems: (args: MoveItemsArgs) => MaybePromise<boolean>;
	onMoveError: (args: MoveErrorArgs) => void;
	onInsertItems: (args: InsertItemsArgs) => MaybePromise<boolean>;
	onNameConflict: (args: NameConflictArgs) => MaybePromise<NameConflictResolution>;
	onDeleteItems: (args: DeleteItemsArgs) => MaybePromise<boolean>;
};

export type TreeItemPosition<TNode extends FileTreeNode = FileTreeNode> = {
	node: TNode;
	index: number;
	parent?: TreeItemPosition<FolderNode>;
};

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
	onRenameError,
	onMoveItems,
	onMoveError,
	onInsertItems,
	onNameConflict,
	onDeleteItems,
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

	function toggleSelection(item: TreeItemState): void {
		if (item.selected()) {
			selectedIds().delete(item.node.id);
		} else {
			selectedIds().add(item.node.id);
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

	function selectUntil(item: TreeItemState, element: HTMLElement): void {
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
				if (current.node === item.node) {
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
		while (current.node !== item.node) {
			current = navigate(current);
			if (current === undefined) {
				break;
			}
			selectedIds().add(current.node.id);
		}
	}

	async function renameItem(item: TreeItemState, name: string): Promise<boolean> {
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
			return true;
		}

		const result = onRenameItem({
			target: item.node,
			name,
		});
		return result instanceof Promise ? await result : result;
	}

	async function moveItems(
		movedIds: Set<string>,
		item: TreeItemState,
		position: DropPosition,
	): Promise<boolean> {
		for (
			let current: TreeItemState | undefined = item;
			current !== undefined;
			current = current.parent
		) {
			if (movedIds.has(current.node.id)) {
				// Don't move an item next to or inside itself.
				onMoveError({
					error: "circular-reference",
					target: current.node,
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
				if (item.node.type === "file") {
					if (DEV) {
						throw new Error("Cannot move an item inside a file");
					}
					return false;
				}

				owner = item.node;
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
		outer: for (const id of movedIds) {
			const current = lookup().get(id);
			if (current === undefined) {
				continue;
			}

			for (let ancestor = current.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (movedIds.has(ancestor.node.id)) {
					// If an ancestor is moved, its children are moved along with it.
					continue outer;
				}
			}

			const currentOwner = current.parent?.node ?? tree();
			if (currentOwner !== owner && ownerChildrenNames.has(current.node.name)) {
				const result = onNameConflict({
					operation: "move",
					target: current.node,
				});
				const conflictResolution = result instanceof Promise ? await result : result;
				switch (conflictResolution) {
					case "skip": {
						skippedIds.add(current.node.id);
						continue;
					}
					case "cancel": {
						return false;
					}
				}
			}

			ownerChildrenNames.add(current.node.name);
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
					if (movedIds.has(child.id)) {
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
				children = owner.children.filter((child) => !movedIds.has(child.id));
				children.push(...moved);
				break;
			}
		}

		updates.push({
			target: owner,
			children,
		});

		const result = onMoveItems({
			updates,
			moved,
		});
		return result instanceof Promise ? await result : result;
	}

	function moveSelected(item: TreeItemState, position: DropPosition): Promise<boolean> {
		return moveItems(selectedIds(), item, position);
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

	async function copyPaste(item: TreeItemState, position: DropPosition): Promise<boolean> {
		let owner: FolderNode | FileTree;
		switch (position) {
			case "before":
			case "after": {
				owner = item.parent?.node ?? tree();
				break;
			}
			case "inside": {
				if (item.node.type === "file") {
					if (DEV) {
						throw new Error("Cannot move an item inside a file");
					}
					return false;
				}

				owner = item.node;
				break;
			}
		}

		const ownerChildrenNames = new Set<string>();
		for (const child of owner.children) {
			ownerChildrenNames.add(child.name);
		}

		const copies: Array<FileTreeNode> = [];
		outer: for (const id of clipboardIds()) {
			const current = lookup().get(id);
			if (current === undefined) {
				continue;
			}

			for (let ancestor = current.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (ancestor.inClipboard()) {
					// If an ancestor is copied, its children are copied along with it.
					continue outer;
				}
			}

			const copy = copyNode(current.node);
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
			return true;
		}

		let start: number;
		switch (position) {
			case "before": {
				start = item.index;
				break;
			}
			case "after": {
				start = item.index + 1;
				break;
			}
			case "inside": {
				start = owner.children.length;
				break;
			}
		}

		const result = onInsertItems({
			target: owner,
			start,
			inserted: copies,
		});
		return result instanceof Promise ? await result : result;
	}

	async function paste(item: TreeItemState, position?: DropPosition): Promise<boolean> {
		if (position === undefined) {
			switch (item.node.type) {
				case "file": {
					position = "after";
					break;
				}
				case "folder": {
					position = item.expanded() ? "inside" : "after";
					break;
				}
			}
		}

		let didPaste: boolean;
		switch (pasteOperation()) {
			case "copy": {
				didPaste = await copyPaste(item, position);
				break;
			}
			case "cut": {
				didPaste = await moveItems(clipboardIds(), item, position);
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

	async function deleteSelected(item: TreeItemState): Promise<boolean> {
		const deleted: Array<FileTreeNode> = [];
		const deletedOwners = new Set<FolderNode | FileTree>();
		outer: for (const id of selectedIds()) {
			const current = lookup().get(id);
			if (current === undefined) {
				continue;
			}

			for (let ancestor = current.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (ancestor.selected()) {
					// If an ancestor is deleted, its children are deleted along with it.
					continue outer;
				}
			}

			deleted.push(current.node);
			deletedOwners.add(current.parent?.node ?? tree());
		}

		if (deleted.length === 0) {
			return true;
		}

		let focusTarget: TreeItemPosition | undefined = item;
		do {
			// Move to the highest selected ancestor as all its children will be deleted.
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
				// The current item will be deleted, so we shouldn't traverse its children.
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
		} while (focusTarget !== undefined);

		const updates: DeleteItemsArgs["updates"] = [];
		for (const deletedOwner of deletedOwners) {
			updates.push({
				target: deletedOwner,
				children: deletedOwner.children.filter((child) => !selectedIds().has(child.id)),
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
	}

	function onDeleteItem(id: string): void {
		selectedIds().delete(id);
		expandedIds().delete(id);
		clipboardIds().delete(id);
	}

	function onDestroyItem(id: string): void {
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
		isItemTabbable,
		setTabbableId,
		draggedId,
		setDraggedId,
		items,
		getItemElementId,
		getItemElement,
		getNextItem,
		getPreviousItem,
		copySelectedToClipboard,
		clearClipboard,
		toggleSelection,
		selectAll,
		selectUntil,
		renameItem,
		moveSelected,
		paste,
		deleteSelected,
		onDeleteItem,
		onDestroyItem,
	};
}

export type TreeState = ReturnType<typeof createTreeState>;
