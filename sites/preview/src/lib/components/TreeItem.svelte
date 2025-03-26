<script lang="ts">
	import {
		TreeItem,
		type PasteOperation,
		type TreeItemProps,
		type TreeItemState,
	} from "svelte-file-tree";
	import type { EventHandler } from "svelte/elements";
	import { getTreeContextMenuContext } from "./TreeContextMenu.svelte";

	const contextMenu = getTreeContextMenuContext();

	interface Props extends TreeItemProps {
		item: TreeItemState;
		onCopy: (operation: PasteOperation) => void;
		onPaste: () => void;
		onDelete: () => void;
	}

	let {
		item,
		onCopy,
		onPaste,
		onDelete,
		editing = $bindable(false),
		ref = $bindable(null),
		oncontextmenu,
		...rest
	}: Props = $props();

	const handleContextMenu: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		oncontextmenu?.(event);

		if (event.defaultPrevented) {
			return;
		}

		if (item.disabled()) {
			event.preventDefault();
			return;
		}

		contextMenu.show({
			type: "item",
			item: () => item,
			onRename: () => {
				editing = true;
			},
			onCopy: () => {
				onCopy("copy");
			},
			onCut: () => {
				onCopy("cut");
			},
			onPaste: () => {
				onPaste();
			},
			onDelete: () => {
				onDelete();
			},
		});
	};

	$effect(() => {
		return () => {
			// Don't leave the context menu open after the item is unmounted.
			const menuState = contextMenu.state();
			if (menuState?.type === "item" && menuState.item() === item) {
				contextMenu.close();
			}
		};
	});
</script>

<TreeItem {...rest} bind:editing bind:ref oncontextmenu={handleContextMenu} />
