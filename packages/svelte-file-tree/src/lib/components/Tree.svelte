<script lang="ts" module>
	import type { DragLocation } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types.js";
	import {
		dropTargetForElements,
		type ElementDropTargetGetFeedbackArgs,
		type ElementEventBasePayload,
		type ElementGetFeedbackArgs,
	} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
	import {
		dropTargetForExternal,
		type ExternalDropTargetGetFeedbackArgs,
	} from "@atlaskit/pragmatic-drag-and-drop/external/adapter";
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { falsePredicate, isControlOrMeta, noop, truePredicate } from "$lib/internal/helpers.js";
	import {
		FileNode,
		FileTree,
		FolderNode,
		TreeItemState,
		type DefaultTFolder,
	} from "$lib/tree.svelte.js";
	import { getVirtualListContextIfExists } from "./VirtualList.svelte";
	import { DragData } from "./data.js";
	import type { TreeProps, TreeRemoveMethodOptions } from "./types.js";

	export type TreeItemEvent<TEvent extends Event> = TEvent & {
		currentTarget: HTMLDivElement;
	};

	export type TreeContext<
		TFile extends FileNode,
		TFolder extends FolderNode<TFile | TFolder>,
		TTree extends FileTree<TFile | TFolder>,
	> = {
		root: () => TTree;
		tabbableId: () => string | undefined;
		getItemElementId: (itemId: string) => string;
		onFocusIn: (item: TreeItemState<TFile, TFolder>, event: TreeItemEvent<FocusEvent>) => void;
		onKeyDown: (item: TreeItemState<TFile, TFolder>, event: TreeItemEvent<KeyboardEvent>) => void;
		onClick: (item: TreeItemState<TFile, TFolder>, event: TreeItemEvent<MouseEvent>) => void;
		getDropDestination: (item: TreeItemState<TFile, TFolder>) => TFolder | TTree;
		canDrag: (item: TreeItemState<TFile, TFolder>, args: ElementGetFeedbackArgs) => boolean;
		canDropElement: (
			item: TreeItemState<TFile, TFolder>,
			args: ElementDropTargetGetFeedbackArgs,
		) => boolean;
		canDropExternal: (
			item: TreeItemState<TFile, TFolder>,
			args: ExternalDropTargetGetFeedbackArgs,
		) => boolean;
		onDragStart: (item: TreeItemState<TFile, TFolder>, args: ElementEventBasePayload) => void;
		onDestroyItem: (item: TreeItemState<TFile, TFolder>) => void;
	};

	const CONTEXT_KEY = Symbol("TreeContext");

	export function getTreeContext<
		TFile extends FileNode,
		TFolder extends FolderNode<TFile | TFolder>,
		TTree extends FileTree<TFile | TFolder>,
	>(): TreeContext<TFile, TFolder, TTree> {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <Tree> found");
		}
		return getContext(CONTEXT_KEY);
	}
</script>

<script
	lang="ts"
	generics="TFile extends FileNode = FileNode, TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>, TTree extends FileTree<TFile | TFolder> = FileTree<TFile | TFolder>"
