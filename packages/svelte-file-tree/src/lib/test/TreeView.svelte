<script lang="ts">
	import TreeItem from "$lib/components/TreeItem.svelte";
	import TreeItemInput from "$lib/components/TreeItemInput.svelte";
	import TreeView from "$lib/components/TreeView.svelte";
	import type { TreeNode } from "$lib/components/tree.svelte.js";
	import type { ComponentProps } from "svelte";

	type TreeViewProps = ComponentProps<typeof TreeView<string>>;
	type TreeItemProps = ComponentProps<typeof TreeItem<string>>;
	type TreeItemInputProps = ComponentProps<typeof TreeItemInput>;

	interface Props extends TreeViewProps {
		getTreeItemProps?: (node: TreeNode<string>) => TreeItemProps;
		getTreeItemInputProps?: (node: TreeNode<string>) => TreeItemInputProps;
	}

	let { getTreeItemProps, getTreeItemInputProps, ...props }: Props = $props();
</script>

<TreeView {...props}>
	{#snippet item(node)}
		<TreeItem
			{...getTreeItemProps?.(node)}
			{node}
			data-testid="tree-item:{node.id}"
		>
			{#snippet children({ editing })}
				{#if editing}
					<TreeItemInput
						{...getTreeItemInputProps?.(node)}
						bind:value={node.value}
					/>
				{:else}
					{node.value}
				{/if}
			{/snippet}
		</TreeItem>
	{/snippet}
</TreeView>
