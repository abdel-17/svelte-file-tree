<script lang="ts">
	import Tree from "$lib/components/Tree.svelte";
	import TreeItem from "$lib/components/TreeItem.svelte";
	import TreeItemNameInput from "$lib/components/TreeItemNameInput.svelte";
	import type { FileTreeNode } from "$lib/tree.svelte.js";
	import type { ComponentProps } from "svelte";

	type TreeProps = ComponentProps<typeof Tree>;
	type TreeItemProps = ComponentProps<typeof TreeItem>;
	type TreeItemRenderProps = Parameters<TreeItemProps["children"]>[0];
	type TreeItemNameInputProps = ComponentProps<typeof TreeItemNameInput>;

	interface Props extends TreeProps {
		getItemProps?: (node: FileTreeNode, index: number) => TreeItemProps;
		getInputProps?: (props: TreeItemRenderProps) => TreeItemNameInputProps;
	}

	const { getItemProps, getInputProps, ...treeProps }: Props = $props();
</script>

<Tree {...treeProps}>
	{#snippet item(node, index)}
		<TreeItem {...getItemProps?.(node, index)} data-testid={node.id}>
			{#snippet children(props)}
				{#if props.editing}
					<TreeItemNameInput {...getInputProps?.(props)} />
				{:else}
					<span>{node.name}</span>
				{/if}
			{/snippet}
		</TreeItem>
	{/snippet}
</Tree>
