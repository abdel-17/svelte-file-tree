<script lang="ts" module>
	import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext, type Snippet } from "svelte";
	import { getTreeContext } from "./Tree.svelte";
	import { TreeItemProviderContext } from "./state.svelte.js";

	const CONTEXT_KEY = Symbol("TreeItemProvider");

	export function getTreeItemProviderContext(): TreeItemProviderContext {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <Tree> found");
		}
		return getContext(CONTEXT_KEY);
	}
</script>

<script lang="ts">
	const treeContext = getTreeContext();

	const {
		node,
		index,
		parent,
		children,
	}: {
		node: FileTreeNode;
		index: number;
		parent: TreeItemProviderContext<FolderNode> | undefined;
		children: Snippet<[context: TreeItemProviderContext]>;
	} = $props();

	const itemProviderContext = new TreeItemProviderContext({
		treeContext,
		node: () => node,
		index: () => index,
		parent: () => parent,
	});
	setContext(CONTEXT_KEY, itemProviderContext);
</script>

{@render children(itemProviderContext)}
