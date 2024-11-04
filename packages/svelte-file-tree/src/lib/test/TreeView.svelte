<script lang="ts">
	import type { ComponentProps } from "svelte";
	import TreeItem from "$lib/components/TreeItem.svelte";
	import TreeItemInput from "$lib/components/TreeItemInput.svelte";
	import TreeView from "$lib/components/TreeView.svelte";
	import type { TreeNode } from "$lib/components/tree.svelte.js";

	type TreeViewProps = ComponentProps<typeof TreeView<string>>;
	type TreeItemProps = ComponentProps<typeof TreeItem<string>>;

	interface Props extends TreeViewProps {
		treeItemProps?: (node: TreeNode<string>) => Omit<TreeItemProps, "node">;
		treeItemInputProps?: (
			node: TreeNode<string>,
		) => Omit<ComponentProps<typeof TreeItemInput>, "value">;
	}

	const { treeItemProps, treeItemInputProps, ...props }: Props = $props();
</script>

<TreeView {...props}>
	{#snippet item(node)}
		<TreeItem
			{...treeItemProps?.(node)}
			{node}
			data-node-id={node.id}
			data-testid="tree-item:{node.id}"
		>
			{#snippet children({ editing })}
				{#if editing}
					<TreeItemInput
						{...treeItemInputProps?.(node)}
						bind:value={node.value}
					/>
				{:else}
					{node.value}
				{/if}
			{/snippet}
		</TreeItem>
	{/snippet}
</TreeView>
