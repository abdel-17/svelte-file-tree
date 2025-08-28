<script lang="ts">
	import Tree from "$lib/Tree.svelte";
	import TreeItem from "$lib/TreeItem.svelte";
	import {
		FileNode,
		FileTree,
		FolderNode,
		TreeItemState,
		VirtualList,
		type FileTreeNode,
		type VirtualListChildrenSnippetArgs,
	} from "svelte-file-tree";

	function createChild(i: number): FileTreeNode {
		const name = `Item ${i + 1}`;
		if ((i + 1) % 1000 === 0) {
			return new FolderNode({
				id: crypto.randomUUID(),
				name,
				children: Array(1000)
					.fill(null)
					.map((_, j) => createSubChild(i, j)),
			});
		} else {
			return new FileNode({
				id: crypto.randomUUID(),
				name,
			});
		}
	}

	function createSubChild(i: number, j: number) {
		return new FileNode({
			id: crypto.randomUUID(),
			name: `Item ${i + 1}.${j + 1}`,
		});
	}

	const root = new FileTree(
		Array(5000)
			.fill(null)
			.map((_, i) => createChild(i)),
	);

	function getVisibleItems(
		virtualItems: VirtualListChildrenSnippetArgs["virtualItems"],
		items: Array<TreeItemState>,
	) {
		const result = [];
		for (const { key, index, size, start } of virtualItems) {
			const item = items[index];
			if (item?.visible) {
				result.push({ item, key, size, start });
			}
		}
		return result;
	}
</script>

<VirtualList
	estimateSize={() => 48}
	paddingStart={24}
	paddingEnd={24}
	scrollPaddingStart={24}
	scrollPaddingEnd={24}
	class="h-svh overflow-y-auto px-[24px]"
>
	{#snippet children({ treeSize, virtualItems })}
		<Tree {root} class="relative" style="height: {treeSize}px;">
			{#snippet children({ items })}
				{#each getVisibleItems(virtualItems, items) as { item, key, size, start } (key)}
					<TreeItem
						{item}
						class="!absolute top-0 right-0 left-0"
						style="height: {size}px; transform: translateY({start}px);"
					/>
				{/each}
			{/snippet}
		</Tree>
	{/snippet}
</VirtualList>
