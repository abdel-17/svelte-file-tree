<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import type { TreeItemState } from "svelte-file-tree";
	import type { EventHandler, HTMLButtonAttributes } from "svelte/elements";

	interface Props extends Omit<HTMLButtonAttributes, "children" | "aria-expanded" | "tabindex"> {
		item: TreeItemState;
		onExpand: () => void;
		onCollapse: () => void;
		ref?: HTMLButtonElement | null;
	}

	let {
		item,
		onExpand,
		onCollapse,
		ref = $bindable(null),
		class: className,
		onclick,
		...rest
	}: Props = $props();

	const handleClick: EventHandler<MouseEvent, HTMLButtonElement> = (event) => {
		onclick?.(event);

		if (event.defaultPrevented) {
			return;
		}

		if (item.disabled()) {
			event.preventDefault();
			return;
		}

		if (item.expanded()) {
			onCollapse();
		} else {
			onExpand();
		}

		event.stopPropagation();
		event.currentTarget.closest<HTMLElement>("[role='treeitem']")?.focus();
	};
</script>

<button
	{...rest}
	bind:this={ref}
	aria-expanded={item.expanded()}
	tabindex={-1}
	class={[
		"rounded-full transition-transform duration-200 hover:bg-current/8 active:bg-current/12",
		item.expanded() && "-rotate-90",
		item.node.type === "file" && "invisible",
		className,
	]}
	onclick={handleClick}
>
	<span class="sr-only">Toggle expansion</span>
	<ChevronDownIcon role="presentation" size={20} />
</button>
