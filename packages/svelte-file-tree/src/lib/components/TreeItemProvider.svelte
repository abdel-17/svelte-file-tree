<script lang="ts" module>
	import type { FileTreeNode } from "$lib/tree.svelte.js";
	import { getContext, setContext, type Snippet } from "svelte";
	import type { TreeState } from "./Tree.svelte";

	const contextKey = Symbol("TreeItemProviderContext");

	export type TreeItemProviderContext = {
		readonly treeState: TreeState;
		readonly getNode: () => FileTreeNode;
		readonly getIndex: () => number;
	};

	export function getTreeItemProviderContext(): TreeItemProviderContext {
		const context: TreeItemProviderContext | undefined = getContext(contextKey);
		if (context === undefined) {
			throw new Error("No parent <Tree> found");
		}
		return context;
	}
</script>

<script lang="ts">
	type Props = {
		treeState: TreeState;
		node: FileTreeNode;
		index: number;
		children: Snippet;
	};

	const { treeState, node, index, children }: Props = $props();

	const context: TreeItemProviderContext = {
		treeState,
		getNode: () => node,
		getIndex: () => index,
	};
	setContext(contextKey, context);

	$effect(() => {
		treeState.onSetItem({ node, index });
	});

	$effect(() => {
		return () => {
			treeState.onDestroyItem(node.id);
		};
	});
</script>

{@render children()}
