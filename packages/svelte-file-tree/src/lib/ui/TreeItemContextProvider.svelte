<script lang="ts" module>
	const contextKey = Symbol("TreeItemContext");

	export type TreeItemContext = {
		readonly treeState: TreeState;
		readonly itemState: TreeItemState;
	};

	export function getTreeItemContext() {
		const context: TreeItemContext = getContext(contextKey);
		if (context === undefined) {
			throw new Error("No parent <Tree> found");
		}
		return context;
	}

	function setTreeItemContext(context: TreeItemContext) {
		setContext(contextKey, context);
	}
</script>

<script lang="ts">
	import { FileTreeNode } from "$lib/data/tree.svelte.js";
	import { getContext, setContext, type Snippet } from "svelte";
	import { TreeItemState, TreeState } from "./state.svelte.js";

	type Props = {
		treeState: TreeState;
		node: FileTreeNode;
		index: number;
		children: Snippet;
	};

	const { treeState, node, index, children }: Props = $props();

	const itemState = new TreeItemState(
		treeState,
		() => node,
		() => index,
	);
	setTreeItemContext({ treeState, itemState });

	$effect(() => {
		treeState.items.set(node.id, { node, index });
	});

	$effect(() => {
		return () => {
			const { id } = node;
			treeState.items.delete(id);

			if (treeState.tabbableId === id) {
				treeState.tabbableId = undefined;
			}

			if (treeState.draggedId === id) {
				treeState.draggedId = undefined;
			}
		};
	});
</script>

{@render children()}
