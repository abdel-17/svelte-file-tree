<script lang="ts">
	import { TreeView } from "svelte-file-tree";
	import TreeItem from "./TreeItem.svelte";
	import data from "./data.json";
</script>

<main class="p-8">
	<TreeView id="preview-tree" items={data} class="rounded border">
		{#snippet item(node)}
			<TreeItem {node} />
		{/snippet}
	</TreeView>
</main>
