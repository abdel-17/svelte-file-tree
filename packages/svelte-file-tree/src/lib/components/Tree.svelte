<script
	lang="ts"
	generics="TFile extends FileNode = FileNode, TFolder extends FolderNode<TFile, TFolder> = FolderNode<TFile>, TTree extends FileTree<TFile, TFolder> = FileTree<TFile, TFolder>"
>
	import { DEV } from "esm-env";
	import { SvelteSet } from "svelte/reactivity";
	import { isControlOrMeta, noop, truePredicate } from "$lib/helpers.js";
	import {
		FileNode,
		FolderNode,
		TreeItemState,
		type FileTree,
		type PasteOperation,
	} from "$lib/tree.svelte.js";
	import { setTreeContext } from "./context.js";
	import type { TreeProps } from "./types.js";

	let {
		children,
		tree,
		defaultSelectedIds,
		selectedIds = new SvelteSet(defaultSelectedIds),
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
		clipboard = $bindable(),
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
		nodes = tree.children,
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
				clipboard: () => clipboard,
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
			const siblings = parent?.node.children ?? tree.children;
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
		node = parent?.node.children[index] ?? tree.children[index];
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

	function selectUntil(target: TreeItemState<TFile, TFolder>, targetElement: HTMLDivElement) {
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

		const positionBitmask = lastSelectedElement.compareDocumentPosition(targetElement);
		const following = positionBitmask & Node.DOCUMENT_POSITION_FOLLOWING;
		const navigate = following !== 0 ? getNextItem : getPreviousItem;

		let current: TreeItemPosition | undefined = lastSelected;
		while (current.node !== target.node) {
			current = navigate(current);
			if (current === undefined) {
				break;
			}
			selectedIds.add(current.node.id);
		}
	}

	function toggleSelection(target: TreeItemState<TFile, TFolder>) {
		if (target.selected) {
			selectedIds.delete(target.node.id);
		} else {
			selectedIds.add(target.node.id);
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

	export function copyToClipboard(
		target: TreeItemState<TFile, TFolder>,
		operation: PasteOperation,
	) {
		const clipboardIds = new Set(selectedIds);
		clipboardIds.add(target.node.id);
		clipboard = {
			ids: clipboardIds,
			operation,
		};
		onClipboardChange({ clipboard });
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

	function isItemSelected(item: TreeItemState<TFile, TFolder>) {
		return item.selected;
	}

	function isItemInClipboard(item: TreeItemState<TFile, TFolder>) {
		return item.inClipboard;
	}

	async function copy(clipboardIds: Set<string>, destination: TFolder | TTree) {
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

			const nearestCopiedAncestor = getNearestAncestor(current, isItemInClipboard);
			if (nearestCopiedAncestor !== undefined) {
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

			const currentOwner = current.parent?.node ?? tree;
			if (currentOwner === destination) {
				continue;
			}

			const nearestMovedAncestor = getNearestAncestor(current, isItemMoved);
			if (nearestMovedAncestor !== undefined) {
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
		if (clipboard === undefined) {
			return false;
		}

		let didPaste: boolean;
		switch (clipboard.operation) {
			case "copy": {
				didPaste = await copy(clipboard.ids, destination);
				break;
			}
			case "cut": {
				didPaste = await move(clipboard.ids, isItemInClipboard, destination);
				break;
			}
		}

		if (!didPaste) {
			return false;
		}

		clipboard = undefined;
		return true;
	}

	function onRemoveNode(node: TFile | TFolder) {
		const id = node.id;
		selectedIds.delete(id);
		expandedIds.delete(id);

		if (clipboard !== undefined) {
			const clipboardIds = clipboard.ids;
			clipboardIds.delete(id);
			if (clipboardIds.size === 0) {
				clipboard = undefined;
			}
		}

		if (node.type === "folder") {
			for (const child of node.children) {
				onRemoveNode(child);
			}
		}
	}

	export async function remove(target: TreeItemState<TFile, TFolder>) {
		const removed: Array<TreeItemState<TFile, TFolder>> = [];
		const removedOwners = new Set<TFolder | TTree>();
		for (const id of selectedIds) {
			const current = getItem(id);
			if (current === undefined) {
				continue;
			}

			const nearestRemovedAncestor = getNearestAncestor(current, isItemSelected);
			if (nearestRemovedAncestor !== undefined) {
				// If an ancestor is removed, its children are removed along with it.
				continue;
			}

			removed.push(current);
			removedOwners.add(current.parent?.node ?? tree);
		}

		if (!target.selected) {
			const nearestDeletedAncestor = getNearestAncestor(target, isItemSelected);
			if (nearestDeletedAncestor === undefined) {
				removed.push(target);
				removedOwners.add(target.parent?.node ?? tree);
			}
		}

		const canRemoveResult = await canRemove({ removed });
		if (!canRemoveResult) {
			return false;
		}

		let focusTarget = getNextNonChildItem(target) ?? getPreviousItem(target);
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

		for (const item of removed) {
			onRemoveNode(item.node);
		}

		onRemove({ removed });
		return true;
	}

	function getDropFolder(target: TreeItemState<TFile, TFolder>) {
		switch (target.node.type) {
			case "file": {
				return target.parent;
			}
			case "folder": {
				return target as TreeItemState<TFile, TFolder, TFolder>;
			}
		}
	}

	setTreeContext<TFile, TFolder, TTree>({
		tree: () => tree,
		tabbableId: () => tabbableId ?? tree.children[0].id,
		getItemElementId,
		onFocusIn: (target) => {
			tabbableId = target.node.id;
		},
		onKeyDown: (target, event) => {
			if (event.target !== event.currentTarget) {
				// Don't handle keydown events that bubble up from child elements
				// because it can cause unexpected behavior with child inputs.
				return;
			}

			if (target.disabled) {
				return;
			}

			switch (event.key) {
				case "ArrowRight": {
					const node = target.node;
					if (node.type === "file") {
						break;
					}

					if (!target.expanded) {
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
					const node = target.node;
					if (node.type === "folder" && target.expanded) {
						expandedIds.delete(node.id);
						break;
					}

					const parent = target.parent;
					if (parent !== undefined) {
						getItemElement(parent.node.id)?.focus();
					}
					break;
				}
				case "ArrowDown":
				case "ArrowUp": {
					const down = event.key === "ArrowDown";
					const next = down ? getNextItem(target) : getPreviousItem(target);
					if (next === undefined) {
						break;
					}

					const nextId = next.node.id;
					const nextElement = getItemElement(nextId);
					if (nextElement === null) {
						break;
					}

					if (event.shiftKey) {
						selectedIds.add(target.node.id).add(nextId);
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
					const targetElement = event.currentTarget;
					const targetRect = targetElement.getBoundingClientRect();

					let current: TreeItemPosition = target;
					let currentElement: HTMLElement = targetElement;
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
						const distance = Math.abs(nextRect.top - targetRect.top);
						if (distance > maxScrollDistance) {
							break;
						}

						if (shouldSelectMultiple) {
							selectedIds.add(current.node.id);
						}

						current = next;
						currentElement = nextElement;
					}

					if (current === target) {
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
					const first = tree.children[0];
					if (first === target.node) {
						break;
					}

					const firstId = first.id;
					const firstElement = getItemElement(firstId);
					if (firstElement === null) {
						break;
					}

					if (event.shiftKey && isControlOrMeta(event)) {
						let current: TreeItemPosition | undefined = target;
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
					let last = tree.children.at(-1)!;
					while (last.type === "folder" && expandedIds.has(last.id)) {
						const children = last.children;
						if (children.length === 0) {
							break;
						}
						last = children.at(-1)!;
					}

					if (last === target.node) {
						break;
					}

					const lastId = last.id;
					const lastElement = getItemElement(last.id);
					if (lastElement === null) {
						break;
					}

					if (event.shiftKey && isControlOrMeta(event)) {
						let current: TreeItemPosition | undefined = target;
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
						selectUntil(target, event.currentTarget);
					} else {
						toggleSelection(target);
					}
					break;
				}
				case "Escape": {
					selectedIds.clear();
					clipboard = undefined;
					onClipboardChange({ clipboard });
					break;
				}
				case "*": {
					const owner = target.parent?.node ?? tree;
					for (const child of owner.children) {
						if (child.type === "folder") {
							expandedIds.add(child.id);
						}
					}
					break;
				}
				case "Delete": {
					remove(target);
					break;
				}
				case "a": {
					if (!isControlOrMeta(event)) {
						break;
					}

					selectAll(tree.children);
					break;
				}
				case "c": {
					if (!isControlOrMeta(event)) {
						break;
					}

					copyToClipboard(target, "copy");
					break;
				}
				case "x": {
					if (!isControlOrMeta(event)) {
						break;
					}

					copyToClipboard(target, "cut");
					break;
				}
				case "v": {
					if (!isControlOrMeta(event)) {
						break;
					}

					if (clipboard === undefined) {
						break;
					}

					const dropFolder = getDropFolder(target);
					if (dropFolder === undefined) {
						// Pasting at the root level is always allowed.
						paste(tree);
						break;
					}

					if (clipboard.operation === "cut") {
						if (dropFolder.inClipboard) {
							// Pasting an item inside itself is not allowed.
							onCircularReference({
								source: dropFolder,
								destination: dropFolder.node,
							});
							break;
						}

						const nearestCopiedAncestor = getNearestAncestor(dropFolder, isItemInClipboard);
						if (nearestCopiedAncestor !== undefined) {
							// Pasting an item inside itself is not allowed.
							onCircularReference({
								source: dropFolder,
								destination: dropFolder.node,
							});
							break;
						}
					}

					paste(dropFolder.node).then((didPaste) => {
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
		onClick: (target, event) => {
			if (target.disabled) {
				return;
			}

			if (isControlOrMeta(event)) {
				toggleSelection(target);
			} else if (event.shiftKey) {
				selectUntil(target, event.currentTarget);
			} else {
				selectedIds.clear();
				selectedIds.add(target.node.id);
			}
		},
		canDrag: (target) => !target.disabled,
		onDragStart: (target) => {
			if (!target.selected) {
				selectedIds.clear();
				selectedIds.add(target.node.id);
			}
		},
		canDrop: (target, source) => {
			if (target.disabled) {
				return false;
			}

			const sourceId = source.data.id;
			if (typeof sourceId !== "string") {
				return false;
			}

			if (target.node.id === sourceId) {
				// Dropping an item on itself is not allowed.
				return false;
			}

			const dropFolder = getDropFolder(target);
			if (dropFolder === undefined) {
				// Dropping at the root level is always allowed.
				return true;
			}

			if (dropFolder.selected || dropFolder.node.id === sourceId) {
				// Moving an item inside itself is not allowed.
				return false;
			}

			// Moving an item inside itself is not allowed.
			const nearestMovedAncestor = getNearestAncestor(
				dropFolder,
				(ancestor) => ancestor.selected || ancestor.node.id === sourceId,
			);
			return nearestMovedAncestor === undefined;
		},
		onDrag: (target) => {
			const dropFolder = getDropFolder(target);
			const dropDestination = dropFolder?.node ?? tree;
			onDropDestinationChange({ dropDestination });
		},
		onDragLeave: () => {
			onDropDestinationChange({ dropDestination: undefined });
		},
		onDrop: async (target, source) => {
			const sourceId = source.data.id;
			if (typeof sourceId !== "string") {
				return;
			}

			onDropDestinationChange({ dropDestination: undefined });

			const sourceItem = getItem(sourceId);
			if (sourceItem === undefined) {
				return;
			}

			if (!sourceItem.selected) {
				selectedIds.add(sourceId);
			}

			const dropFolder = getDropFolder(target);
			const dropDestination = dropFolder?.node ?? tree;
			const didMove = await move(selectedIds, isItemSelected, dropDestination);
			if (didMove) {
				source.element.focus();
			}
		},
		onDestroyItem: (target) => {
			if (tabbableId === target.node.id) {
				tabbableId = undefined;
			}
		},
	});
</script>

<div {...rest} bind:this={ref} role="tree" aria-multiselectable="true">
	{@render children({ items })}
</div>
