<script lang="ts" module>
	const contextKey = Symbol("TreeViewContext");

	export type TreeViewContext = {
		tree: Tree<unknown>;
		treeId: () => string;
		treeElement: () => HTMLDivElement | null;
	};

	export function getTreeViewContext(): TreeViewContext {
		if (!hasContext(contextKey)) {
			throw new Error("No parent <TreeView> found.");
		}
		return getContext(contextKey);
	}

	function setTreeViewContext(context: TreeViewContext): void {
		setContext(contextKey, context);
	}
</script>

<script lang="ts" generics="Value">
	import { getContext, hasContext, setContext, type Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { SvelteSet } from "svelte/reactivity";
	import { Tree, type TreeItem, type TreeNode } from "./tree.svelte.js";

	type BaseProps = Omit<
		HTMLAttributes<HTMLDivElement>,
		"role" | "aria-multiselectable" | "children"
	>;

	interface Props extends BaseProps {
		id: string;
		items: ReadonlyArray<TreeItem<Value>>;
		item: Snippet<[TreeNode<Value>]>;
		selected?: SvelteSet<string>;
		expanded?: SvelteSet<string>;
		defaultSelected?: Iterable<string>;
		defaultExpanded?: Iterable<string>;
		ref?: HTMLDivElement | null;
	}

	let {
		id,
		items,
		item,
		selected,
		expanded,
		defaultSelected,
		defaultExpanded,
		ref = $bindable(null),
		...props
	}: Props = $props();

	const tree = new Tree({
		items: () => items,
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
