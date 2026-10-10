<script lang="ts">
	import chevron_down_svg from "#lib/icons/chevron-down.svg?raw";
	import file_svg from "#lib/icons/file.svg?raw";
	import folder_svg from "#lib/icons/folder.svg?raw";
	import folder_open_svg from "#lib/icons/folder-open.svg?raw";
	import tree_data from "#lib/tree-data.json";
	import { SvelteSet } from "svelte/reactivity";
	import { create_flat_tree, Tree, TreeItem } from "svelte-file-tree";

	type TreeNode = {
		id: string,
		name: string,
		children?: TreeNode[],
	};

	function get_id(node: TreeNode): string {
		return node.id;
	}

	function has_children(node: TreeNode): boolean {
		return node.children !== undefined;
	}

	function get_children(node: TreeNode): TreeNode[] | undefined {
		return node.children;
	}

	const root: TreeNode[] = tree_data;
	const selected_ids = new SvelteSet<string>();
	const expanded_ids = new SvelteSet<string>();
	const items = $derived(create_flat_tree({ root, expanded_ids, get_id, get_children }));

	function set_toggle(ids: Set<string>, id: string): void {
		const deleted = ids.delete(id);
		if (!deleted) {
			ids.add(id);
		}
	}
</script>

<svelte:head>
	<title>Svelte File Tree - Minimal</title>
</svelte:head>

<main class="container">
	<Tree {items} {selected_ids} {expanded_ids} {get_id} {has_children} aria-label="Files">
		{#each items as item, index (item.id)}
			{const selected = $derived(selected_ids.has(item.id))}
			{const expanded = $derived(expanded_ids.has(item.id))}
			<TreeItem {item} {index} {selected} {expanded} class="treeitem" style="--depth: {item.depth}">
				<span
					aria-hidden="true"
					class="treeitem-expand-icon"
					onclick={(event) => {
						set_toggle(expanded_ids, item.id);
						event.preventDefault();
					}}
				>
					{@html chevron_down_svg}
				</span>

				<span aria-hidden="true" class="treeitem-icon">
					{#if item.data.children === undefined}
						{@html file_svg}
					{:else if expanded}
						{@html folder_open_svg}
					{:else}
						{@html folder_svg}
					{/if}
				</span>

				{item.data.name}
			</TreeItem>
		{/each}
	</Tree>
</main>
