<script lang="ts" module>
	import type { FileNode, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext, type Snippet } from "svelte";
	import type { TreeState } from "./state.svelte.js";
	import type { TreeItemState } from "./types.js";

	const CONTEXT_KEY = Symbol("TreeItemProvider");

	export type TreeItemProviderContext<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = {
		treeState: TreeState<TNode>;
		item: () => TreeItemState<TNode>;
	};

	export function getTreeItemProviderContext(): TreeItemProviderContext {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <Tree> found");
		}

		return getContext(CONTEXT_KEY);
	}
</script>

<script lang="ts" generics="TNode extends FileNode | FolderNode<TNode> = FileTreeNode">
	const {
		treeState,
		item,
		children,
	}: {
		treeState: TreeState<TNode>;
		item: TreeItemState<TNode>;
		children: Snippet;
	} = $props();

	const context: TreeItemProviderContext<TNode> = {
		treeState,
		item: () => item,
	};
	setContext(CONTEXT_KEY, context);

	$effect(() => {
		return () => {
			treeState.onItemRemoved(item.node.id);
		};
	});
</script>

{@render children()}
