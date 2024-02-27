<script lang="ts">
	import TreeView from "$lib/components/TreeView.svelte";
	import { Tree } from "$lib/helpers/tree.js";

	export let data;

	$: tree = Tree.from(data.tree);
</script>

<main class="p-8">
	<TreeView {tree} />
</main>
