<script lang="ts">
	import {
		FileNode,
		FolderNode,
		Tree,
		type FileTreeNode,
		type NameConflictResolution,
		type PasteOperation,
		type ResolveNameConflictArgs,
		type TreeItemState,
	} from "svelte-file-tree";
	import { SvelteSet } from "svelte/reactivity";
	import AddItemDialog from "./AddItemDialog.svelte";
	import NameConflictDialog from "./NameConflictDialog.svelte";
	import StyledTreeItem from "./StyledTreeItem.svelte";
	import type { StyledTreeProps } from "./types.js";

	let {
		defaultSelectedIds,
		selectedIds = new SvelteSet(defaultSelectedIds),
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
		defaultClipboardIds,
		clipboardIds = new SvelteSet(defaultClipboardIds),
		pasteOperation = $bindable(),
		ref = $bindable(null),
		onAddItems = ({ target, added }) => {
			target.children.push(...added);
			return true;
		},
		onAlreadyExistsError,
		class: className,
		...rest
	}: StyledTreeProps = $props();

	let addItemDialog: AddItemDialog | null = $state.raw(null);
	let nameConflictDialog: NameConflictDialog | null = $state.raw(null);

	function handleResolveNameConflict({
		name,
		operation,
	}: ResolveNameConflictArgs): Promise<NameConflictResolution> {
		let title: string;
		switch (operation) {
			case "move": {
				title = "Failed to move items";
				break;
			}
			case "copy-paste": {
				title = "Failed to paste items";
				break;
			}
		}

		return new Promise((resolve) => {
			if (nameConflictDialog === null) {
				throw new Error("The dialog is not mounted");
			}

			nameConflictDialog.open({
				title,
				description: `An item with the name "${name}" already exists`,
				onClose: resolve,
			});
		});
	}

	function handleExpandItem(item: TreeItemState): void {
		expandedIds.add(item.node.id);
	}

	function handleCollapseItem(item: TreeItemState): void {
		expandedIds.delete(item.node.id);
	}

	function handleCopyItem(item: TreeItemState, operation: PasteOperation): void {
		clipboardIds.clear();

		for (const id of selectedIds) {
			clipboardIds.add(id);
		}
		clipboardIds.add(item.node.id);

		pasteOperation = operation;
	}

	function handleAddItem(item: TreeItemState): void {
		if (addItemDialog === null) {
			throw new Error("The dialog is not mounted");
		}

		addItemDialog.open({
			onSubmit: async ({ type, name }) => {
				if (item.node.type === "file") {
					throw new Error("Cannot add an item to a file");
				}

				for (const child of item.node.children) {
					if (child.data.name === name) {
						onAlreadyExistsError?.({ name });
						return false;
					}
				}

				let node: FileTreeNode;
				switch (type) {
					case "file": {
						node = new FileNode({
							id: crypto.randomUUID(),
							data: { name },
						});
						break;
					}
					case "folder": {
						node = new FolderNode({
							id: crypto.randomUUID(),
							data: { name },
							children: [],
						});
						break;
					}
				}

				return await onAddItems({
					target: item.node,
					added: [node],
				});
			},
		});
	}
</script>

<Tree
	{...rest}
	{selectedIds}
	{expandedIds}
	{clipboardIds}
	bind:pasteOperation
	bind:ref
	onResolveNameConflict={handleResolveNameConflict}
	class={["space-y-4", className]}
>
	{#snippet item({ item, paste, remove })}
		<StyledTreeItem
			{item}
			onExpand={() => handleExpandItem(item)}
			onCollapse={() => handleCollapseItem(item)}
			onCopy={(operation) => handleCopyItem(item, operation)}
			onPaste={paste}
			onDelete={remove}
			onAdd={() => handleAddItem(item)}
		/>
	{/snippet}
</Tree>

<AddItemDialog bind:this={addItemDialog} />
<NameConflictDialog bind:this={nameConflictDialog} />
