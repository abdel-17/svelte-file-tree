<script lang="ts">
	import Tree from "$lib/components/Tree.svelte";
	import { FileNode, FolderNode, type FileTreeNode } from "svelte-file-tree";
	import { files } from "./files.js";

	const root = new FolderNode({
		id: crypto.randomUUID(),
		name: "",
		children: files.map(function transform(file): FileTreeNode {
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
				});
			}
		}),
	});
</script>

<Tree {root} />
