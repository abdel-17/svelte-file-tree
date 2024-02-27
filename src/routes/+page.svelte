<script lang="ts">
	import TreeView from "$lib/components/TreeView.svelte";
	import TreeItem from "$lib/components/TreeItem.svelte";
	import { Tree } from "$lib/helpers/tree.js";

	export let data;

	$: tree = Tree.from(data.tree);
</script>

<main class="p-8">
	<TreeView {tree} let:nodes>
		{#each nodes as node, index (node.id)}
			<TreeItem {node} {index}>
				{node.value}
			</TreeItem>
		{/each}
	</TreeView>
</main>
