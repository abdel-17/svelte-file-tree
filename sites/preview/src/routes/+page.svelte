<script lang="ts">
	import ChevronDown from "lucide-svelte/icons/chevron-down";
	import { Tree, TreeItem, TreeItemInput, TreeView } from "svelte-file-tree";
	import data from "./data.json";

	const tree = new Tree({
		items: data,
	});
</script>

<TreeView {tree} class="m-8 border">
	{#snippet item(node)}
		<TreeItem
			{node}
			editable
			data-leaf={node.children.length === 0 ? "" : undefined}
			style="--depth: {node.depth}"
			class="group ms-[calc(var(--spacing-4)*var(--depth))] flex gap-2 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 aria-selected:bg-blue-100 aria-selected:text-blue-900"
		>
			{#snippet children({ editing })}
				<ChevronDown
					class="transition-transform duration-300 group-aria-expanded:rotate-180 group-data-leaf:invisible"
				/>
				{#if editing}
					<TreeItemInput
						bind:value={node.value}
						onCommit={(value) => {
							console.log("onCommit", value);
						}}
					/>
				{:else}
					<span>{node.value}</span>
				{/if}
			{/snippet}
		</TreeItem>
	{/snippet}
</TreeView>
