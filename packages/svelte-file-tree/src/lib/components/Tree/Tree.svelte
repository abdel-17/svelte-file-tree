<script lang="ts">
	import { Ref } from "$lib/internal/box.svelte.js";
	import type { FileTree, FolderNode } from "$lib/tree.svelte.js";
	import { DEV } from "esm-env";
	import { flushSync } from "svelte";
	import type { TreeItemProps } from "../TreeItem/types.js";
	import TreeItemProvider from "./TreeItemProvider.svelte";
	import { TreeContext } from "./context.js";
	import { ClipboardState, DragState, FocusState } from "./state.svelte.js";
	import type { TreeProps } from "./types.js";

	let {
		tree,
		item,
		element: treeElement = $bindable(null),
		onRenameItem,
		onRenameItemError,
		onReorderItems,
		onReorderItemsError,
		onDeleteItems,
		...attributes
	}: TreeProps = $props();

	const treeRef = new Ref(() => tree);
	const treeElementRef = new Ref(() => treeElement);

	const lookup = new Map<string, TreeContext.Item>();
	const clipboardState = new ClipboardState();
	const focusState = new FocusState(treeRef);
	const dragState = new DragState();

	function onSetItem(item: TreeContext.Item) {
		lookup.set(item.node.id, item);
	}

	function onDeleteItem(id: string) {
		lookup.delete(id);
		clipboardState.delete(id);

		if (focusState.tabbableId === id) {
			focusState.clearTabbable();
		}

		if (dragState.draggedId === id) {
			dragState.clearDragged();
		}
	}

	function getNextItem(item: TreeContext.Item) {
		const { node } = item;
		if (node.type === "folder" && node.expanded && node.children.length !== 0) {
			return {
				node: node.children[0],
				index: 0,
				parent: item as TreeContext.ParentItem,
			};
		}
		return getNextNonChildItem(item);
	}

	function getNextNonChildItem(item: TreeContext.Item) {
		let { index, parent } = item;
		while (true) {
			const siblings = parent?.node.children ?? tree.children;
			if (index !== siblings.length - 1) {
				return {
					node: siblings[index + 1],
					index: index + 1,
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

	function getPreviousItem(item: TreeContext.Item) {
		let { node, index, parent } = item;
		if (index === 0) {
			return parent;
		}

		index--;
		node = parent?.node.children[index] ?? tree.children[index];

		while (node.type === "folder" && node.expanded && node.children.length !== 0) {
			parent = { node, index, parent };
			index = node.children.length - 1;
			node = node.children[index];
		}

		return { node, index, parent };
	}

	function selectUntil(node: FileTree.Node, element: HTMLElement) {
		let lastSelected: TreeContext.Item | undefined;
		for (const id of tree.selectedIds) {
			const selected = lookup.get(id);
			if (selected !== undefined) {
				lastSelected = selected;
			}
		}

		if (lastSelected === undefined) {
			let current: TreeContext.Item | undefined = {
				node: tree.children[0],
				index: 0,
				parent: undefined,
			};
			do {
				tree.select(current.node);
				if (current.node === node) {
					break;
				}
				current = getNextItem(current);
			} while (current !== undefined);
			return;
		}

		if (lastSelected.node.element === null) {
			return;
		}

		const positionBitmask = lastSelected.node.element.compareDocumentPosition(element);
		const following = positionBitmask & Node.DOCUMENT_POSITION_FOLLOWING;
		const navigate = following ? getNextItem : getPreviousItem;

		let current: TreeContext.Item | undefined = lastSelected;
		while (current.node !== node) {
			current = navigate(current);
			if (current === undefined) {
				break;
			}
			tree.select(current.node);
		}
	}

	function renameItem(
		node: FileTree.Node,
		parent: TreeContext.ParentItem | undefined,
		name: string,
	) {
		if (name === node.name) {
			return true;
		}

		if (name.length === 0) {
			onRenameItemError?.({
				reason: "empty",
				node,
				name,
			});
			return false;
		}

		const siblings = parent?.node.children ?? tree.children;
		for (const sibling of siblings) {
			if (sibling !== node && name === sibling.name) {
				onRenameItemError?.({
					reason: "conflict",
					node,
					name,
				});
				return false;
			}
		}

		const oldName = node.name;
		node.name = name;
		onRenameItem?.({
			node,
			oldName,
			newName: name,
		});
		return true;
	}

	function deleteSelected(
		node: FileTree.Node,
		index: number,
		parent: TreeContext.ParentItem | undefined,
	) {
		if (tree.selectedIds.size === 0) {
			return;
		}

		let focusTarget: TreeContext.Item | undefined = { node, index, parent };
		do {
			// Move to the first selected ancestor as all its children will be deleted.
			for (
				let ancestor: TreeContext.ParentItem | undefined = focusTarget.parent;
				ancestor !== undefined;
				ancestor = ancestor.parent
			) {
				if (ancestor.node.selected) {
					focusTarget = ancestor;
				}
			}

			// Focus the nearest remaining item after this item.
			let nearestUnselected: TreeContext.Item | undefined = focusTarget;
			while (nearestUnselected?.node.selected) {
				// The current item will be deleted, so we shouldn't traverse its children.
				nearestUnselected = getNextNonChildItem(nearestUnselected);
			}

			if (nearestUnselected === undefined) {
				// Focus the nearest remaining item before this item.
				nearestUnselected = focusTarget;
				while (nearestUnselected?.node.selected) {
					nearestUnselected = getPreviousItem(nearestUnselected);
				}
			}

			if (focusTarget === nearestUnselected) {
				focusTarget.node.element?.focus();
				break;
			}

			focusTarget = nearestUnselected;
		} while (focusTarget !== undefined);

		const deleted: Array<FileTree.Node> = [];
		const parentsOfDeleted: Array<TreeContext.ParentItem | undefined> = [];
		outer: for (const id of tree.selectedIds) {
			const selected = lookup.get(id);
			if (selected === undefined) {
				continue;
			}

			const selectedParent = selected.parent;
			for (let ancestor = selectedParent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (ancestor.node.selected) {
					// If one of this item's ancestors is selected, it will be deleted
					// when the ancestor is deleted, so we don't need to delete it.
					continue outer;
				}
			}

			deleted.push(selected.node);

			if (!parentsOfDeleted.includes(selectedParent)) {
				parentsOfDeleted.push(selectedParent);
			}
		}

		if (deleted.length === 0) {
			return;
		}

		const reorders: Array<TreeProps.InPlaceReorder> = [];
		for (const parent of parentsOfDeleted) {
			const parentOrTree = parent?.node ?? tree;
			const remaining: Array<FileTree.Node> = [];
			for (let i = 0, children = parentOrTree.children; i < children.length; i++) {
				const child = children[i];
				if (child.selected) {
					continue;
				}

				const newIndex = remaining.push(child) - 1;
				if (i !== newIndex) {
					reorders.push({
						node: child,
						oldIndex: i,
						newIndex,
					});
				}
			}
			parentOrTree.children = remaining;
		}

		onDeleteItems?.({ deleted, reorders });
	}

	function dropSelected(
		node: FileTree.Node,
		parent: TreeContext.ParentItem | undefined,
		position: TreeItemProps.DropPosition,
	) {
		if (node.selected) {
			if (DEV) {
				throw new Error("Cannot drop a selected item onto itself");
			}
			return;
		}

		for (let ancestor = parent; ancestor !== undefined; ancestor = ancestor.parent) {
			if (ancestor.node.selected) {
				// Don't drop a selected item into one of its children.
				onReorderItemsError?.({
					reason: "circular-reference",
					node: ancestor.node,
				});
				return;
			}
		}

		const dropped: Array<TreeContext.Item> = [];
		const parentsOfDropped: Array<TreeContext.ParentItem | undefined> = [];
		outer: for (const id of tree.selectedIds) {
			const selected = lookup.get(id);
			if (selected === undefined) {
				continue;
			}

			const selectedParent = selected.parent;
			for (let ancestor = selectedParent; ancestor !== undefined; ancestor = ancestor.parent) {
				if (ancestor.node.selected) {
					// Only drop the top-level selected items to avoid changing the hierarchy.
					continue outer;
				}
			}

			dropped.push(selected);

			if (!parentsOfDropped.includes(selectedParent)) {
				parentsOfDropped.push(selectedParent);
			}
		}

		if (dropped.length === 0) {
			return;
		}

		let newParent: FolderNode | undefined;
		switch (position) {
			case "before":
			case "after": {
				newParent = parent?.node;
				break;
			}
			case "inside": {
				if (node.type === "file") {
					if (DEV) {
						throw new Error("Cannot drop selected items inside a file");
					}
					return;
				}

				newParent = node;
				break;
			}
		}

		const reorders: Array<TreeProps.Reorder> = [];
		for (const parent of parentsOfDropped) {
			const parentNode = parent?.node;
			if (parentNode === newParent) {
				// This case is handled separately below.
				continue;
			}

			const parentOrTree = parentNode ?? tree;
			const remaining: Array<FileTree.Node> = [];
			for (let i = 0, children = parentOrTree.children; i < children.length; i++) {
				const child = children[i];
				if (child.selected) {
					continue;
				}

				const newIndex = remaining.push(child) - 1;
				if (i !== newIndex) {
					reorders.push({
						node: child,
						oldParent: parentNode,
						oldIndex: i,
						newIndex,
						newParent: parentNode,
					});
				}
			}
			parentOrTree.children = remaining;
		}

		switch (position) {
			case "before":
			case "after": {
				const newParentOrTree = newParent ?? tree;
				const newChildren: Array<FileTree.Node> = [];
				for (let i = 0, children = newParentOrTree.children; i < children.length; i++) {
					const child = children[i];
					if (child.selected) {
						continue;
					}

					if (child !== node) {
						const newIndex = newChildren.push(child) - 1;
						if (i !== newIndex) {
							reorders.push({
								node: child,
								oldParent: newParent,
								oldIndex: i,
								newIndex,
								newParent,
							});
						}
						continue;
					}

					if (position === "after") {
						const newIndex = newChildren.push(child) - 1;
						if (i !== newIndex) {
							reorders.push({
								node: child,
								oldParent: newParent,
								oldIndex: i,
								newIndex,
								newParent,
							});
						}
					}

					for (const item of dropped) {
						const oldParent = item.parent?.node;
						const oldIndex = item.index;
						const newIndex = newChildren.push(item.node) - 1;
						if (oldParent !== newParent || oldIndex !== newIndex) {
							reorders.push({
								node: item.node,
								oldParent,
								oldIndex,
								newIndex,
								newParent,
							});
						}
					}

					if (position === "before") {
						const newIndex = newChildren.push(child) - 1;
						if (i !== newIndex) {
							reorders.push({
								node: child,
								oldParent: newParent,
								oldIndex: i,
								newIndex,
								newParent,
							});
						}
					}
				}
				newParentOrTree.children = newChildren;
				break;
			}
			case "inside": {
				const newChildren: Array<FileTree.Node> = [];
				for (let i = 0, children = newParent!.children; i < children.length; i++) {
					const child = children[i];
					if (child.selected) {
						continue;
					}

					const newIndex = newChildren.push(child) - 1;
					if (i !== newIndex) {
						reorders.push({
							node: child,
							oldParent: newParent,
							oldIndex: i,
							newIndex,
							newParent,
						});
					}
				}

				for (const item of dropped) {
					const oldParent = item.parent?.node;
					const oldIndex = item.index;
					const newIndex = newChildren.push(item.node) - 1;
					if (oldParent !== newParent || oldIndex !== newIndex) {
						reorders.push({
							node: item.node,
							oldParent,
							oldIndex,
							newIndex,
							newParent,
						});
					}
				}

				newParent!.children = newChildren;
				tree.expand(newParent!);
				break;
			}
		}

		// Select only the dropped items to move the user's focus to them.
		tree.selectedIds.clear();
		for (const item of dropped) {
			tree.selectedIds.add(item.node.id);
		}

		// Focus the last dropped item.
		const lastDropped = dropped[dropped.length - 1];
		if (lastDropped.parent?.node !== newParent) {
			// The parent changed, so the element will be removed from the
			// DOM temporarily. We need to focus it *after* it's reinserted.
			flushSync();
		}
		lastDropped.node.element?.focus();

		onReorderItems?.({ reorders });
	}

	TreeContext.set({
		tree: treeRef,
		treeElement: treeElementRef,
		clipboardState,
		focusState,
		dragState,
		getNextItem,
		getPreviousItem,
		selectUntil,
		renameItem,
		deleteSelected,
		dropSelected,
	});
</script>

{#snippet items(nodes = tree.children, depth = 0, parent?: TreeContext.ParentItem)}
	{#each nodes as node, index (node.id)}
		<TreeItemProvider {node} {index} {depth} {parent} {onSetItem} {onDeleteItem}>
			{@render item({ node, index, depth })}
		</TreeItemProvider>

		{#if node.type === "folder" && node.expanded}
			{@render items(node.children, depth + 1, { node, index, parent })}
		{/if}
	{/each}
{/snippet}

<div bind:this={treeElement} {...attributes} role="tree" aria-multiselectable="true">
	{@render items()}
</div>
