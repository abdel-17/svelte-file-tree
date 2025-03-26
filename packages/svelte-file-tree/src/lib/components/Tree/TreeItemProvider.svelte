<script lang="ts" module>
	import type { FileTreeNodeData } from "$lib/tree.svelte.js";
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext, type Snippet } from "svelte";
	import type { TreeState } from "./state.svelte.js";
	import type { TreeItemState } from "./types.js";

	const CONTEXT_KEY = Symbol("TreeItemProvider");

	export type TreeItemProviderContext<TData extends FileTreeNodeData = FileTreeNodeData> = {
		treeState: TreeState<TData>;
		item: () => TreeItemState<TData>;
	};

	export function getTreeItemProviderContext(): TreeItemProviderContext {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <Tree> found");
		}

		return getContext(CONTEXT_KEY);
	}
</script>

<script lang="ts" generics="TData extends FileTreeNodeData = FileTreeNodeData">
	const {
		treeState,
		item,
		children,
	}: {
		treeState: TreeState<TData>;
		item: TreeItemState<TData>;
		children: Snippet;
	} = $props();

	const context: TreeItemProviderContext<TData> = {
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
