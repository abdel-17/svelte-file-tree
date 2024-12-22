# Svelte File Tree

Unstyled file tree component library for Svelte.

## Installation

```bash
npm install svelte-file-tree
```

## Usage

```svelte
<script lang="ts">
	import { FileTree, Tree, TreeItem, TreeItemInput } from "svelte-file-tree";

	const tree = new FileTree();
	tree.nodes = [
		tree.createFolder({
			id: "1",
			name: "Section 1",
			children: [
				tree.createFile({
					id: "1.1",
					name: "Section 1.1",
				}),
				tree.createFile({
					id: "1.2",
					name: "Section 1.2",
				}),
			],
		}),
		tree.createFolder({
			id: "2",
			name: "Section 2",
			children: [
				tree.createFile({
					id: "2.1",
					name: "Section 2.1",
				}),
				tree.createFile({
					id: "2.2",
					name: "Section 2.2",
				}),
			],
		}),
	];
</script>

<Tree {tree}>
	{#snippet item({ node, editing })}
		<TreeItem editable draggable>
			{#if editing}
				<TreeItemInput />
			{:else}
				<span>{node.name}</span>
			{/if}
		</TreeItem>
	{/snippet}
</Tree>
```
