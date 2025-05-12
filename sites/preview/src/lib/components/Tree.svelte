<script lang="ts">
	import { Tree, type FolderNode } from "svelte-file-tree";
	import { flip } from "svelte/animate";
	import { SvelteSet } from "svelte/reactivity";
	import { isControlOrMeta } from "$lib/helpers.js";
	import TreeItem from "./TreeItem.svelte";
	import type { TreeProps } from "./types.js";

	const { root }: TreeProps = $props();

	const expandedIds = new SvelteSet<string>();
	let dropDestination: FolderNode | undefined = $state.raw();

	let tree: Tree | null = $state.raw(null);
</script>

<div class="flex min-h-svh p-2">
	<Tree
		{root}
		{expandedIds}
		bind:this={tree}
		tabindex={0}
		class={[
			"relative grow p-6 focus-visible:outline-2 focus-visible:outline-current",
			{
				"before:pointer-events-none before:absolute before:inset-0 before:border-2 before:border-red-500":
					dropDestination === root,
			},
		]}
		onChildrenChange={(args) => {
			if (args.operation === "insert") {
				args.children.sort((a, b) => a.name.localeCompare(b.name));
			}
		}}
		onDropDestinationChange={(args) => {
			dropDestination = args.dropDestination;
		}}
		onkeydown={(event) => {
			if (event.key === "v" && isControlOrMeta(event)) {
				event.preventDefault();
				tree!.paste(root);
			}
		}}
	>
		{#snippet children({ items })}
			{#each items.filter((item) => item.visible) as item (item.node.id)}
				<div animate:flip={{ duration: 300 }}>
					<TreeItem
						{item}
						{dropDestination}
						onExpand={() => {
							expandedIds.add(item.node.id);
						}}
						onCollapse={() => {
							expandedIds.delete(item.node.id);
						}}
					/>
				</div>
			{/each}
		{/snippet}
	</Tree>
</div>
