<script lang="ts" generics="Value">
	import { setContext, type Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { TreeViewContext } from "./context.svelte.js";
	import type { Tree, TreeNode } from "./tree.svelte.js";

	type BaseProps = Omit<
		HTMLAttributes<HTMLDivElement>,
		"role" | "aria-multiselectable" | "children"
	>;

	interface Props extends BaseProps {
		tree: Tree<Value>;
		item: Snippet<[TreeNode<Value>]>;
		id?: string;
		ref?: HTMLDivElement | null;
	}

	let {
		tree,
		item,
		id = crypto.randomUUID(),
		ref = $bindable(null),
		...props
	}: Props = $props();

	const context = new TreeViewContext({
		id: () => id,
	});
	setContext(TreeViewContext.key, context);
</script>

{#snippet items(nodes: ReadonlyArray<TreeNode<Value>>)}
	{#each nodes as node (node.id)}
		{@render item(node)}
		{#if node.expanded}
			{@render items(node.children)}
		{/if}
	{/each}
{/snippet}

<div {...props} bind:this={ref} {id} role="tree" aria-multiselectable="true">
	{@render items(tree.roots)}
</div>
