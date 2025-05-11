<script lang="ts">
	import { Tree, type FileTree, type FolderNode } from "svelte-file-tree";
	import { flip } from "svelte/animate";
	import { SvelteSet } from "svelte/reactivity";
	import TreeItem from "./TreeItem.svelte";
	import type { TreeProps } from "./types.js";

	const { tree }: TreeProps = $props();

	const expandedIds = new SvelteSet<string>();
	let dropDestination: FolderNode | FileTree | undefined = $state.raw();
</script>

<Tree
	{tree}
	{expandedIds}
	onChildrenChange={(args) => {
		if (args.operation === "insert") {
			args.children.sort((a, b) => a.name.localeCompare(b.name));
		}
	}}
	onDropDestinationChange={(args) => {
		dropDestination = args.dropDestination;
	}}
>
	{#snippet children({ items })}
		{#each items.filter((item) => item.visible) as item (item.node.id)}
			<div animate:flip={{ duration: 300 }}>
				<TreeItem
					{item}
					{dropDestination}
					onExpand={() => {
						expandedIds.add(item.node.id);
					}}
					onCollapse={() => {
						expandedIds.delete(item.node.id);
					}}
				/>
			</div>
		{/each}
	{/snippet}
</Tree>
