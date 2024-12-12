<script lang="ts">
	import FileIcon from "lucide-svelte/icons/file";
	import FolderIcon from "lucide-svelte/icons/folder";
	import FolderOpenIcon from "lucide-svelte/icons/folder-open";
	import { FileTree, Tree, TreeItem, TreeItemNameInput, type FileTreeNode } from "svelte-file-tree";
	import { toast, Toaster } from "svelte-sonner";

	const { data } = $props();

	const tree = new FileTree({ items: data.items });

	function onMoveItem(node: FileTreeNode, index: number) {
		toast.info("onMoveItem", {
			description: `(${node.name}, ${index})`,
		});
	}

	function onDeleteItems(nodes: FileTreeNode[]) {
		toast.info("onDeleteItems", {
			description: JSON.stringify(
				nodes.map((node) => node.name),
				null,
				"\t",
			),
			descriptionClass: "whitespace-pre-wrap",
		});
	}

	function onRename(name: string) {
		toast.info("onRename", {
			description: name,
		});
	}

	function onDiscard() {
		toast.info("onDiscard");
	}

	function onDuplicateError(name: string) {
		toast.info("onDuplicate", {
			description: name,
		});
	}
</script>

<Toaster richColors />
<main class="p-8">
	<Tree {tree} class="space-y-4">
		{#snippet item(node)}
			<TreeItem
				editable
				draggable
				style="--depth: {node.depth}"
				class="relative ms-[calc(var(--spacing)*var(--depth)*4)] flex items-center gap-2 rounded-md border border-neutral-400 p-3 hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-neutral-300 aria-selected:border-blue-400 aria-selected:bg-blue-200 aria-selected:text-blue-800"
				{onMoveItem}
				{onDeleteItems}
			>
				{#snippet children({ editing, dropPosition })}
					<div
						aria-hidden="true"
						data-drop-position={dropPosition}
						class="pointer-events-none absolute -inset-[2px] rounded-[inherit] border-2 border-transparent data-[drop-position='after']:border-b-red-500 data-[drop-position='before']:border-t-red-500 data-[drop-position='inside']:border-red-500"
					></div>

					{#if node.isFolder()}
						{#if node.expanded}
							<FolderOpenIcon
								role="presentation"
								class="fill-blue-300"
								onclick={() => node.collapse()}
							/>
						{:else}
							<FolderIcon role="presentation" class="fill-blue-300" onclick={() => node.expand()} />
						{/if}
					{:else}
						<FileIcon role="presentation" />
					{/if}

					{#if editing}
						<TreeItemNameInput
							class="border bg-white focus:outline-none"
							{onRename}
							{onDiscard}
							{onDuplicateError}
						/>
					{:else}
						<span class="select-none">{node.name}</span>
					{/if}
				{/snippet}
			</TreeItem>
		{/snippet}
	</Tree>
</main>
