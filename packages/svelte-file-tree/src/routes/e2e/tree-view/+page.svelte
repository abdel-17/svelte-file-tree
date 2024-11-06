<script lang="ts">
	import TreeItem from "$lib/components/TreeItem.svelte";
	import TreeItemInput from "$lib/components/TreeItemInput.svelte";
	import TreeView from "$lib/components/TreeView.svelte";

	const items = [
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
	];
</script>

<TreeView id="e2e-test-tree" {items} class="tree-view">
	{#snippet item(node)}
		<TreeItem
			{node}
			editable={node.id === "2"}
			data-testid="tree-item:{node.id}"
			style="--depth: {node.level - 1}"
			class="tree-item"
		>
			{#snippet children({ editing })}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="tree-item-expanded-icon"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>

				{#if editing}
					<TreeItemInput bind:value={node.value} />
				{:else}
					<span>{node.value}</span>
				{/if}
			{/snippet}
		</TreeItem>
	{/snippet}
</TreeView>

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
		height: 50px;
		padding-inline: 16px;
		margin-inline-start: calc(var(--depth) * 16px);

		&[aria-selected="true"] {
			color: blue;
		}

		&[aria-expanded] > .tree-item-expanded-icon {
			visibility: visible;
		}

		&[aria-expanded="true"] > .tree-item-expanded-icon {
			transform: rotate(180deg);
		}
	}

	.tree-item-expanded-icon {
		visibility: hidden;
	}
</style>
