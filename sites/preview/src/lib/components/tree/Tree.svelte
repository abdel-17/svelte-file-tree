<script lang="ts">
	import { FileNode, FileTree, FolderNode, type FileTreeNode } from "$lib/tree.svelte.js";
	import { composeEventHandlers, formatSize } from "$lib/utils.js";
	import { ContextMenu } from "bits-ui";
	import {
		Tree,
		type CircularReferenceErrorArgs,
		type NameConflictResolution,
		type ResolveNameConflictArgs,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";
	import type { EventHandler } from "svelte/elements";
	import { SvelteSet } from "svelte/reactivity";
	import FileDropToastDescription from "./FileDropToastDescription.svelte";
	import NameConflictDialog from "./NameConflictDialog.svelte";
	import NameFormDialog from "./NameFormDialog.svelte";
	import TreeContextMenu from "./TreeContextMenu.svelte";
	import TreeItem from "./TreeItem.svelte";
	import {
		createContextMenuState,
		createFileDropToastState,
		createFileInputState,
		createNameConflictDialogState,
		createNameFormDialogState,
	} from "./state.svelte.js";
	import type { TreeItemState, TreeProps, UploadFilesArgs } from "./types.js";

	let {
		tree,
		onRenameItem = ({ target, name }) => {
			target.node.name = name;
			return true;
		},
		onCreateFolder = ({ target, name }) => {
			const folder = new FolderNode({
				id: crypto.randomUUID(),
				name,
				children: [],
			});
			target.children.push(folder);
			return true;
		},
		onUploadFiles = ({ target, files }) => {
			for (const file of files) {
				const node = new FileNode({
					id: crypto.randomUUID(),
					name: file.name,
					size: file.size,
				});
				target.children.push(node);
			}
			return true;
		},
		defaultSelectedIds,
		selectedIds = new SvelteSet(defaultSelectedIds),
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
		defaultClipboardIds,
		clipboardIds = new SvelteSet(defaultClipboardIds),
		pasteOperation = $bindable(),
		ref = $bindable(null),
		onfocusout,
		...rest
	}: TreeProps = $props();

	let treeComponent: Tree<FileTreeNode> | null = $state.raw(null);
	let fileInput: HTMLInputElement | null = $state.raw(null);

	let focusedItemId: string | undefined = $state.raw();
	const pasteDirection = $derived.by(() => {
		if (pasteOperation === undefined || focusedItemId === undefined) {
			return;
		}

		if (expandedIds.has(focusedItemId)) {
			return "Inside";
		}

		return "After";
	});

	const nameConflictDialogState = createNameConflictDialogState();
	const nameFormDialogState = createNameFormDialogState();
	const fileInputState = createFileInputState({
		ref: () => fileInput,
	});

	function showAlreadyExistsToast(name: string) {
		toast.error(`An item with the name "${name}" already exists`);
	}

	function handleRename(target: TreeItemState) {
		nameFormDialogState.show({
			title: "Rename",
			name: target.node.name,
			onSubmit: async (name) => {
				if (name === target.node.name) {
					nameFormDialogState.close();
					return;
				}

				const owner = target.parent?.node ?? tree;
				for (const child of owner.children) {
					if (child !== target.node && child.name === name) {
						showAlreadyExistsToast(name);
						return;
					}
				}

				const didRename = await onRenameItem({ target, name });
				if (didRename) {
					nameFormDialogState.close();
				}
			},
		});
	}

	function handleUploadFiles({ target, files }: UploadFilesArgs) {
		for (const child of target.children) {
			for (const file of files) {
				if (child.name === file.name) {
					showAlreadyExistsToast(file.name);
					return;
				}
			}
		}

		const uploadPromise = Promise.resolve(onUploadFiles({ target, files }));
		const name = target instanceof FileTree ? "/" : target.name;
		toast.promise(uploadPromise, {
			loading: `Uploading ${files.length} file(s) to ${name}`,
			success: (didUpload) => {
				if (!didUpload) {
					return "Failed to upload files";
				}

				return `Uploaded ${files.length} file(s) to ${name}`;
			},
			error: (error) => {
				throw error;
			},
		});
	}

	const contextMenuState = createContextMenuState({
		onRename: handleRename,
		onCopy: (target) => treeComponent!.copy(target, "copy"),
		onCut: (target) => treeComponent!.copy(target, "cut"),
		onPaste: (target) => treeComponent!.paste(target),
		onRemove: (target) => treeComponent!.remove(target),
		onCreateFolder: (target) => {
			nameFormDialogState.show({
				title: "New Folder",
				onSubmit: async (name) => {
					for (const child of target.children) {
						if (child.name === name) {
							showAlreadyExistsToast(name);
							return;
						}
					}

					const didCreate = await onCreateFolder({ target, name });
					if (didCreate) {
						nameFormDialogState.close();
					}
				},
			});
		},
		onUploadFiles: (target) => {
			fileInputState.showPicker({
				onPick: (files) => handleUploadFiles({ target, files }),
			});
		},
	});

	const fileDropToastState = createFileDropToastState({
		onShow: ({ target, toastId }) => {
			return toast("Drop files to upload them to:", {
				description: FileDropToastDescription as any,
				componentProps: {
					description: target.type === "tree" ? "/" : target.item().node.name,
				},
				classes: {
					toast: "pointer-events-none !bg-blue-100",
					title: "!text-sm !font-semibold",
				},
				id: toastId,
				duration: Number.POSITIVE_INFINITY,
			});
		},
		onDismiss: ({ toastId }) => toast.dismiss(toastId),
	});

	function handleResolveNameConflict({ operation, name }: ResolveNameConflictArgs) {
		return new Promise<NameConflictResolution>((resolve) => {
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

			nameConflictDialogState.show({
				title,
				description: `An item with the name "${name}" already exists`,
				onClose: resolve,
			});
		});
	}

	function handleCircularReferenceError({
		target,
		position,
	}: CircularReferenceErrorArgs<FileTreeNode>) {
		toast.error(`Cannot move "${target.name}" ${position} itself`);
	}

	function handleExpand(target: TreeItemState) {
		expandedIds.add(target.node.id);
	}

	function handleCollapse(target: TreeItemState) {
		expandedIds.delete(target.node.id);
	}

	function handleItemFocusIn(target: TreeItemState) {
		focusedItemId = target.node.id;
	}

	const handleFocusOut: EventHandler<FocusEvent, HTMLDivElement> = () => {
		focusedItemId = undefined;
	};

	function isOrInsideTreeItem(target: EventTarget | null) {
		return target instanceof Element && target.closest("[role='treeitem']") !== null;
	}

	const handleTriggerContextMenu: EventHandler<Event, HTMLDivElement> = (event) => {
		if (isOrInsideTreeItem(event.target)) {
			return;
		}

		contextMenuState.setTarget({
			type: "tree",
			tree: () => tree,
		});
	};

	const handleTriggerDragOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		if (isOrInsideTreeItem(event.target)) {
			return;
		}

		if (!event.dataTransfer?.types.includes("Files")) {
			return;
		}

		fileDropToastState.setTarget({
			type: "tree",
		});
		event.preventDefault();
	};

	const handleTriggerDragLeave: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
			// Ignore if the files are dragged to a different element inside the tree.
			return;
		}

		fileDropToastState.dismiss();
	};

	const handleTriggerDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
		if (isOrInsideTreeItem(event.target)) {
			return;
		}

		const files = event.dataTransfer?.files;
		if (files === undefined || files.length === 0) {
			return;
		}

		fileDropToastState.dismiss();
		handleUploadFiles({
			target: tree,
			files,
		});
		event.preventDefault();
	};

	function handleCleanup(target: TreeItemState) {
		if (focusedItemId === target.node.id) {
			focusedItemId = undefined;
		}

		const menuTarget = contextMenuState.target();
		if (menuTarget?.type === "item" && menuTarget.item() === target) {
			contextMenuState.close();
		}

		const fileDropToastTarget = fileDropToastState.target();
		if (fileDropToastTarget?.type === "item" && fileDropToastTarget.item() === target) {
			fileDropToastState.dismiss();
		}
	}
