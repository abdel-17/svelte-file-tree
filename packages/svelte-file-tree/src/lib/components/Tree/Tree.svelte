<script lang="ts">
	import { Ref } from "$lib/internal/ref.js";
	import type { FileOrFolder, FolderNode } from "$lib/tree.svelte.js";
	import { flushSync } from "svelte";
	import TreeItemProvider from "./TreeItemProvider.svelte";
	import { type TreeContext, setTreeContext } from "./context.svelte.js";
	import { DraggedIdState, TabbableIdState } from "./state.svelte.js";
	import type { TreeProps } from "./types.js";

	const { tree, item, onTreeChange, onTreeChangeError, ...attributes }: TreeProps = $props();
	const treeRef = new Ref(() => tree);

	const lookup = new Map<string, TreeProps.Item>();
	const tabbableId = new TabbableIdState(treeRef);
	const draggedId = new DraggedIdState();

	function onSetItem(item: TreeProps.Item): void {
		lookup.set(item.node.id, item);
	}

	function onDeleteItem(id: string): void {
		lookup.delete(id);

		if (tabbableId.current === id) {
			tabbableId.clear();
		}

		if (draggedId.current === id) {
			draggedId.clear();
		}
	}

	function getChildren(item: TreeProps.Item<FolderNode> | undefined): FileOrFolder[] {
		if (item === undefined) {
			return tree.children;
		}
		return item.node.children;
	}

	function getNextItem({ node, index, parent }: TreeProps.Item): TreeProps.Item | undefined {
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

	function getPreviousItem({ node, index, parent }: TreeProps.Item): TreeProps.Item | undefined {
		if (index === 0) {
			return parent;
		}

		index--;
		node = parent === undefined ? tree.children[index] : parent.node.children[index];

		while (node.type === "folder" && node.expanded && node.children.length !== 0) {
			parent = { node, index, parent };
			index = node.children.length - 1;
			node = node.children[index];
		}

		return { node, index, parent };
	}

	function selectUntil({ node, element }: TreeContext.SelectUntilArgs): void {
		let lastSelected: TreeProps.Item | undefined;
		for (const id of tree.selectedIds) {
			const current = lookup.get(id);
			if (current !== undefined) {
				lastSelected = current;
			}
		}

		if (lastSelected === undefined) {
			let current: TreeProps.Item | undefined = {
				node: tree.children[0],
				index: 0,
				parent: undefined,
			};
			do {
				current.node.select();
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

		let current: TreeProps.Item | undefined = lastSelected;
		while (current.node !== node) {
			current = navigate(current);
			if (current === undefined) {
				break;
			}
			current.node.select();
		}
	}

	function renameItem({ node, name, parent }: TreeContext.RenameItemArgs): boolean {
		if (name.length === 0) {
			onTreeChangeError?.({
				type: "rename:empty",
				node,
			});
			return false;
		}

		const siblings = getChildren(parent);
		for (const sibling of siblings) {
			if (sibling !== node && name === sibling.name) {
				onTreeChangeError?.({
					type: "rename:conflict",
					node,
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
			rollback() {
				node.name = oldName;
			},
		});
		return true;
	}

	function dropDragged({
		draggedId,
		node,
		index,
		parent,
		position,
	}: TreeContext.DropDraggedArgs): void {
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

					onDropDragged(dragged, parentChanged);
					onTreeChange?.({
						type: "reorder",
						changes,
						rollback() {
							siblings.splice(newIndex, 1);
							draggedSiblings.splice(dragged.index, 0, dragged.node);

							flushSync();
							dragged.node.element?.focus();
						},
					});
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

					onDropDragged(dragged, parentChanged);
					onTreeChange?.({
						type: "reorder",
						changes,
						rollback() {
							if (newIndex < dragged.index) {
								for (let i = newIndex; i < dragged.index; i++) {
									const current = draggedSiblings[i];
									const next = draggedSiblings[i + 1];
									draggedSiblings[i] = next;
									draggedSiblings[i + 1] = current;
								}
							} else {
								for (let i = newIndex; i > dragged.index; i--) {
									const current = draggedSiblings[i];
									const previous = draggedSiblings[i - 1];
									draggedSiblings[i] = previous;
									draggedSiblings[i - 1] = current;
								}
							}
						},
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

					const newLength = node.children.push(dragged.node);
					const newIndex = newLength - 1;

					changes.push({
						id: draggedId,
						oldParentId: draggedParentId,
						oldIndex: dragged.index,
						newParentId: node.id,
						newIndex,
					});

					onDropDragged(dragged, parentChanged);
					onTreeChange?.({
						type: "reorder",
						changes,
						rollback() {
							node.children.pop();
							draggedSiblings.splice(dragged.index, 0, dragged.node);
						},
					});

					node.expand();
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

					onDropDragged(dragged, parentChanged);
					onTreeChange?.({
						type: "reorder",
						changes,
						rollback() {
							for (let i = lastIndex; i > dragged.index; i--) {
								const current = draggedSiblings[i];
								const previous = draggedSiblings[i - 1];
								draggedSiblings[i] = previous;
								draggedSiblings[i - 1] = current;
							}
						},
					});
				}
				break;
			}
		}
	}

	function onDropDragged(dragged: TreeProps.Item, parentChanged: boolean): void {
		tree.selectedIds.clear();
		dragged.node.select();

		if (parentChanged) {
			flushSync();
			dragged.node.element?.focus();
		}
	}

	setTreeContext({
		tree: treeRef,
		tabbableId,
		draggedId,
		getChildren,
		getNextItem,
		getPreviousItem,
		selectUntil,
		renameItem,
		dropDragged,
	});
</script>

{#snippet items(nodes = tree.children, depth = 0, parent?: TreeProps.Item<FolderNode>)}
	{#each nodes as node, index (node.id)}
		<TreeItemProvider {node} {index} {depth} {parent} {onSetItem} {onDeleteItem}>
			{@render item({ node, index, depth, parent })}
		</TreeItemProvider>

		{#if node.type === "folder" && node.expanded}
			{@render items(node.children, depth + 1, { node, index, parent })}
		{/if}
	{/each}
{/snippet}

<div bind:this={tree._element} {...attributes} role="tree" aria-multiselectable="true">
	{@render items()}
</div>
