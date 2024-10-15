<script lang="ts" module>
	export class TreeViewContext {
		tabbableId: string | undefined = $state();
		shouldSelectOnNextFocus = true;
		shouldClearSelectionOnNextBlur = true;

		static key = Symbol("TreeViewContext");
	}
</script>

<script lang="ts" generics="Value">
	import { setContext, type Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Tree, TreeNode } from "./tree.svelte.js";

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
		tree: Tree<Value>;
		children: Snippet<[TreeNode<Value>]>;
	}

	const { tree, children, ...props }: Props = $props();

	const context = new TreeViewContext();
	setContext(TreeViewContext.key, context);
</script>

<div
	{...props}
	bind:this={tree._element}
	role="tree"
	aria-multiselectable="true"
>
	{#each tree as item (item.id)}
		{@render children(item)}
	{/each}
</div>
