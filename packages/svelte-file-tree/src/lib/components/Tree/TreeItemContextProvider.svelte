<script lang="ts" module>
	import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext, type Snippet } from "svelte";
	import { getTreeContext } from "./Tree.svelte";
	import { TreeItemContext, TreeItemSnippetArgs } from "./state.svelte.js";

	const CONTEXT_KEY = Symbol("TreeItemProvider");

	export function getTreeItemContext(): TreeItemContext {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <Tree> found");
		}
		return getContext(CONTEXT_KEY);
	}
</script>

<script lang="ts">
	const treeContext = getTreeContext();
	const parent: TreeItemContext<FolderNode> | undefined = getContext(CONTEXT_KEY);

	const {
		node,
		index,
		editable,
		disabled,
		children,
	}: {
		node: FileTreeNode;
		index: number;
		editable: boolean;
		disabled: boolean;
		children: Snippet<[args: TreeItemSnippetArgs]>;
	} = $props();

	const context = new TreeItemContext({
		treeContext,
		parent,
		node: () => node,
		index: () => index,
		editable: () => editable,
		disabled: () => disabled,
	});
	setContext(CONTEXT_KEY, context);

	const args = new TreeItemSnippetArgs(context);
</script>

{@render children(args)}
