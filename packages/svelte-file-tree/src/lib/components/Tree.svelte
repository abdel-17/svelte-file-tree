<script
	lang="ts"
	generics="TFile extends FileNode = FileNode, TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>, TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>"
>
	import type { DragLocation } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types.js";
	import {
		dropTargetForElements,
		type ElementDropTargetGetFeedbackArgs,
	} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
	import {
		dropTargetForExternal,
		type ExternalDropTargetGetFeedbackArgs,
	} from "@atlaskit/pragmatic-drag-and-drop/external/adapter";
	import { DEV } from "esm-env";
	import { SvelteSet } from "svelte/reactivity";
	import { isControlOrMeta, noop, truePredicate } from "$lib/helpers.js";
	import {
		FileNode,
		FileTree,
		FolderNode,
		TreeItemState,
		type DefaultTFolder,
	} from "$lib/tree.svelte.js";
	import { setTreeContext } from "./context.js";
	import { DragData } from "./data.js";
	import type {
		TreeCopyToClipboardMethodOptions,
		TreeProps,
		TreeRemoveMethodOptions,
	} from "./types.js";

	let {
		children,
		root,
		defaultSelectedIds,
		selectedIds = new SvelteSet(defaultSelectedIds),
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
		defaultClipboardIds,
		clipboardIds = new SvelteSet(defaultClipboardIds),
		pasteOperation = $bindable(),
		isItemDisabled = false,
		ref = $bindable(null),
		copyNode = function copyNode(node): TFile | TFolder {
			if (DEV && node.constructor !== FileNode && node.constructor !== FolderNode) {
				throw new Error(
					`You need to pass a "copyNode" prop to specify how to copy a "${node.constructor.name}" object`,
				);
			}

			switch (node.type) {
				case "file": {
					return new FileNode({
						id: crypto.randomUUID(),
						name: node.name,
					}) as TFile;
				}
				case "folder": {
					return new FolderNode({
						id: crypto.randomUUID(),
						name: node.name,
						children: node.children.map(copyNode),
					}) as TFolder;
				}
			}
		},
		onClipboardChange = noop,
		onChildrenChange = noop,
		onResolveNameConflict = () => "cancel",
		onCircularReference = noop,
		canCopy = truePredicate,
		onCopy = noop,
		canMove = truePredicate,
		onMove = noop,
		canRemove = truePredicate,
		onRemove = noop,
		onDragEnter = noop,
		onDragLeave = noop,
		canDrag = truePredicate,
		onDrag = noop,
		canDrop = truePredicate,
		onDrop = noop,
		...rest
	}: TreeProps<TFile, TFolder, TTree> = $props();

	const uid = $props.id();
	let tabbableId: string | undefined = $state.raw();

	const items = $derived.by(function createItems(
		nodes = root.children,
		parent?: TreeItemState<TFile, TFolder, TFolder>,
		result: Array<TreeItemState<TFile, TFolder>> = [],
	) {
		for (let index = 0; index < nodes.length; index++) {
			const node = nodes[index];
			const item = new TreeItemState({
				node,
				index,
				parent,
				selectedIds: () => selectedIds,
				expandedIds: () => expandedIds,
				clipboardIds: () => clipboardIds,
				isItemDisabled: () => isItemDisabled,
			});
			result.push(item);

			if (node.type === "folder") {
				createItems(node.children, item as TreeItemState<TFile, TFolder, TFolder>, result);
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

	export function getItems() {
		return items;
	}

	export function getItem(itemId: string) {
		return lookup.get(itemId);
	}

	export function getItemElementId(itemId: string) {
		return `${uid}:${itemId}`;
	}

	export function getItemElement(itemId: string) {
		const elementId = getItemElementId(itemId);
		return document.getElementById(elementId);
	}

	type TreeItemPosition<TNode extends TFile | TFolder = TFile | TFolder> = {
		node: TNode;
		index: number;
		parent?: TreeItemPosition<TFolder>;
	};

	function getNextNonChildItem(current: TreeItemPosition): TreeItemPosition | undefined {
		let { index, parent } = current;
		while (true) {
			const siblings = parent?.node.children ?? root.children;
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
		const node = current.node;
		if (node.type === "folder" && expandedIds.has(node.id)) {
			const children = node.children;
			if (children.length !== 0) {
				return {
					node: children[0],
					index: 0,
					parent: current as TreeItemPosition<TFolder>,
				};
			}
		}
		return getNextNonChildItem(current);
	}

	function getPreviousItem(current: TreeItemPosition): TreeItemPosition | undefined {
		let { node, index, parent } = current;
		if (index === 0) {
			return parent;
		}

		index--;
		node = parent?.node.children[index] ?? root.children[index];
		while (node.type === "folder" && expandedIds.has(node.id)) {
			const children = node.children;
			if (children.length === 0) {
				break;
			}

			parent = { node, index, parent };
			index = children.length - 1;
			node = children[index];
		}
		return { node, index, parent };
	}

	function selectUntil(item: TreeItemState<TFile, TFolder>, itemElement: HTMLDivElement) {
		let lastSelected;
		for (const id of selectedIds) {
			const current = getItem(id);
			if (current !== undefined) {
				lastSelected = current;
			}
		}

		if (lastSelected === undefined) {
			let current: TreeItemPosition | undefined = items[0];
			do {
				selectedIds.add(current.node.id);
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

		const positionBitmask = lastSelectedElement.compareDocumentPosition(itemElement);
		const following = positionBitmask & Node.DOCUMENT_POSITION_FOLLOWING;
		const navigate = following !== 0 ? getNextItem : getPreviousItem;

		let current: TreeItemPosition | undefined = lastSelected;
		while (current.node !== item.node) {
			current = navigate(current);
			if (current === undefined) {
				break;
			}
			selectedIds.add(current.node.id);
		}
	}

	function toggleSelection(item: TreeItemState<TFile, TFolder>) {
		if (item.selected) {
			selectedIds.delete(item.node.id);
		} else {
			selectedIds.add(item.node.id);
		}
	}

	function selectAll(nodes: Array<TFile | TFolder>) {
		for (const node of nodes) {
			selectedIds.add(node.id);

			if (node.type === "folder" && expandedIds.has(node.id)) {
				selectAll(node.children);
			}
		}
	}

	export function copyToClipboard(itemId: string, options: TreeCopyToClipboardMethodOptions = {}) {
		const { pasteOperation: newPasteOperation = "copy", batched = true } = options;

		clipboardIds.clear();
		if (batched) {
			for (const id of selectedIds) {
				clipboardIds.add(id);
			}
		}
		clipboardIds.add(itemId);
		pasteOperation = newPasteOperation;
		onClipboardChange({ clipboardIds, pasteOperation });
	}

	export function clearClipboard() {
		clipboardIds.clear();
		pasteOperation = undefined;
		onClipboardChange({ clipboardIds, pasteOperation });
	}

	async function copy(destination: TFolder | TTree) {
		const names = new Set<string>();
		for (const child of destination.children) {
			names.add(child.name);
		}

		const sources: Array<TreeItemState<TFile, TFolder>> = [];
		const copies: Array<TFile | TFolder> = [];
		outer: for (const id of clipboardIds) {
			const current = getItem(id);
			if (current === undefined) {
				continue;
			}

			for (let ancestor = current.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (ancestor.inClipboard) {
					// If an ancestor is copied, its children are copied along with it.
					continue outer;
				}
			}

			const name = current.node.name;
			if (names.has(name)) {
				const resolution = await onResolveNameConflict({
					operation: "copy",
					destination,
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

			names.add(name);
			sources.push(current);
			copies.push(copyNode(current.node));
		}

		if (sources.length === 0) {
			return true;
		}

		const canCopyResult = await canCopy({ sources, copies, destination });
		if (!canCopyResult) {
			return false;
		}

		const destinationChildren = destination.children;
		for (const copy of copies) {
			destinationChildren.push(copy);
		}
		onChildrenChange({
			operation: "insert",
			target: destination,
			children: destinationChildren,
		});

		onCopy({ sources, copies, destination });
		return true;
	}

	async function move(
		movedIds: Set<string>,
		isItemMoved: (item: TreeItemState<TFile, TFolder>) => boolean,
		destination: TFolder | TTree,
	) {
		const names = new Set<string>();
		for (const child of destination.children) {
			names.add(child.name);
		}

		const sources: Array<TreeItemState<TFile, TFolder>> = [];
		const sourceIds = new Set<string>();
		const sourceOwners = new Set<TFolder | TTree>();
		outer: for (const id of movedIds) {
			const current = getItem(id);
			if (current === undefined) {
				continue;
			}

			const currentOwner = current.parent?.node ?? root;
			if (currentOwner === destination) {
				continue;
			}

			for (let ancestor = current.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (isItemMoved(ancestor)) {
					// If an ancestor is moved, its children are moved along with it.
					continue outer;
				}
			}

			const name = current.node.name;
			if (names.has(name)) {
				const resolution = await onResolveNameConflict({
					operation: "move",
					destination,
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

			names.add(name);
			sources.push(current);
			sourceIds.add(current.node.id);
			sourceOwners.add(currentOwner);
		}

		if (sources.length === 0) {
			return true;
		}

		const canMoveResult = await canMove({ sources, destination });
		if (!canMoveResult) {
			return false;
		}

		for (const owner of sourceOwners) {
			owner.children = owner.children.filter((child) => !sourceIds.has(child.id));
			onChildrenChange({
				operation: "remove",
				target: owner,
				children: owner.children,
			});
		}

		const destinationChildren = destination.children;
		for (const source of sources) {
			destinationChildren.push(source.node);
		}
		onChildrenChange({
			operation: "insert",
			target: destination,
			children: destinationChildren,
		});

		onMove({ sources, destination });
		return true;
	}

	export async function paste(destination: TFolder | TTree) {
		let didPaste;
		switch (pasteOperation) {
			case "copy": {
				didPaste = await copy(destination);
				break;
			}
			case "cut": {
				didPaste = await move(clipboardIds, (item) => item.inClipboard, destination);
				break;
			}
			case undefined: {
				return false;
			}
		}

		if (!didPaste) {
			return false;
		}

		clearClipboard();
		return true;
	}

	function onRemoveNode(node: TFile | TFolder) {
		const id = node.id;
		selectedIds.delete(id);
		expandedIds.delete(id);
		clipboardIds.delete(id);

		if (clipboardIds.size === 0) {
			pasteOperation = undefined;
		}

		if (node.type === "folder") {
			for (const child of node.children) {
				onRemoveNode(child);
			}
		}
	}

	export async function remove(
		item: TreeItemState<TFile, TFolder>,
		options: TreeRemoveMethodOptions = {},
	) {
		const { batched = true } = options;

		const removed: Array<TreeItemState<TFile, TFolder>> = [];
		const removedOwners = new Set<TFolder | TTree>();
		if (batched) {
			outer: for (const id of selectedIds) {
				const current = getItem(id);
				if (current === undefined) {
					continue;
				}

				for (let ancestor = current.parent; ancestor !== undefined; ancestor = ancestor.parent) {
					if (ancestor.selected) {
						// If an ancestor is removed, its children are removed along with it.
						continue outer;
					}
				}

				removed.push(current);
				removedOwners.add(current.parent?.node ?? root);
			}
		}

		if (!removed.includes(item)) {
			removed.push(item);
			removedOwners.add(item.parent?.node ?? root);
		}

		const canRemoveResult = await canRemove({ removed });
		if (!canRemoveResult) {
			return false;
		}

		let focusTarget = getNextNonChildItem(item) ?? getPreviousItem(item);
		while (focusTarget !== undefined) {
			// Move to the highest selected ancestor as all its children will be removed.
			for (let ancestor = focusTarget.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (selectedIds.has(ancestor.node.id)) {
					focusTarget = ancestor;
				}
			}

			// Focus the nearest remaining item after this item.
			let nearestUnselected: TreeItemPosition | undefined = focusTarget;
			while (nearestUnselected !== undefined && selectedIds.has(nearestUnselected.node.id)) {
				// The current item will be removed, so we shouldn't traverse its children.
				nearestUnselected = getNextNonChildItem(nearestUnselected);
			}

			if (nearestUnselected === undefined) {
				// Focus the nearest remaining item before this item.
				nearestUnselected = focusTarget;
				while (nearestUnselected !== undefined && selectedIds.has(nearestUnselected.node.id)) {
					nearestUnselected = getPreviousItem(nearestUnselected);
				}
			}

			if (focusTarget === nearestUnselected) {
				getItemElement(focusTarget.node.id)?.focus();
				break;
			}

			// This item might be inside a selected folder, so we need to continue the loop.
			focusTarget = nearestUnselected;
		}

		const node = item.node;
		if (batched) {
			for (const owner of removedOwners) {
				owner.children = owner.children.filter(
					(child) => !selectedIds.has(child.id) && child !== node,
				);
				onChildrenChange({
					operation: "remove",
					target: owner,
					children: owner.children,
				});
			}
		} else {
			const owner = item.parent?.node ?? root;
			owner.children = owner.children.filter((child) => child !== node);
			onChildrenChange({
				operation: "remove",
				target: owner,
				children: owner.children,
			});
		}

		const currentClipboardSize = clipboardIds.size;
		for (const item of removed) {
			onRemoveNode(item.node);
		}

		if (clipboardIds.size !== currentClipboardSize) {
			onClipboardChange({ clipboardIds, pasteOperation });
		}

		onRemove({ removed });
		return true;
	}

	function getDropDestination(item: TreeItemState<TFile, TFolder>) {
		switch (item.node.type) {
			case "file": {
				return item.parent?.node ?? root;
			}
			case "folder": {
				return item.node;
			}
		}
	}

	function canDropElementOnItem(
		item: TreeItemState<TFile, TFolder>,
		args: ElementDropTargetGetFeedbackArgs,
	) {
		if (item.disabled) {
			return false;
		}

		const dragData = args.source.data;
		if (!(dragData instanceof DragData)) {
			return false;
		}
		const source = dragData.item();

		if (item === source) {
			// Dropping an item on itself is not allowed.
			return false;
		}

		let dropDestinationItem;
		switch (item.node.type) {
			case "file": {
				dropDestinationItem = item.parent;
				break;
			}
			case "folder": {
				dropDestinationItem = item as TreeItemState<TFile, TFolder, TFolder>;
				break;
			}
		}

		for (let current = dropDestinationItem; current !== undefined; current = current.parent) {
			if (current.selected || current === source) {
				// Moving an item inside itself is not allowed.
				return false;
			}
		}

		return canDrop({
			type: "item",
			source,
			input: args.input,
			destination: dropDestinationItem?.node ?? root,
		});
	}

	function canDropExternalOnItem(
		item: TreeItemState<TFile, TFolder>,
		args: ExternalDropTargetGetFeedbackArgs,
	) {
		if (item.disabled) {
			return false;
		}

		return canDrop({
			type: "external",
			input: args.input,
			items: args.source.items,
			destination: getDropDestination(item),
		});
	}

	function getDropDestinationFromLocation(location: DragLocation) {
		const dropTarget = location.dropTargets[0];
		switch (dropTarget?.element.role) {
			case "tree": {
				return root;
			}
			case "treeitem": {
				const dropData = dropTarget.data;
				if (!(dropData instanceof DragData)) {
					return;
				}
				return getDropDestination(dropData.item());
			}
		}
	}

	setTreeContext<TFile, TFolder, TTree>({
		root: () => root,
		tabbableId: () => tabbableId ?? root.children[0].id,
		getItemElementId,
		onFocusIn: (item) => {
			tabbableId = item.node.id;
		},
		onKeyDown: (item, event) => {
			if (event.target !== event.currentTarget) {
				// Don't handle keydown events that bubble up from child elements
				// because it can cause unexpected behavior with child inputs.
				return;
			}

			if (item.disabled) {
				return;
			}

			switch (event.key) {
				case "ArrowRight": {
					const node = item.node;
					if (node.type === "file") {
						break;
					}

					if (!item.expanded) {
						expandedIds.add(node.id);
						break;
					}

					const children = node.children;
					if (children.length !== 0) {
						getItemElement(children[0].id)?.focus();
					}
					break;
				}
				case "ArrowLeft": {
					const node = item.node;
					if (node.type === "folder" && item.expanded) {
						expandedIds.delete(node.id);
						break;
					}

					const parent = item.parent;
					if (parent !== undefined) {
						getItemElement(parent.node.id)?.focus();
					}
					break;
				}
				case "ArrowDown":
				case "ArrowUp": {
					const down = event.key === "ArrowDown";
					const next = down ? getNextItem(item) : getPreviousItem(item);
					if (next === undefined) {
						break;
					}

					const nextId = next.node.id;
					const nextElement = getItemElement(nextId);
					if (nextElement === null) {
						break;
					}

					if (event.shiftKey) {
						selectedIds.add(item.node.id).add(nextId);
					} else if (!isControlOrMeta(event)) {
						selectedIds.clear();
						selectedIds.add(nextId);
					}

					nextElement.focus();
					break;
				}
				case "PageDown":
				case "PageUp": {
					const down = event.key === "PageDown";
					const navigate = down ? getNextItem : getPreviousItem;
					const shouldSelectMultiple = event.shiftKey && isControlOrMeta(event);

					const maxScrollDistance = Math.min(
						ref!.clientHeight,
						document.documentElement.clientHeight,
					);
					const itemElement = event.currentTarget;
					const itemRect = itemElement.getBoundingClientRect();

					let current: TreeItemPosition = item;
					let currentElement: HTMLElement = itemElement;
					while (true) {
						const next = navigate(current);
						if (next === undefined) {
							break;
						}

						const nextElement = getItemElement(next.node.id);
						if (nextElement === null) {
							break;
						}

						const nextRect = nextElement.getBoundingClientRect();
						const distance = Math.abs(nextRect.top - itemRect.top);
						if (distance > maxScrollDistance) {
							break;
						}

						if (shouldSelectMultiple) {
							selectedIds.add(current.node.id);
						}

						current = next;
						currentElement = nextElement;
					}

					if (current === item) {
						break;
					}

					if (!shouldSelectMultiple) {
						selectedIds.clear();
					}

					selectedIds.add(current.node.id);
					currentElement.focus();
					break;
				}
				case "Home": {
					const first = root.children[0];
					if (first === item.node) {
						break;
					}

					const firstId = first.id;
					const firstElement = getItemElement(firstId);
					if (firstElement === null) {
						break;
					}

					if (event.shiftKey && isControlOrMeta(event)) {
						let current: TreeItemPosition | undefined = item;
						do {
							selectedIds.add(current.node.id);
							current = getPreviousItem(current);
						} while (current !== undefined);
					} else {
						selectedIds.clear();
						selectedIds.add(firstId);
					}

					firstElement.focus();
					break;
				}
				case "End": {
					let last = root.children.at(-1)!;
					while (last.type === "folder" && expandedIds.has(last.id)) {
						const children = last.children;
						if (children.length === 0) {
							break;
						}
						last = children.at(-1)!;
					}

					if (last === item.node) {
						break;
					}

					const lastId = last.id;
					const lastElement = getItemElement(last.id);
					if (lastElement === null) {
						break;
					}

					if (event.shiftKey && isControlOrMeta(event)) {
						let current: TreeItemPosition | undefined = item;
						do {
							selectedIds.add(current.node.id);
							current = getNextItem(current);
						} while (current !== undefined);
					} else {
						selectedIds.clear();
						selectedIds.add(lastId);
					}

					lastElement.focus();
					break;
				}
				case " ": {
					if (event.shiftKey) {
						selectUntil(item, event.currentTarget);
					} else {
						toggleSelection(item);
					}
					break;
				}
				case "Escape": {
					selectedIds.clear();
					clearClipboard();
					break;
				}
				case "*": {
					const owner = item.parent?.node ?? root;
					for (const child of owner.children) {
						if (child.type === "folder") {
							expandedIds.add(child.id);
						}
					}
					break;
				}
				case "Delete": {
					remove(item);
					break;
				}
				case "a": {
					if (!isControlOrMeta(event)) {
						break;
					}

					selectAll(root.children);
					break;
				}
				case "c": {
					if (!isControlOrMeta(event)) {
						break;
					}

					copyToClipboard(item.node.id, { pasteOperation: "copy" });
					break;
				}
				case "x": {
					if (!isControlOrMeta(event)) {
						break;
					}

					copyToClipboard(item.node.id, { pasteOperation: "cut" });
					break;
				}
				case "v": {
					if (!isControlOrMeta(event)) {
						break;
					}

					if (pasteOperation === undefined) {
						break;
					}

					let pasteDestinationItem;
					switch (item.node.type) {
						case "file": {
							pasteDestinationItem = item.parent;
							break;
						}
						case "folder": {
							if (event.shiftKey) {
								pasteDestinationItem = item.parent;
							} else {
								pasteDestinationItem = item as TreeItemState<TFile, TFolder, TFolder>;
							}
							break;
						}
					}

					if (pasteOperation === "cut") {
						let nearestCopiedItem;
						for (let item = pasteDestinationItem; item !== undefined; item = item.parent) {
							if (item.inClipboard) {
								nearestCopiedItem = item;
								break;
							}
						}

						if (pasteDestinationItem !== undefined && nearestCopiedItem !== undefined) {
							onCircularReference({
								source: nearestCopiedItem,
								destination: pasteDestinationItem.node,
							});
							break;
						}
					}

					const pasteDestination = pasteDestinationItem?.node ?? root;
					paste(pasteDestination).then((didPaste) => {
						if (didPaste) {
							event.currentTarget.focus();
						}
					});
					break;
				}
				default: {
					return;
				}
			}

			event.preventDefault();
		},
		onClick: (item, event) => {
			if (item.disabled) {
				return;
			}

			if (isControlOrMeta(event)) {
				toggleSelection(item);
			} else if (event.shiftKey) {
				selectUntil(item, event.currentTarget);
			} else {
				selectedIds.clear();
				selectedIds.add(item.node.id);
			}
		},
		getDropDestination,
		canDrag: (item, args) => {
			if (item.disabled) {
				return false;
			}

			return canDrag({
				input: args.input,
				source: item,
			});
		},
		canDropElement: (item, args) => {
			// If an item cannot be dropped on, we need to notify the root drop target
			// that it cannot be dropped on as well.
			const result = canDropElementOnItem(item, args);
			(args.input as any).__canDrop = result;
			return result;
		},
		canDropExternal: (item, args) => {
			const result = canDropExternalOnItem(item, args);
			(args.input as any).__canDrop = result;
			return result;
		},
		onDragStart: (item) => {
			if (!item.selected) {
				selectedIds.clear();
				selectedIds.add(item.node.id);
			}
		},
		onDestroyItem: (item) => {
			if (tabbableId === item.node.id) {
				tabbableId = undefined;
			}
		},
	});

	$effect(() => {
		return dropTargetForElements({
			element: ref!,
			canDrop: (args) => {
				// Check if an item prevented the drop.
				if ((args.input as any).__canDrop === false) {
					return false;
				}

				const dragData = args.source.data;
				if (!(dragData instanceof DragData)) {
					return false;
				}
				const source = dragData.item();

				return canDrop({
					type: "item",
					input: args.input,
					source,
					destination: root,
				});
			},
			onDragEnter: (args) => {
				const dragData = args.source.data;
				if (!(dragData instanceof DragData)) {
					return false;
				}
				const source = dragData.item();

				onDragEnter({
					type: "item",
					input: args.location.current.input,
					source,
					destination: root,
				});
			},
			onDragLeave: (args) => {
				const dragData = args.source.data;
				if (!(dragData instanceof DragData)) {
					return false;
				}
				const source = dragData.item();

				onDragLeave({
					type: "item",
					input: args.location.current.input,
					source,
					destination: root,
				});
			},
			onDrag: (args) => {
				const dragData = args.source.data;
				if (!(dragData instanceof DragData)) {
					return false;
				}
				const source = dragData.item();

				const location = args.location.current;
				const dropDestination = getDropDestinationFromLocation(location);
				if (dropDestination === undefined) {
					return;
				}

				onDrag({
					type: "item",
					input: location.input,
					source,
					destination: dropDestination,
				});
			},
			onDrop: async (args) => {
				const dragData = args.source.data;
				if (!(dragData instanceof DragData)) {
					return false;
				}
				const source = dragData.item();

				const location = args.location.current;
				const dropDestination = getDropDestinationFromLocation(location);
				if (dropDestination === undefined) {
					return;
				}

				onDrop({
					type: "item",
					input: location.input,
					source,
					destination: dropDestination,
				});

				if (!source.selected) {
					selectedIds.add(source.node.id);
				}

				const didMove = await move(selectedIds, (item) => item.selected, dropDestination);
				if (didMove) {
					args.source.element.focus();
				}
			},
		});
	});

	$effect(() => {
		return dropTargetForExternal({
			element: ref!,
			canDrop: (args) => {
				// Check if an item prevented the drop.
				if ((args.input as any).__canDrop === false) {
					return false;
				}

				return canDrop({
					type: "external",
					input: args.input,
					items: args.source.items,
					destination: root,
				});
			},
			onDragEnter: (args) => {
				onDragEnter({
					type: "external",
					input: args.location.current.input,
					items: args.source.items,
					destination: root,
				});
			},
			onDragLeave: (args) => {
				onDragLeave({
					type: "external",
					input: args.location.current.input,
					items: args.source.items,
					destination: root,
				});
			},
			onDrag: (args) => {
				const location = args.location.current;
				const dropDestination = getDropDestinationFromLocation(location);
				if (dropDestination === undefined) {
					return;
				}

				onDrag({
					type: "external",
					input: location.input,
					items: args.source.items,
					destination: dropDestination,
				});
			},
			onDrop: (args) => {
				const location = args.location.current;
				const dropDestination = getDropDestinationFromLocation(location);
				if (dropDestination === undefined) {
					return;
				}

				onDrop({
					type: "external",
					input: location.input,
					items: args.source.items,
					destination: dropDestination,
				});
			},
		});
	});
</script>

<div {...rest} bind:this={ref} role="tree" aria-multiselectable="true">
	{@render children({ items })}
</div>
