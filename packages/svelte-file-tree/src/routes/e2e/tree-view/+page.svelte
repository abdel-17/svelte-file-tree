<script lang="ts">
	import Tree from "$lib/components/Tree.svelte";
	import TreeItem from "$lib/components/TreeItem.svelte";
	import TreeItemInput from "$lib/components/TreeItemInput.svelte";
	import { LinkedTree } from "$lib/components/tree.svelte.js";

	const tree = new LinkedTree({
		items: [
			{
				id: "1",
				value: "Section 1",
				children: [
					{
						id: "1.1",
						value: "Section 1.1",
						children: [
							{
								id: "1.1.1",
								value: "Section 1.1.1",
							},
							{
								id: "1.1.2",
								value: "Section 1.1.2",
							},
							{
								id: "1.1.3",
								value: "Section 1.1.3",
							},
						],
					},
					{
						id: "1.2",
						value: "Section 1.2",
						children: [
							{
								id: "1.2.1",
								value: "Section 1.2.1",
							},
							{
								id: "1.2.2",
								value: "Section 1.2.2",
							},
						],
					},
				],
			},
			{
				id: "2",
				value: "Section 2",
				children: [
					{
						id: "2.1",
						value: "Section 2.1",
					},
					{
						id: "2.2",
						value: "Section 2.2",
					},
				],
			},
			{
				id: "3",
				value: "Section 3",
				children: [
					{
						id: "3.1",
						value: "Section 3.1",
					},
					{
						id: "3.2",
						value: "Section 3.2",
					},
				],
			},
		],
	});
</script>

<Tree {tree} class="tree-view">
	{#snippet item(item, index)}
		<TreeItem
			{item}
			{index}
			editable={item.id === "2"}
			data-testid="tree-item:{item.id}"
			style="--depth: {item.depth}"
			class="tree-item"
		>
			{#snippet children({ editing })}
				{#if editing}
					<TreeItemInput bind:value={item.value} />
				{:else}
					<span>{item.value}</span>
				{/if}
			{/snippet}
		</TreeItem>
	{/snippet}
</Tree>

<style>
	:global(.tree-view) {
		height: 150px;
		overflow-y: scroll;
		border: 2px solid black;
		border-radius: 4px;
	}

	:global(.tree-item) {
		display: flex;
		align-items: center;
		margin-inline-start: calc(var(--depth) * 16px);
		height: 50px;
		padding-inline: 16px;

		&[aria-selected="true"] {
			color: blue;
		}
	}
</style>
