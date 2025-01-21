<script lang="ts">
	import { Ref } from "$lib/internal/box.svelte.js";
	import type { FileTree } from "$lib/tree.svelte.js";
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
		onTreeChange,
		onTreeChangeError,
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

		if (focusState.tabbableId === id) {
			focusState.clearTabbable();
		}

		if (dragState.draggedId === id) {
			dragState.clearDragged();
		}
	}

	function getChildren(item: TreeContext.ParentItem | undefined) {
		if (item === undefined) {
			return tree.children;
		}
		return item.node.children;
	}

	function getNextItem(item: TreeContext.Item) {
		let { node, index, parent } = item;
		if (node.type === "folder" && node.expanded && node.children.length !== 0) {
			return {
				node: node.children[0],
				index: 0,
				parent: { node, index, parent },
			};
		}

		while (true) {
			const siblings = getChildren(parent);
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

			node = parent.node;
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
		node = getChildren(parent)[index];

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
			const current = lookup.get(id);
			if (current !== undefined) {
				lastSelected = current;
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
		name: string,
		parent: TreeContext.ParentItem | undefined,
	) {
		if (name === node.name) {
			return true;
		}

		if (name.length === 0) {
			onTreeChangeError?.({
				type: "rename:empty",
			});
			return false;
		}

		const siblings = getChildren(parent);
		for (const sibling of siblings) {
			if (sibling !== node && name === sibling.name) {
				onTreeChangeError?.({
					type: "rename:conflict",
					name,
				});
				return false;
			}
		}

		const oldName = node.name;
		node.name = name;
		onTreeChange?.({
			type: "rename",
			change: {
				id: node.id,
				oldName,
				newName: name,
			},
		});
		return true;
	}

	function dropDragged(
		draggedId: string,
		node: FileTree.Node,
		index: number,
		parent: TreeContext.ParentItem | undefined,
		position: TreeItemProps.DropPosition,
	) {
		const dragged = lookup.get(draggedId);
		if (dragged === undefined) {
			return;
		}

		const draggedParentId = dragged.parent?.node.id;
		const draggedSiblings = getChildren(dragged.parent);

		const changes: TreeProps.ReorderChange[] = [];
		let parentChanged: boolean;
		switch (position) {
			case "before":
			case "after": {
				const parentId = parent?.node.id;
				parentChanged = draggedParentId !== parentId;
				if (parentChanged) {
					draggedSiblings.splice(dragged.index, 1);

					for (let i = dragged.index; i < draggedSiblings.length; i++) {
						changes.push({
							id: draggedSiblings[i].id,
							oldParentId: draggedParentId,
							oldIndex: i + 1,
							newParentId: draggedParentId,
							newIndex: i,
						});
					}

					const siblings = getChildren(parent);
					const newIndex = position === "before" ? index : index + 1;
					siblings.splice(newIndex, 0, dragged.node);

					changes.push({
						id: draggedId,
						oldParentId: draggedParentId,
						oldIndex: dragged.index,
						newParentId: parentId,
						newIndex,
					});

					for (let i = newIndex + 1; i < siblings.length; i++) {
						changes.push({
							id: siblings[i].id,
							oldParentId: parentId,
							oldIndex: i - 1,
							newParentId: parentId,
							newIndex: i,
						});
					}
				} else {
					// It's more efficient to reorder the items in-place.
					let newIndex: number;
					if (dragged.index < index) {
						//      d         z
						// 1    2 <> 3    4    5
						// 1    3    2 <> 4    5
						// 1    3    4    2    5
						newIndex = position === "before" ? index - 1 : index;
						for (let i = dragged.index; i < newIndex; i++) {
							const current = draggedSiblings[i];
							const next = draggedSiblings[i + 1];
							draggedSiblings[i] = next;
							draggedSiblings[i + 1] = current;

							changes.push({
								id: next.id,
								oldParentId: draggedParentId,
								oldIndex: i + 1,
								newParentId: draggedParentId,
								newIndex: i,
							});
						}
					} else {
						//      z         d
						// 1    2    3 <> 4    5
						// 1    2 <> 4    3    5
						// 1    4    2    3    5
						newIndex = position === "before" ? index : index + 1;
						for (let i = dragged.index; i > newIndex; i--) {
							const current = draggedSiblings[i];
							const previous = draggedSiblings[i - 1];
							draggedSiblings[i] = previous;
							draggedSiblings[i - 1] = current;

							changes.push({
								id: previous.id,
								oldParentId: draggedParentId,
								oldIndex: i - 1,
								newParentId: draggedParentId,
								newIndex: i,
							});
						}
					}

					if (newIndex === dragged.index) {
						return;
					}

					changes.push({
						id: draggedId,
						oldParentId: draggedParentId,
						oldIndex: dragged.index,
						newParentId: draggedParentId,
						newIndex,
					});
				}
				break;
			}
			case "inside": {
				if (node.type === "file") {
					throw new Error("Cannot drop an item inside a file");
				}

				parentChanged = draggedParentId !== node.id;
				if (parentChanged) {
					draggedSiblings.splice(dragged.index, 1);

					for (let i = dragged.index; i < draggedSiblings.length; i++) {
						changes.push({
							id: draggedSiblings[i].id,
							oldParentId: draggedParentId,
							oldIndex: i + 1,
							newParentId: draggedParentId,
							newIndex: i,
						});
					}

					tree.expand(node);
					const newLength = node.children.push(dragged.node);
					const newIndex = newLength - 1;

					changes.push({
						id: draggedId,
						oldParentId: draggedParentId,
						oldIndex: dragged.index,
						newParentId: node.id,
						newIndex,
					});
				} else {
					const lastIndex = draggedSiblings.length - 1;
					if (dragged.index === lastIndex) {
						return;
					}

					// It's more efficient to reorder the items in-place.
					for (let i = dragged.index; i < lastIndex; i++) {
						const current = draggedSiblings[i];
						const next = draggedSiblings[i + 1];
						draggedSiblings[i] = next;
						draggedSiblings[i + 1] = current;

						changes.push({
							id: next.id,
							oldParentId: draggedParentId,
							oldIndex: i + 1,
							newParentId: draggedParentId,
							newIndex: i,
						});
					}

					changes.push({
						id: draggedId,
						oldParentId: draggedParentId,
						oldIndex: dragged.index,
						newParentId: draggedParentId,
						newIndex: lastIndex,
					});
				}
				break;
			}
		}

		tree.selectedIds.clear();
		tree.selectedIds.add(draggedId);

		if (parentChanged) {
			flushSync();
			dragged.node.element?.focus();
		}

		onTreeChange?.({
			type: "reorder",
			changes,
		});
	}

	TreeContext.set({
		tree: treeRef,
		treeElement: treeElementRef,
		clipboardState,
		focusState,
		dragState,
		getChildren,
		getNextItem,
		getPreviousItem,
		selectUntil,
		renameItem,
		dropDragged,
	});
</script>

{#snippet items(nodes = tree.children, depth = 0, parent?: TreeContext.ParentItem)}
	{#each nodes as node, index (node.id)}
		<TreeItemProvider {node} {index} {depth} {parent} {onSetItem} {onDeleteItem}>
			{@render item(node, index, depth)}
		</TreeItemProvider>

		{#if node.type === "folder" && node.expanded}
			{@render items(node.children, depth + 1, { node, index, parent })}
		{/if}
	{/each}
{/snippet}

<div bind:this={treeElement} {...attributes} role="tree" aria-multiselectable="true">
	{@render items()}
</div>
