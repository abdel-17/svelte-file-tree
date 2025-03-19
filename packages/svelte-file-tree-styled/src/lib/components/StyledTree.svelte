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
		type TreeProps,
	} from "svelte-file-tree";
	import { SvelteSet } from "svelte/reactivity";
	import AddItemDialog from "./AddItemDialog.svelte";
	import NameConflictDialog from "./NameConflictDialog.svelte";
	import StyledTreeItem from "./StyledTreeItem.svelte";

	let {
		defaultSelectedIds,
		selectedIds = new SvelteSet(defaultSelectedIds),
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
		defaultClipboardIds,
		clipboardIds = new SvelteSet(defaultClipboardIds),
		pasteOperation = $bindable(),
		ref = $bindable(null),
		onInsertItems = ({ inserted, start, target }) => {
			target.children.splice(start, 0, ...inserted);
			return true;
		},
		onAlreadyExistsError,
		class: className,
		...rest
	}: Omit<TreeProps, "item" | "onResolveNameConflict"> = $props();

	let addItemDialog: AddItemDialog | null = $state.raw(null);
	let nameConflictDialog: NameConflictDialog | null = $state.raw(null);

	function handleResolveNameConflict(
		args: ResolveNameConflictArgs,
	): Promise<NameConflictResolution> {
		const { operation, name } = args;
		const description = `An item with the name "${name}" already exists`;

		let title: string;
		switch (operation) {
			case "move": {
				title = "Failed to move items";
				break;
			}
			case "insert": {
				title = "Failed to add items";
				break;
			}
		}

		return new Promise((resolve) => {
			if (nameConflictDialog === null) {
				throw new Error("The dialog is not mounted");
			}

			nameConflictDialog.open({
				title,
				description,
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
					if (child.name === name) {
						onAlreadyExistsError?.({ name });
						return false;
					}
				}

				let node: FileTreeNode;
				switch (type) {
					case "file": {
						node = new FileNode({
							id: crypto.randomUUID(),
							name,
						});
						break;
					}
					case "folder": {
						node = new FolderNode({
							id: crypto.randomUUID(),
							name,
							children: [],
						});
						break;
					}
				}

				return await onInsertItems({
					inserted: [node],
					target: item.node,
					start: item.node.children.length,
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
	{onInsertItems}
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
