<script lang="ts">
	import ChevronDown from "lucide-svelte/icons/chevron-down";
	import { Tree, TreeItem, TreeView } from "svelte-file-tree";
	import data from "./data.json";

	const tree = new Tree({
		items: data,
	});
</script>

<TreeView {tree} class="border m-8">
	{#snippet children(item)}
		<TreeItem
			{item}
			data-leaf={item.children.length === 0 ? "" : undefined}
			style="--depth: {item.depth}"
			class="group flex gap-2 p-2 ms-[calc(var(--spacing-4)*var(--depth))] aria-selected:bg-blue-100 aria-selected:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
		>
			<ChevronDown
				class="transition-transform duration-300 group-aria-expanded:rotate-180 group-data-leaf:invisible"
			/>
			<span>{item.value}</span>
		</TreeItem>
	{/snippet}
</TreeView>
