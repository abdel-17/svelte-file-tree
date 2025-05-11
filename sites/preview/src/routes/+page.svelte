<script lang="ts">
	import Tree from "$lib/components/Tree.svelte";
	import { FileNode, FileTree, FolderNode, type FileTreeNode } from "$lib/tree.svelte.js";
	import { files } from "./files.js";

	const tree = new FileTree(
		files.map(function transform(file): FileTreeNode {
			const id = crypto.randomUUID();
			if ("children" in file) {
				return new FolderNode({
					id,
					name: file.name,
					children: file.children.map(transform),
				});
			} else {
				return new FileNode({
					id,
					name: file.name,
					size: file.size,
				});
			}
		}),
	);
</script>

<main class="p-8">
	<Tree {tree} />
</main>
