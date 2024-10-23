<script lang="ts" generics="Value">
	import type { Snippet } from "svelte";
	import TreeList from "./TreeList.svelte";
	import type { TreeNode } from "./tree.svelte.js";

	type Props = {
		nodes: ReadonlyArray<TreeNode<Value>>;
		item: Snippet<[TreeNode<Value>]>;
	};

	const { nodes, item }: Props = $props();
</script>

{#each nodes as node (node.id)}
	{@render item(node)}

	{#if node.expanded && node.children.length !== 0}
		<TreeList nodes={node.children} {item} />
	{/if}
{/each}
