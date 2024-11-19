<script lang="ts">
	import ChevronDown from "lucide-svelte/icons/chevron-down";
	import { LinkedTree, Tree, TreeItem, TreeItemInput } from "svelte-file-tree";
	import data from "./data.json";

	const tree = new LinkedTree({ items: data });
</script>

<main class="container">
	<Tree id="preview-tree" {tree} class="tree">
		{#snippet item(item, index)}
			<TreeItem
				{item}
				{index}
				editable
				draggable
				style="--depth: {item.depth}"
				class="tree-item"
			>
				{#snippet children({ editing })}
					<ChevronDown
						aria-hidden="true"
						data-hidden={item.children.length === 0 ? "" : undefined}
						data-expanded={item.expanded ? "" : undefined}
						class="tree-item-expand"
						onclick={() => {
							item.expanded = !item.expanded;
						}}
					/>
					{#if editing}
						<TreeItemInput bind:value={item.value} class="tree-item-input" />
					{:else}
						<span class="tree-item-text">{item.value}</span>
					{/if}
				{/snippet}
			</TreeItem>
		{/snippet}
	</Tree>
</main>

<style>
	.container {
		padding: 24px;
	}

	:global(.tree) {
		display: grid;
		gap: 12px;
	}

	:global(.tree-item) {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		margin-inline-start: calc(var(--depth) * 16px);
		border-radius: 4px;
		padding: 12px;
		background-color: rgb(0 0 0 / 10%);

		&:hover {
			background-color: rgb(0 0 0 / 15%);
		}

		&:focus-visible {
			outline: 2px solid currentColor;
		}

		&:active {
			background-color: rgb(0 0 0 / 20%);
		}

		&[aria-selected="true"] {
			background-color: #dbeafe;
			color: #1e40af;
		}

		&[data-dragged] {
			opacity: 0.5;
		}

		&[data-drop-position="before"]::before,
		&[data-drop-position="after"]::before {
			content: "";
			position: absolute;
			left: 0;
			right: 0;
			height: 2px;
			background-color: #f43f5e;
		}

		&[data-drop-position="before"]::before {
			top: 0;
		}

		&[data-drop-position="after"]::before {
			bottom: 0;
		}

		&[data-drop-position="inside"] {
			outline: 2px solid #f43f5e;
		}
	}

	:global(.tree-item-expand) {
		transition: transform 300ms;

		&[data-hidden] {
			visibility: hidden;
		}

		&[data-expanded] {
			transform: rotate(180deg);
		}
	}

	:global(.tree-item-input) {
		background-color: transparent;

		&:focus {
			outline: none;
		}
	}

	.tree-item-text {
		user-select: none;
	}
</style>
