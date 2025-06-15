<script
	lang="ts"
	generics="TFile extends FileNode = FileNode, TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>, TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>"
>
	import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
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
	import type { PasteOperation, TreeProps } from "./types.js";

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
		onDropDestinationChange = noop,
		onResolveNameConflict = () => "cancel",
		onCircularReference = noop,
		canCopy = truePredicate,
		onCopy = noop,
		canMove = truePredicate,
		onMove = noop,
		canRemove = truePredicate,
		onRemove = noop,
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
		let lastSelected: TreeItemPosition | undefined;
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

	export function copyToClipboard(itemId: string, operation: PasteOperation) {
		clipboardIds.clear();
		for (const id of selectedIds) {
			clipboardIds.add(id);
		}
		clipboardIds.add(itemId);
		pasteOperation = operation;
		onClipboardChange({ clipboardIds, pasteOperation });
	}

	export function clearClipboard() {
		clipboardIds.clear();
		pasteOperation = undefined;
		onClipboardChange({ clipboardIds, pasteOperation });
	}

	function getNearestAncestor(
		item: TreeItemState<TFile, TFolder>,
		predicate: (ancestor: TreeItemState<TFile, TFolder, TFolder>) => boolean,
	) {
		for (let ancestor = item.parent; ancestor !== undefined; ancestor = ancestor.parent) {
			if (predicate(ancestor)) {
				return ancestor;
			}
		}
	}

	function hasAncestor(
		item: TreeItemState<TFile, TFolder>,
		predicate: (ancestor: TreeItemState<TFile, TFolder, TFolder>) => boolean,
	) {
		return getNearestAncestor(item, predicate) !== undefined;
	}

	function isItemSelected(item: TreeItemState<TFile, TFolder>) {
		return item.selected;
	}

	function isItemInClipboard(item: TreeItemState<TFile, TFolder>) {
		return item.inClipboard;
	}

	async function copy(destination: TFolder | TTree) {
		const names = new Set<string>();
		for (const child of destination.children) {
			names.add(child.name);
		}

		const sources: Array<TreeItemState<TFile, TFolder>> = [];
		for (const id of clipboardIds) {
			const current = getItem(id);
			if (current === undefined) {
				continue;
			}

			if (hasAncestor(current, isItemInClipboard)) {
				// If an ancestor is copied, its children are copied along with it.
				continue;
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
		}

		if (sources.length === 0) {
			return true;
		}

		const canCopyResult = await canCopy({ sources, destination });
		if (!canCopyResult) {
			return false;
		}

		const destinationChildren = destination.children;
		for (const source of sources) {
			const copy = copyNode(source.node);
			destinationChildren.push(copy);
		}
		onChildrenChange({
			operation: "insert",
			target: destination,
			children: destinationChildren,
		});

		onCopy({ sources, destination });
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
		for (const id of movedIds) {
			const current = getItem(id);
			if (current === undefined) {
				continue;
			}

			const currentOwner = current.parent?.node ?? root;
			if (currentOwner === destination) {
				continue;
			}

			if (hasAncestor(current, isItemMoved)) {
				// If an ancestor is moved, its children are moved along with it.
				continue;
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
		let didPaste: boolean;
		switch (pasteOperation) {
			case "copy": {
				didPaste = await copy(destination);
				break;
			}
			case "cut": {
				didPaste = await move(clipboardIds, isItemInClipboard, destination);
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

	async function _remove(item: TreeItemState<TFile, TFolder>) {
		const removed: Array<TreeItemState<TFile, TFolder>> = [];
		const removedOwners = new Set<TFolder | TTree>();
		for (const id of selectedIds) {
			const current = getItem(id);
			if (current === undefined) {
				continue;
			}

			if (hasAncestor(current, isItemSelected)) {
				// If an ancestor is removed, its children are removed along with it.
				continue;
			}

			removed.push(current);
			removedOwners.add(current.parent?.node ?? root);
		}

		if (!item.selected && !hasAncestor(item, isItemSelected)) {
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
			for (
				let ancestor: TreeItemPosition | undefined = focusTarget.parent;
				ancestor !== undefined;
				ancestor = ancestor.parent
			) {
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

		for (const owner of removedOwners) {
			owner.children = owner.children.filter((child) => !selectedIds.has(child.id));
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

	export async function remove(itemId: string) {
		const item = getItem(itemId);
		if (item === undefined) {
			return false;
		}
		return await _remove(item);
	}

	function getDropDestinationItem(item: TreeItemState<TFile, TFolder>) {
		switch (item.node.type) {
			case "file": {
				return item.parent;
			}
			case "folder": {
				return item as TreeItemState<TFile, TFolder, TFolder>;
			}
		}
	}

	setTreeContext<TFile, TFolder>({
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
					_remove(item);
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

					copyToClipboard(item.node.id, "copy");
					break;
				}
				case "x": {
					if (!isControlOrMeta(event)) {
						break;
					}

					copyToClipboard(item.node.id, "cut");
					break;
				}
				case "v": {
					if (!isControlOrMeta(event)) {
						break;
					}

					if (pasteOperation === undefined) {
						break;
					}

					let pasteDestinationItem: TreeItemState<TFile, TFolder, TFolder> | undefined;
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

					if (pasteDestinationItem !== undefined && pasteOperation === "cut") {
						if (pasteDestinationItem.inClipboard) {
							onCircularReference({
								source: pasteDestinationItem,
								destination: pasteDestinationItem.node,
							});
							break;
						}

						const nearestCopiedAncestor = getNearestAncestor(
							pasteDestinationItem,
							isItemInClipboard,
						);
						if (nearestCopiedAncestor !== undefined) {
							onCircularReference({
								source: nearestCopiedAncestor,
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
		canDrag: (item) => !item.disabled,
		onDragStart: (item) => {
			if (!item.selected) {
				selectedIds.clear();
				selectedIds.add(item.node.id);
			}
		},
		canDrop: (item, args) => {
			if (item.disabled) {
				return false;
			}

			const source = args.source;
			const sourceId = source.data.id;
			if (typeof sourceId !== "string" || !lookup.has(sourceId)) {
				return false;
			}

			if (item.node.id === sourceId) {
				// Dropping an item on itself is not allowed.
				return false;
			}

			const dropDestinationItem = getDropDestinationItem(item);
			if (dropDestinationItem === undefined) {
				// Dropping at the root level is always allowed.
				return true;
			}

			if (dropDestinationItem.selected || dropDestinationItem.node.id === sourceId) {
				// Moving an item inside itself is not allowed.
				return false;
			}

			// Moving an item inside itself is not allowed.
			return !hasAncestor(
				dropDestinationItem,
				(ancestor) => ancestor.selected || ancestor.node.id === sourceId,
			);
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
				const input = args.input;
				if ("__canDrop" in input && input.__canDrop === false) {
					return false;
				}
				return true;
			},
			onDrag: (args) => {
				const dropTargets = args.location.current.dropTargets;
				if (dropTargets.length === 0) {
					return;
				}

				const dropTarget = dropTargets[0];
				if (dropTarget.element === args.self.element) {
					onDropDestinationChange({ dropDestination: root });
				} else {
					const dropTargetId = dropTarget.data.id;
					if (typeof dropTargetId !== "string") {
						return;
					}

					const dropTargetItem = getItem(dropTargetId);
					if (dropTargetItem === undefined) {
						return;
					}

					const dropDestinationItem = getDropDestinationItem(dropTargetItem);
					const dropDestination = dropDestinationItem?.node ?? root;
					onDropDestinationChange({ dropDestination });
				}
			},
			onDragLeave: () => {
				onDropDestinationChange({ dropDestination: undefined });
			},
			onDrop: async (args) => {
				onDropDestinationChange({ dropDestination: undefined });

				const source = args.source;
				const sourceId = source.data.id;
				if (typeof sourceId !== "string") {
					return;
				}

				const sourceItem = getItem(sourceId);
				if (sourceItem === undefined) {
					return;
				}

				const dropTargets = args.location.current.dropTargets;
				if (dropTargets.length === 0) {
					return;
				}

				let dropDestination: TFolder | TTree;
				const dropTarget = dropTargets[0];
				if (dropTarget.element === args.self.element) {
					dropDestination = root;
				} else {
					const dropTargetId = dropTarget.data.id;
					if (typeof dropTargetId !== "string") {
						return;
					}

					const dropTargetItem = getItem(dropTargetId);
					if (dropTargetItem === undefined) {
						return;
					}

					const dropDestinationItem = getDropDestinationItem(dropTargetItem);
					dropDestination = dropDestinationItem?.node ?? root;
				}

				if (!sourceItem.selected) {
					selectedIds.add(sourceId);
				}

				const didMove = await move(selectedIds, isItemSelected, dropDestination);
				if (didMove) {
					source.element.focus();
				}
			},
		});
	});
</script>

<div {...rest} bind:this={ref} role="tree" aria-multiselectable="true">
	{@render children({ items })}
</div>
