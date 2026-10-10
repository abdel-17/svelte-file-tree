<script lang="ts">
	import chevron_down_svg from "#lib/icons/chevron-down.svg?raw";
	import file_svg from "#lib/icons/file.svg?raw";
	import folder_svg from "#lib/icons/folder.svg?raw";
	import folder_open_svg from "#lib/icons/folder-open.svg?raw";
	import tree_data from "#lib/tree-data.json";
	import { SvelteSet } from "svelte/reactivity";
	import { create_flat_tree, Tree, TreeDnd, TreeItem } from "svelte-file-tree";

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

	let root: TreeNode[] = $state(structuredClone(tree_data));
	const selected_ids = new SvelteSet<string>();
	const expanded_ids = new SvelteSet<string>();
	const items = $derived(create_flat_tree({ root, expanded_ids, get_id, get_children }));

	function set_toggle(ids: Set<string>, id: string): void {
		const deleted = ids.delete(id);
		if (!deleted) {
			ids.add(id);
		}
	}

	let destination_id: string | null | undefined = $state.raw();

	function on_drag(dragged_id: string, destination_index: number): boolean {
		destination_id = destination_index !== -1 ? items[destination_index].id : null;
		return true;
	}

	function on_dragleave(dragged_id: string): void {
		destination_id = undefined;
	}

	function on_drop(dragged_id: string, destination_index: number): void {
		if (!selected_ids.has(dragged_id)) {
			console.error("BUG: dragged_id should have been selected");
			selected_ids.add(dragged_id);
		}
		const destination = destination_index !== -1 ? items[destination_index].data : null;

		const sources: TreeNode[] = [];
		const sources_parent: (TreeNode | null)[] = [];
		for (const id of selected_ids) {
			// If your dataset is large, you probably want to use a map, instead
			const source = items.find((item) => item.id === id);
			if (source === undefined) {
				continue;
			}
			sources.push(source.data);
			const parent = source.parent_index !== -1 ? items[source.parent_index].data : null;
			if (!sources_parent.includes(parent)) {
				sources_parent.push(parent);
			}
		}

		for (const parent of sources_parent) {
			if (parent !== null) {
				parent.children = parent.children!.filter((node) => !selected_ids.has(node.id))
			} else {
				root = root.filter((node) => !selected_ids.has(node.id))
			}
		}
		if (destination !== null) {
			destination.children!.push(...sources);
		} else {
			root.push(...sources);
		}
		destination_id = undefined;
	}

	const dnd = new TreeDnd({
		get_items: () => items,
		get_selected_ids: () => selected_ids,
		has_children,
		on_drag,
		on_dragleave,
		on_drop,
	});
</script>

<svelte:head>
	<title>Svelte File Tree - Drag and Drop</title>
</svelte:head>

<main class="container dropzone" {@attach dnd.attachment}>
	<Tree
		{items}
		{selected_ids}
		{expanded_ids}
		{get_id}
		{has_children}
		aria-label="Files"
		data-destination={destination_id === null}
		class="tree"
	>
		{#each items as item, index (item.id)}
			{const selected = $derived(selected_ids.has(item.id))}
			{const expanded = $derived(expanded_ids.has(item.id))}
			<TreeItem
				{item}
				{index}
				{selected}
				{expanded}
				draggable="true"
				class="treeitem"
				style="--depth: {item.depth}"
				data-dragged={dnd.dragged_id !== undefined && selected}
				data-destination={destination_id === item.id}
			>
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

<style>
	.dropzone {
		height: 100svh;

		& :global(.tree) {
			height: 100%;
			overflow-y: scroll;
			border: 2px solid var(--color-neutral-400);
		}

		& :global(.tree[data-destination="true"]) {
			border-color: var(--color-sky-800);
			background-color: var(--color-blue-100);
		}

		& :global(.treeitem[data-dragged="true"]) {
			opacity: 0.5;
		}

		& :global(.treeitem[data-destination="true"]) {
			outline: 2px solid var(--color-sky-800);
			outline-offset: -2px;
			background-color: var(--color-blue-100);
		}
	}
</style>
