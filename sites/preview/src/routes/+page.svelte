<script lang="ts" module>
	const sortCollator = new Intl.Collator();

	function sortComparator(x: FileTreeNode, y: FileTreeNode) {
		return sortCollator.compare(x.name, y.name);
	}

	type TreeItemData = {
		name: string;
		children?: Array<TreeItemData>;
	};

	const data: Array<TreeItemData> = [
		{
			name: "Applications",
			children: [
				{
					name: "App Store.app",
				},
				{
					name: "Facetime.app",
				},
				{
					name: "Mail.app",
				},
				{
					name: "Messages.app",
				},
				{
					name: "Music.app",
				},
				{
					name: "Safari.app",
				},
			],
		},
		{
			name: "Developer",
			children: [
				{
					name: "svelte-file-tree",
					children: [
						{
							name: "src",
							children: [
								{
									name: "components",
									children: [
										{
											name: "Tree.svelte",
										},
										{
											name: "TreeItem.svelte",
										},
										{
											name: "TreeItemInput.svelte",
										},
									],
								},
								{
									name: "index.ts",
								},
								{
									name: "tree.svelte.ts",
								},
							],
						},
						{
							name: "package.json",
						},
						{
							name: "README.md",
						},
					],
				},
				{
					name: "svelte-material-ripple",
					children: [
						{
							name: "src",
							children: [
								{
									name: "index.ts",
								},
								{
									name: "Ripple.svelte",
								},
							],
						},
						{
							name: "package.json",
						},
						{
							name: "README.md",
						},
					],
				},
			],
		},
		{
			name: "Documents",
			children: [
				{
					name: "Project Planning",
					children: [
						{
							name: "q1-goals.xlsx",
						},
						{
							name: "timeline.pdf",
						},
					],
				},
				{
					name: "meeting-notes.docx",
				},
				{
					name: "resume.pdf",
				},
			],
		},
		{
			name: "Downloads",
			children: [
				{
					name: "conference-slides.pptx",
				},
				{
					name: "typescript-cheatsheet.pdf",
				},
			],
		},
		{
			name: "Movies",
			children: [
				{
					name: "Finding Nemo.mp4",
				},
				{
					name: "Inside Out.mp4",
				},
				{
					name: "Up.mp4",
				},
			],
		},
		{
			name: "Pictures",
			children: [
				{
					name: "Screenshots",
					children: [
						{
							name: "bug-report.png",
						},
						{
							name: "component-diagram.png",
						},
						{
							name: "design-mockup.png",
						},
					],
				},
				{
					name: "profile-photo.jpg",
				},
			],
		},
		{
			name: "Videos",
			children: [
				{
					name: "Family Trip.mp4",
				},
				{
					name: "Finding Nemo.mp4",
				},
			],
		},
	];
</script>

