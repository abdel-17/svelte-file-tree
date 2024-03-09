<script lang="ts">
	import { TreeItem, TreeItemExpand, TreeView } from "$lib/index.js";
	import ChevronRightIcon from "lucide-svelte/icons/chevron-right";

	export let data;
</script>

<main class="p-8">
	<TreeView tree={data.tree} getItemId={(value) => value} let:item>
		<TreeItem
			{item}
			class="group flex cursor-default gap-2 p-2 focus:outline focus:outline-2 focus:outline-blue-400 aria-selected:bg-blue-100 aria-selected:text-blue-800"
			style="margin-inline-start: {item.level - 1}rem"
		>
			<TreeItemExpand
				data-leaf={item.children.length === 0 ? "true" : "false"}
				class="data-[leaf='true']:invisible"
			>
				<ChevronRightIcon
					class="cursor-pointer transition-transform duration-300 group-aria-expanded:rotate-90 rtl:rotate-180 group-aria-expanded:rtl:rotate-90"
				/>
			</TreeItemExpand>
			<span class="select-none">{item.value}</span>
		</TreeItem>
	</TreeView>
</main>
