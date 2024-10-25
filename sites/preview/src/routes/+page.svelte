<script lang="ts">
	import ChevronDown from "lucide-svelte/icons/chevron-down";
	import { Tree, TreeItem, TreeItemInput, TreeView } from "svelte-file-tree";
	import data from "./data.json";

	const tree = new Tree({
		items: data,
	});
</script>

<main class="p-8">
	<TreeView {tree} class="rounded border">
		{#snippet item({ node, levelIndex })}
			<TreeItem
				{node}
				{levelIndex}
				editable
				data-leaf={node.children.length === 0 ? "" : undefined}
				style="--indent: calc({node.depth + 1} * var(--spacing-4))"
				class="group flex gap-2 ps-[var(--indent)] pe-4 py-2 hover:bg-current/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current active:bg-current/12 aria-selected:bg-blue-100 aria-selected:text-blue-800"
			>
				{#snippet children({ editing })}
					<button
						aria-hidden="true"
						tabindex={-1}
						onclick={() => {
							node.expanded = !node.expanded;
						}}
						class="transition-transform duration-300 group-aria-expanded:rotate-180 group-data-leaf:invisible"
					>
						<ChevronDown />
					</button>

					{#if editing}
						<TreeItemInput
							bind:value={node.value}
							onCommit={(value: string) => {
								console.log("onCommit:", value);
							}}
							onRollback={(value: string) => {
								console.log("onRollback:", value);
							}}
							class="bg-white focus:outline-none"
						/>
					{:else}
						<span class="select-none">{node.value}</span>
					{/if}
				{/snippet}
			</TreeItem>
		{/snippet}
	</TreeView>
</main>
