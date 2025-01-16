<script lang="ts">
	import FileIcon from "lucide-svelte/icons/file";
	import FolderIcon from "lucide-svelte/icons/folder";
	import FolderOpenIcon from "lucide-svelte/icons/folder-open";
	import {
		type FileOrFolder,
		FileTree,
		Tree,
		TreeItem,
		TreeItemInput,
		type TreeProps,
	} from "svelte-file-tree";
	import { Toaster, toast } from "svelte-sonner";
	import data from "./data.json";

	const tree = new FileTree();
	tree.children = data.map(function getChild({ id, name, children }): FileOrFolder {
		if (children === undefined) {
			return tree.file({ id, name });
		}
		return tree.folder({
			id,
			name,
			children: children.map(getChild),
		});
	});

	function onTreeChange(args: TreeProps.OnTreeChangeArgs): void {
		console.info("onTreeChange", args);
	}

	function onTreeChangeError(args: TreeProps.OnTreeChangeErrorArgs): void {
		switch (args.type) {
			case "rename:empty": {
				toast.error("The name cannot be empty");
				break;
			}
			case "rename:conflict": {
				toast.error(`An item with the name "${args.name}" already exists`);
				break;
			}
		}
	}
</script>

<Toaster richColors />
<main class="p-8">
	<Tree {tree} {onTreeChange} {onTreeChangeError} class="space-y-4">
		{#snippet item({ node, depth })}
			<TreeItem
				editable
				draggable
				style="--depth: {depth}"
				class="relative ms-[calc(var(--spacing)*var(--depth)*4)] flex items-center gap-2 rounded-md border border-neutral-400 p-3 hover:bg-neutral-200 focus:outline-2 focus:outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:border-blue-400 aria-selected:bg-blue-200 aria-selected:text-blue-800"
			>
				{#snippet children({ editing, dropPosition })}
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
							onclick={() => node.collapse()}
						/>
					{:else}
						<FolderIcon role="presentation" class="fill-blue-300" onclick={() => node.expand()} />
					{/if}

					{#if editing}
						<TreeItemInput class="border bg-white focus:outline-none" />
					{:else}
						<span class="select-none">{node.name}</span>
					{/if}
				{/snippet}
			</TreeItem>
		{/snippet}
	</Tree>
</main>
