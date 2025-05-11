<script lang="ts">
	import { Tree } from "svelte-file-tree";
	import { flip } from "svelte/animate";
	import { SvelteSet } from "svelte/reactivity";
	import { FileNode, FolderNode, type FileTree, type FileTreeNode } from "$lib/tree.svelte.js";
	import TreeItem from "./TreeItem.svelte";
	import type { TreeProps } from "./types.js";

	const { tree }: TreeProps = $props();

	const expandedIds = new SvelteSet<string>();
	let dropDestination: FolderNode | FileTree | undefined = $state.raw();

	function copyNode(node: FileTreeNode): FileTreeNode {
		switch (node.type) {
			case "file": {
				return new FileNode({
					id: crypto.randomUUID(),
					name: node.name,
					size: node.size,
				});
			}
			case "folder": {
				return new FolderNode({
					id: crypto.randomUUID(),
					name: node.name,
					children: node.children.map(copyNode),
				});
			}
		}
	}

	const TypedTree = Tree<FileNode, FolderNode, FileTree>;
</script>

<TypedTree
	{tree}
	{expandedIds}
	{copyNode}
	onChildrenChange={(args) => {
		args.children.sort((a, b) => a.name.localeCompare(b.name));
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
</TypedTree>
