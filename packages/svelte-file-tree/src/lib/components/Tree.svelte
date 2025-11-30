<script lang="ts" module>
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { falsePredicate, noop, truePredicate } from "$lib/internal/helpers.js";
	import {
		FileNode,
		FolderNode,
		TreeItemState,
		type DefaultTFolder,
		type FileTree,
	} from "$lib/tree.svelte.js";
	import { getVirtualListContextIfExists } from "./VirtualList.svelte";
	import type {
		OnCircularReferenceArgs,
		PasteOperation,
		TreeProps,
		TreeRemoveMethodOptions,
	} from "./types.js";

	export type TreeContext<TFile extends FileNode, TFolder extends FolderNode<TFile | TFolder>> = {
		getRoot: () => FileTree<TFile | TFolder>;
		getSelectedIds: () => SvelteSet<string>;
		getExpandedIds: () => SvelteSet<string>;
		getClipboardIds: () => SvelteSet<string>;
		getPasteOperation: () => PasteOperation | undefined;
		setPasteOperation: (value: PasteOperation | undefined) => void;
		getTabbableId: () => string | undefined;
		setTabbableId: (value: string | undefined) => void;
		getRef: () => HTMLDivElement | null;
		getVisibleItems: () => Array<TreeItemState<TFile, TFolder>>;
		getItemElementId: (itemId: string) => string;
		getItemElement: (itemId: string) => HTMLElement | null;
		focusItem: (order: number) => void;
		selectUntil: (order: number) => void;
		toggleSelection: (item: TreeItemState<TFile, TFolder>) => void;
		paste: (destination?: TreeItemState<TFile, TFolder>) => Promise<boolean>;
		remove: (order: number, options?: TreeRemoveMethodOptions) => Promise<boolean>;
		onCircularReference: (args: OnCircularReferenceArgs<TFile, TFolder>) => void;
	};

	const CONTEXT_KEY = Symbol("TreeContext");

	export function getTreeContext<
		TFile extends FileNode,
		TFolder extends FolderNode<TFile | TFolder>,
	>(): TreeContext<TFile, TFolder> {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <Tree> found");
		}
		return getContext(CONTEXT_KEY);
	}
</script>

