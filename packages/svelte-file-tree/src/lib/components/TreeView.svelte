<script lang="ts" module>
	const contextKey = Symbol("TreeViewContext");

	export type TreeViewContext<Value> = {
		tree: Tree<Value>;
		treeId: () => string;
		treeElement: () => HTMLDivElement | null;
	};

	export function getTreeViewContext<Value>(): TreeViewContext<Value> {
		if (!hasContext(contextKey)) {
			throw new Error("No parent <TreeView> found.");
		}
		return getContext(contextKey);
	}

	function setTreeViewContext<Value>(context: TreeViewContext<Value>): void {
		setContext(contextKey, context);
	}
</script>

<script lang="ts" generics="Value">
	import { getContext, hasContext, setContext, type Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { Tree, type TreeNode, type TreeProps } from "./tree.svelte.js";

	type BaseProps = Omit<
		HTMLAttributes<HTMLDivElement>,
		"role" | "aria-multiselectable" | "children"
	>;

	interface Props extends BaseProps, TreeProps<Value> {
		id: string;
		item: Snippet<[TreeNode<Value>]>;
		ref?: HTMLDivElement | null;
	}

	let {
		id,
		item,
		ref = $bindable(null),
		items,
		selected,
		expanded,
		defaultSelected,
		defaultExpanded,
		...props
	}: Props = $props();

	// TODO: handle changes to the `items` prop
	const tree = new Tree({
		items,
		selected,
		expanded,
		defaultSelected,
		defaultExpanded,
	});

	setTreeViewContext({
		tree,
		treeId: () => id,
		treeElement: () => ref,
	});
</script>

{#snippet treeItems(nodes: ReadonlyArray<TreeNode<Value>>)}
	{#each nodes as node (node.id)}
		{@render item(node)}
		{#if node.expanded}
			{@render treeItems(node.children)}
		{/if}
	{/each}
{/snippet}

<div {...props} bind:this={ref} {id} role="tree" aria-multiselectable="true">
	{@render treeItems(tree.roots)}
</div>
