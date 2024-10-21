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
		ref?: HTMLDivElement;
	}

	let {
		tree,
		item,
		id = crypto.randomUUID(),
		ref = $bindable(),
		...props
	}: Props = $props();

	const context = new TreeViewContext(() => id);
	setContext(TreeViewContext.key, context);
</script>

<div
	{...props}
	bind:this={ref}
	{id}
	role="tree"
	aria-multiselectable="true"
	data-tree-view=""
>
	{#each tree as node (node.id)}
		{@render item(node)}
	{/each}
</div>
