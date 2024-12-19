<script lang="ts">
	import FileIcon from "lucide-svelte/icons/file";
	import FolderIcon from "lucide-svelte/icons/folder";
	import FolderOpenIcon from "lucide-svelte/icons/folder-open";
	import {
		FileTree,
		Tree,
		TreeItem,
		TreeItemInput,
		type FileTreeNode,
		type TreeCallbacks,
	} from "svelte-file-tree";
	import { toast, Toaster } from "svelte-sonner";
	import data from "./data.json";

	function createTreeNodes(tree: FileTree, items: typeof data): FileTreeNode[] {
		return items.map(({ id, name, children }) => {
			if (children !== undefined) {
				return tree.createFolder({
					id,
					name,
					children: createTreeNodes(tree, children),
				});
			} else {
				return tree.createFile({ id, name });
			}
		});
	}

	const tree = new FileTree();
	tree.nodes = createTreeNodes(tree, data);

	const callbacks: TreeCallbacks = {
		onMoveItems(nodes, start, count) {
			console.info("onMoveItems", { nodes, start, count });
		},
		onInsertItems(nodes, start, count) {
			console.info("onInsertItems", { nodes, start, count });
		},
		onDeleteItems(nodes) {
			console.info("onDeleteItems", nodes);
		},
		onRenameItem(node) {
			console.info("onRenameItem", node);
		},
		onRenameError(_node, error) {
			switch (error.type) {
				case "empty": {
					toast.error("Name cannot be empty");
					break;
				}
				case "duplicate": {
					toast.error(`"${error.name}" already exists`);
				}
			}
		},
	};
</script>

<Toaster richColors />
<main class="p-8">
	<Tree {...callbacks} {tree} class="space-y-4">
		{#snippet item({ node, editing, dropPosition })}
			<TreeItem
				editable
				draggable
				style="--depth: {node.depth}"
				class="relative ms-[calc(var(--spacing)*var(--depth)*4)] flex items-center gap-2 rounded-md border border-neutral-400 p-3 hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-neutral-300 aria-selected:border-blue-400 aria-selected:bg-blue-200 aria-selected:text-blue-800"
			>
				<div
					aria-hidden="true"
					data-drop-position={dropPosition}
					class="pointer-events-none absolute -inset-[2px] rounded-[inherit] border-2 border-transparent data-[drop-position='after']:border-b-red-500 data-[drop-position='before']:border-t-red-500 data-[drop-position='inside']:border-red-500"
				></div>

				{#if node.type === "file"}
					<FileIcon role="presentation" />
				{:else if node.expanded}
					<FolderOpenIcon
						role="presentation"
						class="fill-blue-300"
						onclick={() => tree.expanded.delete(node.id)}
					/>
				{:else}
					<FolderIcon
						role="presentation"
						class="fill-blue-300"
						onclick={() => tree.expanded.add(node.id)}
					/>
				{/if}

				{#if editing}
					<TreeItemInput class="border bg-white focus:outline-none" />
				{:else}
					<span class="select-none">{node.name}</span>
				{/if}
			</TreeItem>
		{/snippet}
	</Tree>
</main>
