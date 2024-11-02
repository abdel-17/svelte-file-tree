<script lang="ts" generics="Value">
	import ChevronDown from "lucide-svelte/icons/chevron-down";
	import { TreeItem, TreeItemInput } from "svelte-file-tree";
	import type { TreeNode } from "svelte-file-tree/types";

	type Props = {
		node: TreeNode<Value>;
	};

	const { node }: Props = $props();

	let draggedOver = $state(false);
</script>

<TreeItem
	{node}
	editable
	draggable
	data-leaf={node.children.length === 0 ? "" : undefined}
	data-dragged={node.dragged ? "" : undefined}
	data-dragged-over={draggedOver ? "" : undefined}
	style="--indent: calc({node.level} * var(--spacing-4))"
	class="group flex gap-2 ps-[var(--indent)] pe-4 py-2 hover:bg-current/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current active:bg-current/12 aria-selected:bg-blue-100 aria-selected:text-blue-800 data-dragged:opacity-50 data-dragged-over:outline data-dragged-over:outline-dashed"
	ondragenter={() => {
		if (!node.dropTarget) {
			return;
		}

		draggedOver = true;
	}}
	ondragleave={(event) => {
		if (!node.dropTarget) {
			return;
		}

		const { currentTarget, relatedTarget } = event;
		if (
			relatedTarget instanceof Node &&
			currentTarget.contains(relatedTarget)
		) {
			return;
		}

		draggedOver = false;
	}}
	ondrop={() => {
		draggedOver = false;
	}}
>
	{#snippet children({ editing })}
		<button
			aria-hidden="true"
			tabindex={-1}
			class="transition-transform duration-300 group-aria-expanded:rotate-180 group-data-leaf:invisible"
			onclick={() => {
				node.expanded = !node.expanded;
			}}
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