<script
	lang="ts"
	generics="TFile extends FileNode = FileNode, TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>"
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
		shouldClearClipboard = (operation) => operation === "cut",
		onResolveNameConflict = () => "cancel",
		onCircularReference = noop,
		canCopy = truePredicate,
		onCopy = noop,
		canMove = truePredicate,
		onMove = noop,
		canRemove = truePredicate,
		onRemove = noop,
		...rest
	}: TreeProps<TFile, TFolder> = $props();

	const uid = $props.id();
	let tabbableId: string | undefined = $state.raw();

	const items = $derived.by(function createItems(
		nodes = root.children,
		parent?: TreeItemState<TFile, TFolder, TFolder>,
		result: Array<TreeItemState<TFile, TFolder>> = [],
	) {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i]!;
			const item = new TreeItemState({
				node,
				nodeIndex: i,
				index: result.length,
				parent,
				selected: () => selectedIds.has(node.id),
				expanded: () => {
					if (parent !== undefined && !parent.expanded) {
						return false;
					}
					return expandedIds.has(node.id);
				},
				inClipboard: () => clipboardIds.has(node.id),
				disabled: () => parent?.disabled || isItemDisabled(node),
				visible: () => (parent === undefined || parent.expanded) && !isItemHidden(node),
			});
			result.push(item);

			if (node.type === "folder") {
				createItems(node.children, item as TreeItemState<TFile, TFolder, TFolder>, result);
			}
		}
		return result;
	});

	const visibleItems = $derived(items.filter((item) => item.visible));

	const lookup = $derived.by(() => {
		const result = new Map<string, TreeItemState<TFile, TFolder>>();
		for (const item of items) {
			result.set(item.node.id, item);
		}
		return result;
	});

	if (virtualListContext !== undefined) {
		$effect.pre(() => {
			virtualListContext.setVisibleItems(visibleItems);
			return () => {
				virtualListContext.setVisibleItems([]);
			};
		});
	}

	export function getItems() {
		return items;
	}

	export function getVisibleItems() {
		return visibleItems;
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

	let focusItemRequestId: number | undefined;

	export function focusItem(order: number) {
		if (order < 0 || order >= visibleItems.length) {
			if (DEV) {
				throw new Error(`Item ${order} is out of range`);
			}
			return;
		}

		if (focusItemRequestId !== undefined) {
			window.cancelAnimationFrame(focusItemRequestId);
		}

		const item = visibleItems[order]!;
		const element = getItemElement(item.node.id);
		if (element !== null) {
			element.focus();
			return;
		}

		if (virtualListContext !== undefined) {
			virtualListContext.scrollToIndex(order);

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

	function selectUntil(order: number) {
		if (order < 0 || order >= visibleItems.length) {
			if (DEV) {
				throw new Error(`Item ${order} is out of range`);
			}
			return;
		}

		let lastSelected;
		for (const id of selectedIds) {
			const current = getItem(id);
			if (current !== undefined) {
				lastSelected = current;
			}
		}

		if (lastSelected === undefined || !lastSelected.visible) {
			for (let i = 0; i <= order; i++) {
				selectedIds.add(visibleItems[i]!.node.id);
			}
			return;
		}

		const lastSelectedOrder = visibleItems.indexOf(lastSelected);
		let start, lower, upper, offset;
		if (lastSelectedOrder < order) {
			start = lastSelectedOrder + 1;
			lower = start;
			upper = order;
			offset = 1;
		} else if (lastSelectedOrder > order) {
			start = lastSelectedOrder - 1;
			lower = order;
			upper = start;
			offset = -1;
		} else {
			return;
		}

		for (let i = start; lower <= i && i <= upper; i += offset) {
			selectedIds.add(visibleItems[i]!.node.id);
		}
	}

	function toggleSelection(item: TreeItemState<TFile, TFolder>) {
		if (item.selected) {
			selectedIds.delete(item.node.id);
		} else {
			selectedIds.add(item.node.id);
		}
	}

	function isValidDestination(
		destination: TreeItemState<TFile, TFolder> | undefined,
	): destination is TreeItemState<TFile, TFolder, TFolder> | undefined {
		return destination === undefined || destination.node.type === "folder";
	}

	async function copy(destination?: TreeItemState<TFile, TFolder>) {
		if (!isValidDestination(destination)) {
			if (DEV) {
				throw new Error("Destination cannot be a file");
			}
			return false;
		}

		const destinationChildren = destination?.node.children ?? root.children;
		const uniqueNames = new Set<string>();
		for (const child of destinationChildren) {
			uniqueNames.add(child.name);
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
			if (uniqueNames.has(name)) {
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
					case "allow": {
						break;
					}
				}
			}

			uniqueNames.add(name);
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

		destinationChildren.push(...copies);
		onCopy({ sources, copies, destination });
		return true;
	}

	export async function move(movedIds: Set<string>, destination?: TreeItemState<TFile, TFolder>) {
		if (!isValidDestination(destination)) {
			if (DEV) {
				throw new Error("Destination cannot be a file");
			}
			return false;
		}

		for (let current = destination; current !== undefined; current = current.parent) {
			if (movedIds.has(current.node.id)) {
				return false;
			}
		}

		const destinationChildren = destination?.node.children ?? root.children;
		const uniqueNames = new Set<string>();
		for (const child of destinationChildren) {
			uniqueNames.add(child.name);
		}

		const sources: Array<TreeItemState<TFile, TFolder>> = [];
		const sourceIds = new Set<string>();
		const sourceParents = new Set<TreeItemState<TFile, TFolder, TFolder> | undefined>();
		outer: for (const id of movedIds) {
			const current = getItem(id);
			if (current === undefined) {
				continue;
			}

			if (current.parent === destination) {
				continue;
			}

			for (let ancestor = current.parent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (movedIds.has(ancestor.node.id)) {
					// If an ancestor is moved, its children are moved along with it.
					continue outer;
				}
			}

			const name = current.node.name;
			if (uniqueNames.has(name)) {
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
					case "allow": {
						break;
					}
				}
			}

			uniqueNames.add(name);
			sources.push(current);
			sourceIds.add(current.node.id);
			sourceParents.add(current.parent);
		}

		if (sources.length === 0) {
			return true;
		}

		const canMoveResult = await canMove({ sources, destination });
		if (!canMoveResult) {
			return false;
		}

		for (const parent of sourceParents) {
			const owner = parent?.node ?? root;
			owner.children = owner.children.filter((child) => !sourceIds.has(child.id));
		}

		for (const source of sources) {
			destinationChildren.push(source.node);
		}

		onMove({ sources, destination });
		return true;
	}

	export async function paste(destination?: TreeItemState<TFile, TFolder>) {
		if (pasteOperation === undefined) {
			return false;
		}

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
		}

		if (!didPaste) {
			return false;
		}

		if (shouldClearClipboard(pasteOperation)) {
			clipboardIds.clear();
			pasteOperation = undefined;
		}

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

	export async function remove(order: number, options: TreeRemoveMethodOptions = {}) {
		const { batched = true } = options;

		if (order < 0 || order >= visibleItems.length) {
			if (DEV) {
				throw new Error(`Item ${order} is out of range`);
			}
			return false;
		}

		const removed: Array<TreeItemState<TFile, TFolder>> = [];
		const removedParents = new Set<TreeItemState<TFile, TFolder, TFolder> | undefined>();
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
				removedParents.add(current.parent);
			}
		}

		const item = visibleItems[order]!;
		if (!removed.includes(item)) {
			removed.push(item);
			removedParents.add(item.parent);
		}

		const canRemoveResult = await canRemove({ removed });
		if (!canRemoveResult) {
			return false;
		}

		if (batched) {
			let focusTargetId: string | undefined;
			for (let i = order; ; ) {
				let nearestRemaining;

				// Find the nearest remaining item after.
				for (let j = i; ; ) {
					const current = visibleItems[j]!;

					// Because the current item will be removed, its children will also be removed.
					let nextNonChild;
					let nextNonChildOrder = -1;
					for (let k = j + 1; k < visibleItems.length; k++) {
						const next = visibleItems[k]!;
						if (next.depth <= current.depth) {
							nextNonChild = next;
							nextNonChildOrder = k;
							break;
						}
					}

					if (nextNonChild === undefined) {
						break;
					}

					if (nextNonChild.node.id !== item.node.id && !nextNonChild.selected) {
						nearestRemaining = nextNonChild;
						break;
					}

					j = nextNonChildOrder;
				}

				if (nearestRemaining === undefined) {
					// Find the nearest remaining item before.
					for (let j = i - 1; j >= 0; j--) {
						const current = visibleItems[j]!;
						if (current.node.id !== item.node.id && !current.selected) {
							nearestRemaining = current;
							break;
						}
					}
				}

				if (nearestRemaining === undefined) {
					break;
				}

				// If an ancestor is removed, all its children will also be removed.
				let highestRemovedAncestor;
				for (
					let ancestor = nearestRemaining.parent;
					ancestor !== undefined;
					ancestor = ancestor.parent
				) {
					if (ancestor.node.id === item.node.id || ancestor.selected) {
						highestRemovedAncestor = ancestor;
					}
				}

				if (highestRemovedAncestor === undefined) {
					focusTargetId = nearestRemaining.node.id;
					break;
				}

				if (!highestRemovedAncestor.visible) {
					break;
				}

				i = visibleItems.indexOf(highestRemovedAncestor);
			}

			for (const parent of removedParents) {
				const owner = parent?.node ?? root;
				owner.children = owner.children.filter(
					(child) => !selectedIds.has(child.id) && child !== item.node,
				);
			}

			if (focusTargetId !== undefined) {
				const focusTargetOrder = visibleItems.findIndex((item) => item.node.id === focusTargetId);
				if (focusTargetOrder !== -1) {
					focusItem(focusTargetOrder);
				}
			}
		} else {
			let focusTargetOrder = order;
			if (focusTargetOrder === visibleItems.length - 1) {
				focusTargetOrder--;
			}

			const owner = item.parent?.node ?? root;
			owner.children = owner.children.filter((child) => child !== item.node);

			if (focusTargetOrder >= 0) {
				focusItem(focusTargetOrder);
			}
		}

		for (const item of removed) {
			onRemoveNode(item.node);
		}

		onRemove({ removed });
		return true;
	}

	const context: TreeContext<TFile, TFolder> = {
		getRoot: () => root,
		getSelectedIds: () => selectedIds,
		getExpandedIds: () => expandedIds,
		getClipboardIds: () => clipboardIds,
		getPasteOperation: () => pasteOperation,
		setPasteOperation: (value) => {
			pasteOperation = value;
		},
		getRef: () => ref,
		getTabbableId: () => tabbableId,
		setTabbableId: (value) => {
			tabbableId = value;
		},
		getVisibleItems,
		getItemElementId,
		getItemElement,
		focusItem,
		selectUntil,
		toggleSelection,
		paste,
		remove,
		onCircularReference: (args) => onCircularReference(args),
	};
	setContext(CONTEXT_KEY, context);
</script>

<div {...rest} bind:this={ref} role="tree" aria-multiselectable="true">
	{@render children({ items, visibleItems })}
</div>
