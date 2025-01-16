<script lang="ts">
	import { Ref } from "$lib/internal/ref.js";
	import type { FileOrFolder } from "$lib/tree.svelte.js";
	import TreeItemProvider from "./TreeItemProvider.svelte";
	import { type TreeContext, setTreeContext } from "./context.svelte.js";
	import { DraggedState, TabbableState } from "./state.svelte.js";
	import type { TreeProps } from "./types.js";

	const { tree, item, onTreeChange, onTreeChangeError, ...attributes }: TreeProps = $props();
	const treeRef = new Ref(() => tree);

	const lookup = new Map<string, TreeContext.Item>();
	const tabbable = new TabbableState(treeRef);
	const dragged = new DraggedState();

	function onSetItem(item: TreeContext.Item): void {
		lookup.set(item.node.id, item);
	}

	function onDeleteItem(id: string): void {
		tree.selectedIds.delete(id);
		tree.expandedIds.delete(id);
		tree.clipboard.delete(id);
		lookup.delete(id);

		if (tabbable.id === id) {
			tabbable.clear();
		}

		if (dragged.id === id) {
			dragged.clear();
		}
	}

	function getChildren(parent: TreeProps.ItemParent | undefined): FileOrFolder[] {
		if (parent === undefined) {
			return tree.children;
		}
		return parent.node.children;
	}

	function getNextItem({ node, index, parent }: TreeContext.Item): TreeContext.Item | undefined {
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

	function getPreviousItem({
		node,
		index,
		parent,
	}: TreeContext.Item): TreeContext.Item | undefined {
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

		let current: TreeContext.Item | undefined = lastSelected;
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
					conflicting: sibling,
				});
				return false;
			}
		}

		const oldName = node.name;
		node.name = name;
		onTreeChange?.({
			type: "rename",
			node,
			oldName,
			newName: name,
		});
		return true;
	}

	setTreeContext({
		tree: treeRef,
		lookup,
		tabbable,
		dragged,
		getChildren,
		getNextItem,
		getPreviousItem,
		selectUntil,
		renameItem,
	});
</script>

{#snippet items(nodes = tree.children, depth = 0, parent?: TreeProps.ItemParent)}
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
