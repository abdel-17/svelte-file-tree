<script lang="ts">
	import { TreeItem, TreeItemExpand, TreeView } from "$lib/index.js";
	import ChevronRightIcon from "lucide-svelte/icons/chevron-right";

	export let data;
</script>

<main>
	<TreeView
		tree={data.tree}
		getItemId={(value) => value}
		class="tree-view"
		let:items
	>
		{#each items as item (item.id)}
			<TreeItem
				{item}
				class="tree-item"
				style="margin-inline-start: {item.level - 1}rem"
				data-leaf={item.children.length === 0 ? "true" : "false"}
			>
				<TreeItemExpand class="tree-item-expand">
					<ChevronRightIcon />
				</TreeItemExpand>
				<span>{item.value}</span>
			</TreeItem>
		{/each}
	</TreeView>
</main>
