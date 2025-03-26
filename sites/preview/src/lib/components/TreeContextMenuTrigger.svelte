<script lang="ts">
	import { ContextMenu } from "bits-ui";
	import type { EventHandler } from "svelte/elements";
	import { getTreeContextMenuContext } from "./TreeContextMenu.svelte";

	const contextMenu = getTreeContextMenuContext();

	let { ref = $bindable(null), oncontextmenu, ...rest }: ContextMenu.TriggerProps = $props();

	const handleContextMenu: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
		oncontextmenu?.(event);

		if (event.defaultPrevented) {
			return;
		}

		if (event.target instanceof Element && event.target.closest("[role='treeitem']") === null) {
			contextMenu.show({ type: "tree" });
		}
	};
</script>

<ContextMenu.Trigger {...rest} bind:ref oncontextmenu={handleContextMenu} />
