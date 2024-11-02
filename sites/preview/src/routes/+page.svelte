<script lang="ts">
	import ChevronDown from "lucide-svelte/icons/chevron-down";
	import { TreeItem, TreeItemInput, TreeView } from "svelte-file-tree";
	import data from "./data.json";
</script>

<main class="p-8">
	<TreeView id="preview-tree" items={data} class="space-y-3">
		{#snippet item(node)}
			<TreeItem
				{node}
				editable
				draggable
				data-leaf={node.children.length === 0 ? "" : undefined}
				style="--indent: calc({node.level - 1} * var(--spacing-4))"
				class="group relative ms-[var(--indent)] flex gap-2 rounded bg-current/10 p-3 hover:bg-current/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current active:bg-current/20 aria-selected:bg-blue-100 aria-selected:text-blue-800 data-dragged:opacity-50 data-[drop-position='before']:before:absolute data-[drop-position='before']:before:inset-x-0 data-[drop-position='before']:before:top-0 data-[drop-position='before']:before:h-0.5 data-[drop-position='before']:before:bg-red-500 data-[drop-position='after']:before:absolute data-[drop-position='after']:before:inset-x-0 data-[drop-position='after']:before:bottom-0 data-[drop-position='after']:before:h-0.5 data-[drop-position='after']:before:bg-red-500 data-[drop-position='inside']:ring-2 data-[drop-position='inside']:ring-red-500 data-[drop-position='inside']:ring-inset"
			>
				{#snippet children({ editing })}
					<ChevronDown
						aria-hidden="true"
						class="transition-transform duration-300 group-aria-expanded:rotate-180 group-data-leaf:invisible"
						onclick={() => {
							node.expanded = !node.expanded;
						}}
					/>
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