</script>

<div class="root flex h-full flex-col">
	<div
		class="grid grid-cols-(--grid-cols) gap-x-(--grid-gap) border-b border-gray-300 px-[calc(var(--tree-inline-padding)+var(--grid-inline-padding))] py-2 text-sm font-semibold"
	>
		<div>Name</div>
		<div>Size</div>
		<div>Kind</div>
	</div>

	<TreeContextMenu
		target={contextMenuState.target()}
		onRename={contextMenuState.rename}
		onCopy={contextMenuState.copy}
		onCut={contextMenuState.cut}
		onPaste={contextMenuState.paste}
		onRemove={contextMenuState.remove}
		onCreateFolder={contextMenuState.createFolder}
		onUploadFiles={contextMenuState.uploadFiles}
		onClose={contextMenuState.close}
	>
		<ContextMenu.Trigger
			class="relative grow overflow-y-auto"
			oncontextmenu={handleTriggerContextMenu}
			ondragover={handleTriggerDragOver}
			ondragleave={handleTriggerDragLeave}
			ondrop={handleTriggerDrop}
		>
			<Tree
				{...rest}
				{tree}
				{selectedIds}
				{expandedIds}
				{clipboardIds}
				bind:this={treeComponent}
				bind:pasteOperation
				bind:ref
				class="h-full px-(--tree-inline-padding) py-2"
				copyNode={(node) => node.copy()}
				onResolveNameConflict={handleResolveNameConflict}
				onCircularReferenceError={handleCircularReferenceError}
				onfocusout={composeEventHandlers(onfocusout, handleFocusOut)}
			>
				{#snippet item({ item })}
					<TreeItem
						{item}
						fileDropToastTarget={fileDropToastState.target()}
						onFileDropToastTargetChange={fileDropToastState.setTarget}
						onDismissFileDropToast={fileDropToastState.dismiss}
						onExpand={handleExpand}
						onCollapse={handleCollapse}
						onRename={handleRename}
						onContextMenuTargetChange={contextMenuState.setTarget}
						onUploadFiles={handleUploadFiles}
						onCleanup={handleCleanup}
						onfocusin={() => handleItemFocusIn(item)}
					/>
				{/snippet}
			</Tree>
		</ContextMenu.Trigger>
	</TreeContextMenu>

	<div class="grid shrink-0 grid-cols-5 place-items-center bg-gray-200 p-2 text-sm">
		<div>
			<span class="font-medium text-gray-700">Items:</span>
			<span class="font-semibold text-gray-900">{tree.count}</span>
		</div>

		<div>
			<span class="font-medium text-gray-700">Selected:</span>
			<span class="font-semibold text-gray-900">{selectedIds.size}</span>
		</div>

		<div>
			<span class="font-medium text-gray-700">Clipboard:</span>
			<span class="font-semibold text-gray-900">{clipboardIds.size}</span>
		</div>

		<div>
			<span class="font-medium text-gray-700">Paste:</span>
			<span class="font-semibold text-gray-900">{pasteDirection}</span>
		</div>

		<div>
			<span class="font-medium text-gray-700">Total Size:</span>
			<span class="font-semibold text-gray-900">{formatSize(tree.size)}</span>
		</div>
	</div>
</div>

<NameConflictDialog
	open={nameConflictDialogState.open()}
	title={nameConflictDialogState.title()}
	description={nameConflictDialogState.description()}
	onClose={nameConflictDialogState.close}
/>

<NameFormDialog
	bind:name={nameFormDialogState.name, nameFormDialogState.setName}
	open={nameFormDialogState.open()}
	title={nameFormDialogState.title()}
	onSubmit={nameFormDialogState.submit}
	onClose={nameFormDialogState.close}
/>

<input
	bind:this={fileInput}
	type="file"
	multiple
	class="hidden"
	onchange={fileInputState.onchange}
	oncancel={fileInputState.oncancel}
/>

<style>
	.root {
		--grid-cols: 5fr 1fr 2fr;
		--grid-gap: calc(var(--spacing) * 4);
		--grid-inline-padding: calc(var(--spacing) * 3);
		--tree-inline-padding: calc(var(--spacing) * 6);
	}
</style>