>
	const virtualListContext = getVirtualListContextIfExists<TFile, TFolder>();

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
		ref = $bindable(null),
		isItemDisabled = falsePredicate,
		isItemHidden = falsePredicate,
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
			const node = nodes[index]!;
			const item = new TreeItemState({
				node,
				index,
				parent,
				order: result.length,
				selected: () => selectedIds.has(node.id),
				expanded: () => expandedIds.has(node.id),
				inClipboard: () => clipboardIds.has(node.id),
				disabled: () => parent?.disabled || isItemDisabled(node),
				visible: () => {
					if (parent !== undefined && (!parent.expanded || !parent.visible)) {
						return false;
					}
					return !isItemHidden(node);
				},
			});
			result.push(item);

			if (node.type === "folder") {
				createItems(node.children, item as TreeItemState<TFile, TFolder, TFolder>, result);
			}
		}
		return result;
	});

	if (virtualListContext !== undefined) {
		$effect.pre(() => {
			virtualListContext.setItems(items);
			return () => {
				virtualListContext.setItems([]);
			};
		});
	}

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

	function getNextVisibleItem(
		item: TreeItemState<TFile, TFolder>,
		options: { skipChildren?: boolean } = {},
	) {
		const { skipChildren = false } = options;

		let current: TreeItemState<TFile, TFolder> | undefined;
		if (item.node.type === "folder" && (skipChildren || !item.expanded)) {
			current = items[item.order + item.node.count + 1];
		} else {
			current = items[item.order + 1];
		}

		while (current !== undefined && !current.visible) {
			if (current.node.type === "folder") {
				current = items[current.order + current.node.count + 1];
			} else {
				current = items[current.order + 1];
			}
		}

		return current;
	}

	function getPreviousVisibleItem(item: TreeItemState<TFile, TFolder>) {
		let current = items[item.order - 1];
		while (current !== undefined && !current.visible) {
			current = items[current.order - 1];
		}
		return current;
	}

	function getFirstVisibleItem() {
		let current = items[0];
		if (current !== undefined && !current.visible) {
			current = getNextVisibleItem(current);
		}
		return current;
	}

	function getLastVisibleItem() {
		let current = items[items.length - 1];
		if (current !== undefined && !current.visible) {
			while (current.parent !== undefined && !current.parent.visible) {
				current = current.parent;
			}
			current = getPreviousVisibleItem(current);
		}
		return current;
	}

	let focusItemRequestId: number | undefined;

	function focusItem(item: TreeItemState<TFile, TFolder>) {
		if (focusItemRequestId !== undefined) {
			window.cancelAnimationFrame(focusItemRequestId);
		}

		const element = getItemElement(item.node.id);
		if (element !== null) {
			element.focus();
			return;
		}

		if (virtualListContext !== undefined) {
			virtualListContext.scrollToIndex(item.order);

			let retries = 0;
			focusItemRequestId = window.requestAnimationFrame(function callback() {
				const element = getItemElement(item.node.id);
				if (element !== null) {
					element.focus();
					return;
				}

				if (retries < 1000) {
					retries++;
					focusItemRequestId = window.requestAnimationFrame(callback);
				}
			});
		}
	}

	function selectUntil(item: TreeItemState<TFile, TFolder>) {
		let lastSelected;
		for (const id of selectedIds) {
			const current = getItem(id);
			if (current !== undefined) {
				lastSelected = current;
			}
		}

		if (lastSelected === undefined || !lastSelected.visible) {
			let current: TreeItemState<TFile, TFolder> | undefined = getFirstVisibleItem()!;
			do {
				selectedIds.add(current.node.id);
				if (current.node === item.node) {
					break;
				}
				current = getNextVisibleItem(current);
			} while (current !== undefined);
			return;
		}

		const down = lastSelected.order < item.order;
		let current: TreeItemState<TFile, TFolder> | undefined = lastSelected;
		while (current.node !== item.node) {
			current = down ? getNextVisibleItem(current) : getPreviousVisibleItem(current);
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

		onCopy({ sources, copies, destination });
		return true;
	}

	async function move(movedIds: Set<string>, destination: TFolder | TTree) {
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
				if (movedIds.has(ancestor.node.id)) {
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
		}

		const destinationChildren = destination.children;
		for (const source of sources) {
			destinationChildren.push(source.node);
		}

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
				didPaste = await move(clipboardIds, destination);
				break;
			}
			case undefined: {
				return false;
			}
		}

		if (!didPaste) {
			return false;
		}

		clipboardIds.clear();
		pasteOperation = undefined;
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

		let focusTarget = getNextVisibleItem(item, { skipChildren: true });
		if (focusTarget === undefined) {
			focusTarget = getPreviousVisibleItem(item);
		}

		while (focusTarget !== undefined) {
			// Move to the highest selected ancestor as all its children will be removed.
			for (let ancestor = focusTarget.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (selectedIds.has(ancestor.node.id)) {
					focusTarget = ancestor;
				}
			}

			// Focus the nearest remaining item after this item.
			let nearestUnselected: TreeItemState<TFile, TFolder> | undefined = focusTarget;
			while (nearestUnselected.selected) {
				// The current item will be removed, so we shouldn't traverse its children.
				nearestUnselected = getNextVisibleItem(nearestUnselected, { skipChildren: true });
				if (nearestUnselected === undefined) {
					break;
				}
			}

			if (nearestUnselected === undefined) {
				// Focus the nearest remaining item before this item.
				nearestUnselected = focusTarget;
				while (nearestUnselected.selected) {
					nearestUnselected = getPreviousVisibleItem(nearestUnselected);
					if (nearestUnselected === undefined) {
						break;
					}
				}
			}

			if (focusTarget === nearestUnselected) {
				focusItem(focusTarget);
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
			}
		} else {
			const owner = item.parent?.node ?? root;
			owner.children = owner.children.filter((child) => child !== node);
		}

		for (const item of removed) {
			onRemoveNode(item.node);
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

	const context: TreeContext<TFile, TFolder, TTree> = {
		root: () => root,
		tabbableId: () => tabbableId ?? root.children[0]?.id,
		getItemElementId,
		onFocusIn: (item) => {
			tabbableId = item.node.id;
		},
		onKeyDown: (item, event) => {
			if (event.defaultPrevented || event.target !== event.currentTarget || item.disabled) {
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

					const next = items[item.order + 1];
					if (next !== undefined) {
						focusItem(next);
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
						focusItem(parent);
					}
					break;
				}
				case "ArrowDown":
				case "ArrowUp": {
					const down = event.key === "ArrowDown";
					const next = down ? getNextVisibleItem(item) : getPreviousVisibleItem(item);
					if (next === undefined) {
						break;
					}

					if (event.shiftKey) {
						selectedIds.add(item.node.id).add(next.node.id);
					} else if (!isControlOrMeta(event)) {
						selectedIds.clear();
						selectedIds.add(next.node.id);
					}

					focusItem(next);
					break;
				}
				case "PageDown":
				case "PageUp": {
					const down = event.key === "PageDown";
					const shouldSelectMultiple = event.shiftKey && isControlOrMeta(event);

					const maxScrollDistance = Math.min(
						ref!.clientHeight,
						document.documentElement.clientHeight,
					);
					const itemRect = event.currentTarget.getBoundingClientRect();

					let current = item;
					let currentElement: HTMLElement = event.currentTarget;
					while (true) {
						const next = down ? getNextVisibleItem(current) : getPreviousVisibleItem(current);
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
				case "Home":
				case "End": {
					const down = event.key === "End";
					const last = down ? getLastVisibleItem()! : getFirstVisibleItem()!;
					if (item === last) {
						break;
					}

					if (event.shiftKey && isControlOrMeta(event)) {
						let current: TreeItemState<TFile, TFolder> | undefined = item;
						do {
							selectedIds.add(current.node.id);
							current = down ? getNextVisibleItem(current) : getPreviousVisibleItem(current);
						} while (current !== undefined);
					} else {
						selectedIds.clear();
						selectedIds.add(last.node.id);
					}

					focusItem(last);
					break;
				}
				case " ": {
					if (event.shiftKey) {
						selectUntil(item);
					} else {
						toggleSelection(item);
					}
					break;
				}
				case "Escape": {
					selectedIds.clear();
					clipboardIds.clear();
					pasteOperation = undefined;
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

					let current: TreeItemState<TFile, TFolder> | undefined = getFirstVisibleItem()!;
					do {
						selectedIds.add(current.node.id);
						current = getNextVisibleItem(current);
					} while (current !== undefined);
					break;
				}
				case "c":
				case "x": {
					if (!isControlOrMeta(event)) {
						break;
					}

					clipboardIds.clear();
					for (const id of selectedIds) {
						clipboardIds.add(id);
					}
					clipboardIds.add(item.node.id);

					switch (event.key) {
						case "c": {
							pasteOperation = "copy";
							break;
						}
						case "x": {
							pasteOperation = "cut";
							break;
						}
					}
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
							focusItem(item);
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
			if (event.defaultPrevented || item.disabled) {
				return;
			}

			if (isControlOrMeta(event)) {
				toggleSelection(item);
			} else if (event.shiftKey) {
				selectUntil(item);
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
	};
	setContext(CONTEXT_KEY, context);

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

				const didMove = await move(selectedIds, dropDestination);
				if (didMove) {
					focusItem(source);
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
