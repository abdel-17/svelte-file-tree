<script lang="ts" generics="TData extends FileTreeNodeData = FileTreeNodeData">
	import {
		Tree,
		type AlreadyExistsErrorArgs,
		type CircularReferenceErrorArgs,
		type FileTreeNodeData,
		type TreeProps,
	} from "svelte-file-tree";
	import { toast } from "svelte-sonner";
	import NameConflictDialog from "./NameConflictDialog.svelte";
	import { getTreeContextMenuContext } from "./TreeContextMenu.svelte";

	const contextMenu = getTreeContextMenuContext();

	let {
		pasteOperation = $bindable(),
		ref = $bindable(null),
		onResolveNameConflict = ({ operation, name }) => {
			return new Promise((resolve) => {
				if (nameConflictDialog === null) {
					throw new Error("Dialog is not mounted");
				}

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

				nameConflictDialog.show({
					title,
					description: `An item with the name "${name}" already exists`,
					onClose: resolve,
				});
			});
		},
		onAlreadyExistsError,
		onCircularReferenceError,
		...rest
	}: TreeProps<TData> = $props();

	let nameConflictDialog: NameConflictDialog | null = $state.raw(null);

	function handleAlreadyExistsError(args: AlreadyExistsErrorArgs): void {
		onAlreadyExistsError?.(args);
		toast.error(`An item with the name "${args.name}" already exists`);
	}

	function handleCircularReferenceError(args: CircularReferenceErrorArgs<TData>): void {
		onCircularReferenceError?.(args);
		toast.error(`Cannot move "${args.target.data.name}" ${args.position} itself`);
	}

	$effect(() => {
		return () => {
			// Don't leave the context menu open after the tree is unmounted.
			if (contextMenu.state() !== undefined) {
				contextMenu.close();
			}
		};
	});
</script>

<Tree
	{...rest}
	{onResolveNameConflict}
	bind:pasteOperation
	bind:ref
	onAlreadyExistsError={handleAlreadyExistsError}
	onCircularReferenceError={handleCircularReferenceError}
/>

<NameConflictDialog bind:this={nameConflictDialog} />
