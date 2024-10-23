<script lang="ts" generics="Value">
	import { setContext, type Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import TreeList from "./TreeList.svelte";
	import { TreeViewContext } from "./context.svelte.js";
	import type { Tree, TreeNode } from "./tree.svelte.js";

	type BaseProps = Omit<
		HTMLAttributes<HTMLDivElement>,
		"id" | "role" | "aria-multiselectable" | "children"
	>;

	interface Props extends BaseProps {
		tree: Tree<Value>;
		item: Snippet<[TreeNode<Value>]>;
		ref?: HTMLDivElement | null;
	}

	let { tree, item, ref = $bindable(null), ...props }: Props = $props();

	const context = new TreeViewContext(() => tree);
	setContext(TreeViewContext.key, context);
</script>

<div
	{...props}
	bind:this={ref}
	id={tree.id}
	role="tree"
	aria-multiselectable="true"
	data-tree-view=""
>
	<TreeList nodes={tree.roots} {item} />
</div>