<script lang="ts">
	import { SvelteSet } from "svelte/reactivity";
	import {
		FileNode,
		FileTree,
		FolderNode,
		Tree,
		TreeItem,
		type DragEventArgs,
		type FileTreeNode,
		type NameConflictResolution,
		type OnCircularReferenceArgs,
		type OnMoveArgs,
		type OnRemoveArgs,
		type OnResolveNameConflictArgs,
		type TreeItemState,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import { AlertDialog } from "bits-ui";
	import { fade, scale } from "svelte/transition";

	const root = new FileTree(
		data.map(function transform({ name, children }): FileTreeNode {
			const id = crypto.randomUUID();
			if (children !== undefined) {
				return new FolderNode({
					id,
					name,
					children: children.map(transform),
				});
			} else {
				return new FileNode({ id, name });
			}
		}),
	);
	const expandedIds = new SvelteSet<string>();

	let draggedId: string | undefined = $state.raw();
	let dropDestination: FolderNode | FileTree | undefined = $state.raw();

	let dialogOpen = $state.raw(false);
	let dialogTitle = $state.raw("");
	let dialogDescription = $state.raw("");
	let dialogConfirmLabel = $state.raw("");
	let dialogOnClose: (() => void) | undefined;
	let dialogDidConfirm = false;

	async function onResolveNameConflict({ operation, name }: OnResolveNameConflictArgs) {
		return new Promise<NameConflictResolution>((resolve) => {
			let title;
			switch (operation) {
				case "copy": {
					title = "Failed to copy items";
					break;
				}
				case "move": {
					title = "Failed to move items";
					break;
				}
			}

			dialogOpen = true;
			dialogTitle = title;
			dialogDescription = `An item named "${name}" already exists in this location. Do you want to skip it or cancel the operation entirely?`;
			dialogConfirmLabel = "Skip";
			dialogOnClose = () => {
				resolve(dialogDidConfirm ? "skip" : "cancel");
			};
		});
	}

	function onCircularReference({ source }: OnCircularReferenceArgs) {
		toast.error(`Cannot move "${source.node.name}" inside itself`);
	}

	function canRemove({ removed }: OnRemoveArgs) {
		return new Promise<boolean>((resolve) => {
			dialogOpen = true;
			dialogTitle = `Are you sure you want to delete ${removed.length} item(s)?`;
			dialogDescription = "They will be permanently deleted. This action cannot be undone.";
			dialogConfirmLabel = "Confirm";
			dialogOnClose = () => {
				resolve(dialogDidConfirm);
			};
		});
	}

	function onCopy({ destination }: OnMoveArgs) {
		destination.children.sort(sortComparator);
	}

	function onMove({ destination }: OnMoveArgs) {
		destination.children.sort(sortComparator);
	}

	function onDragStart(itemId: string) {
		draggedId = itemId;
	}

	function onDragEnd() {
		draggedId = undefined;
	}

	function onDrag({ destination }: DragEventArgs) {
		dropDestination = destination;
	}

	function onDragLeave() {
		dropDestination = undefined;
	}

	function onDrop({ type, items, destination }: DragEventArgs) {
		dropDestination = undefined;

		if (type !== "external") {
			return;
		}

		const uniqueNames = new Set();
		for (const child of destination.children) {
			uniqueNames.add(child.name);
		}

		const files: Array<FileNode> = [];
		for (const item of items) {
			const file = item.getAsFile();
			if (file === null) {
				continue;
			}

			const fileName = file.name;
			if (uniqueNames.has(fileName)) {
				toast.error(`An item named "${fileName}" already exists in this location`);
				return;
			}

			files.push(
				new FileNode({
					id: crypto.randomUUID(),
					name: fileName,
				}),
			);
		}

		destination.children.push(...files);
		destination.children.sort(sortComparator);
	}

	function onToggleExpansion(item: TreeItemState, event: MouseEvent) {
		event.preventDefault();

		if (item.expanded) {
			expandedIds.delete(item.node.id);
		} else {
			expandedIds.add(item.node.id);
		}
	}

	function onDialogOpenChangeComplete(open: boolean) {
		if (!open) {
			dialogTitle = "";
			dialogDescription = "";
			dialogConfirmLabel = "";
			dialogOnClose?.();
			dialogOnClose = undefined;
			dialogDidConfirm = false;
		}
	}

	function onDialogConfirm() {
		dialogOpen = false;
		dialogDidConfirm = true;
	}
</script>

<Tree
	{root}
	{expandedIds}
	{onResolveNameConflict}
	{onCircularReference}
	{canRemove}
	{onCopy}
	{onMove}
	{onDrag}
	{onDragLeave}
	{onDrop}
	class="min-h-svh p-6 focus-visible:outline-2 focus-visible:outline-current"
>
	{#snippet children({ items })}
		{#each items as item (item.node.id)}
			{#if item.visible}
				<TreeItem
					{item}
					{onDragLeave}
					data-dragged={draggedId === item.node.id ? true : undefined}
					data-drop-destination={dropDestination === item.node ? true : undefined}
					style="--depth: {item.depth}"
					class="group relative flex items-center bg-white p-3 ps-[calc(3*var(--spacing)+var(--depth)*6*var(--spacing))] before:pointer-events-none before:absolute before:inset-0 before:border-2 before:border-transparent before:transition-colors after:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-transparent after:transition-colors hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300 data-dragged:opacity-50 data-drop-destination:before:border-red-500"
					ondragstart={() => onDragStart(item.node.id)}
					ondragend={onDragEnd}
				>
					<ChevronDownIcon
						role="presentation"
						data-invisible={item.node.type === "file" ? true : undefined}
						class="size-5 rounded-full transition-transform duration-200 group-aria-expanded:-rotate-90 hover:bg-current/8 active:bg-current/12 data-invisible:invisible"
						onclick={(event) => onToggleExpansion(item, event)}
					/>

					<div class="ps-1 pe-2">
						{#if item.node.type === "file"}
							<FileIcon role="presentation" />
						{:else if item.expanded}
							<FolderOpenIcon role="presentation" class="fill-blue-300" />
						{:else}
							<FolderIcon role="presentation" class="fill-blue-300" />
						{/if}
					</div>

					{item.node.name}
				</TreeItem>
			{/if}
		{/each}
	{/snippet}
</Tree>

<AlertDialog.Root bind:open={dialogOpen} onOpenChangeComplete={onDialogOpenChangeComplete}>
	<AlertDialog.Portal>
		<AlertDialog.Overlay forceMount class="fixed inset-0 z-50 bg-black/80">
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:fade={{ duration: 200 }}></div>
				{/if}
			{/snippet}
		</AlertDialog.Overlay>

		<AlertDialog.Content
			forceMount
			class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-7 text-black shadow"
		>
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:scale={{ duration: 200 }}>
						<AlertDialog.Title class="text-lg font-semibold tracking-tight">
							{dialogTitle}
						</AlertDialog.Title>

						<AlertDialog.Description class="mt-2 text-sm text-gray-700">
							{dialogDescription}
						</AlertDialog.Description>

						<div class="mt-4 flex justify-end gap-2">
							<AlertDialog.Action
								class="inline-flex h-10 items-center justify-center rounded bg-gray-700 px-6 text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 active:scale-95"
								onclick={onDialogConfirm}
							>
								{dialogConfirmLabel}
							</AlertDialog.Action>

							<AlertDialog.Cancel
								class="inline-flex h-10 items-center justify-center rounded bg-gray-200 px-6 text-sm font-medium hover:bg-gray-300 focus-visible:outline-2 focus-visible:outline-current active:scale-95"
							>
								Cancel
							</AlertDialog.Cancel>
						</div>
					</div>
				{/if}
			{/snippet}
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
