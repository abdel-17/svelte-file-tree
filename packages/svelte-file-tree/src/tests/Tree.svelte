<script lang="ts">
import {
	Tree,
	TreeItem,
	TreeItemInput,
	type TreeItemInputProps,
	type TreeItemProps,
	type TreeItemRenderProps,
	type TreeProps,
} from "$lib/index.js";

interface Props extends Omit<TreeProps, "item"> {
	getItemProps?: (props: TreeItemRenderProps) => Omit<TreeItemProps, "children">;
	getInputProps?: (props: TreeItemRenderProps) => TreeItemInputProps;
}

const { getItemProps, getInputProps, ...treeProps }: Props = $props();
</script>

<Tree {...treeProps}>
	{#snippet item(props)}
		<TreeItem {...getItemProps?.(props)} data-testid={props.node.id}>
			{#if props.editing}
				<TreeItemInput {...getInputProps?.(props)} />
			{:else}
				<span>{props.node.name}</span>
			{/if}
		</TreeItem>
	{/snippet}
</Tree>
