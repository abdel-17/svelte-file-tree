<script lang="ts" module>
	import { Dialog } from "bits-ui";
	import {
		Tree,
		type MoveErrorArgs,
		type NameConflictArgs,
		type NameConflictResolution,
		type RenameErrorArgs,
		type TreeProps,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";
	import { SvelteSet } from "svelte/reactivity";
	import { fade, fly } from "svelte/transition";
	import TreeItem from "./TreeItem.svelte";

	function createDialogState<TData, TResult>() {
		let dialogData = $state.raw<TData>();
		let resolveOpenDialog: ((result: TResult) => void) | undefined;

		function openDialog(data: TData): Promise<TResult> {
			if (dialogData !== undefined) {
				throw new Error("The dialog is already open");
			}

			dialogData = data;
			return new Promise((resolve) => {
				resolveOpenDialog = resolve;
			});
		}

		function closeDialog(result: TResult): void {
			resolveOpenDialog?.(result);
			dialogData = undefined;
			resolveOpenDialog = undefined;
		}

		return {
			dialogData: () => dialogData,
			openDialog,
			closeDialog,
		};
	}
</script>

<script lang="ts">
	let {
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
		pasteOperation = $bindable(),
		ref = $bindable(null),
		class: className,
		onRenameError,
		onMoveError,
		onNameConflict,
		...rest
	}: Omit<TreeProps, "item"> = $props();

	const { dialogData, openDialog, closeDialog } = createDialogState<
		{
			title: string;
			description: string;
		},
		NameConflictResolution
	>();

	function handleRenameError(args: RenameErrorArgs): void {
		onRenameError?.(args);

		const { error, name } = args;
		switch (error) {
			case "empty": {
				toast.error("Name cannot be empty");
				break;
			}
			case "already-exists": {
				toast.error(`An item with the name "${name}" already exists`);
				break;
			}
		}
	}

	function handleMoveError(args: MoveErrorArgs): void {
		onMoveError?.(args);

		const { target } = args;
		toast.error(`Cannot move "${target.name}" into or next to itself`);
	}

	function handleNameConflict(args: NameConflictArgs): Promise<NameConflictResolution> {
		onNameConflict?.(args);

		const { target, operation } = args;
		const description = `An item with the name "${target.name}" already exists`;
		switch (operation) {
			case "move": {
				return openDialog({
					title: "Failed to move items",
					description,
				});
			}
			case "insert": {
				return openDialog({
					title: "Failed to paste items",
					description,
				});
			}
		}
	}
</script>

<Tree
	{...rest}
	{expandedIds}
	bind:pasteOperation
	bind:ref
	class={["space-y-4", className]}
	onRenameError={handleRenameError}
	onMoveError={handleMoveError}
	onNameConflict={handleNameConflict}
>
	{#snippet item({ node, depth, expanded, dragged })}
		<TreeItem
			{node}
			{depth}
			expanded={expanded()}
			dragged={dragged()}
			onExpand={() => {
				expandedIds.add(node.id);
			}}
			onCollapse={() => {
				expandedIds.delete(node.id);
			}}
		/>
	{/snippet}
</Tree>

<Dialog.Root
	open={dialogData() !== undefined}
	onOpenChange={(open) => {
		if (!open) {
			closeDialog("cancel");
		}
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay forceMount class="fixed inset-0 z-50 bg-black/50">
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:fade={{ duration: 200 }}></div>
				{/if}
			{/snippet}
		</Dialog.Overlay>

		<Dialog.Content
			forceMount
			class="fixed top-0 left-1/2 z-50 w-xs -translate-x-1/2 rounded-b-lg bg-neutral-200 p-4 md:w-md"
		>
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:fly={{ y: "-100%" }}>
						<Dialog.Title class="text-center text-lg font-semibold tracking-tight">
							{dialogData()?.title}
						</Dialog.Title>

						<Dialog.Description class="mt-2 text-sm text-gray-700">
							{dialogData()?.description}
						</Dialog.Description>

						<div class="mt-5 flex justify-end gap-3">
							<button
								class="rounded-md border-1 border-current bg-neutral-100 px-3 py-1.5 text-sm leading-5 font-semibold text-neutral-800 hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-neutral-300"
								onclick={() => closeDialog("skip")}
							>
								Skip
							</button>

							<button
								class="rounded-md border-1 border-current bg-red-100 px-3 py-1.5 text-sm leading-5 font-semibold text-red-800 hover:bg-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-red-300"
								onclick={() => closeDialog("cancel")}
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
