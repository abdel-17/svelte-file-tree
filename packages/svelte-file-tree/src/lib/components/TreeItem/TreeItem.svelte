<script lang="ts" module>
	import { composeEventHandlers } from "$lib/internal/helpers.svelte.js";
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext } from "svelte";
	import { getTreeContext } from "../Tree/Tree.svelte";
	import { getTreeItemProviderContext } from "../Tree/TreeItemProvider.svelte";
	import { DropPositionState, TreeItemAttributes, TreeItemContext } from "./state.svelte.js";
	import type { TreeItemProps } from "./types.js";

	const CONTEXT_KEY = Symbol("TreeItem");

	export function getTreeItemContext(): TreeItemContext {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <TreeItem> found");
		}
		return getContext(CONTEXT_KEY);
	}
</script>

<script lang="ts">
	const itemProviderContext = getTreeItemProviderContext();
	const treeContext = getTreeContext();

	let {
		children,
		editable = false,
		editing = $bindable(false),
		disabled = false,
		element = $bindable(null),
		class: className,
		style,
		onfocusin,
		onkeydown,
		onclick,
		ondragstart,
		ondragover,
		ondragleave,
		ondrop,
		ondragend,
		...rest
	}: TreeItemProps = $props();

	$effect(() => {
		treeContext.onSetItem(itemProviderContext);
	});

	$effect(() => {
		return () => {
			treeContext.onDestroyItem(itemProviderContext.node.id);
		};
	});

	const dropPositionState = new DropPositionState({ itemProviderContext });
	const itemContext = new TreeItemContext({
		editable: () => editable,
		editing: () => editing,
		setEditing: (value) => {
			editing = value;
		},
		disabled: () => disabled,
		dropPositionState,
	});
	setContext(CONTEXT_KEY, itemContext);

	const attributes = new TreeItemAttributes({
		treeContext,
		itemProviderContext,
		itemContext,
		dropPositionState,
	});
</script>

<div
	bind:this={element}
	{...rest}
	id={attributes.id}
	role="treeitem"
	aria-selected={attributes.ariaSelected}
	aria-expanded={attributes.ariaExpanded}
	aria-level={attributes.ariaLevel}
	aria-posinset={attributes.ariaPosInSet}
	aria-setsize={attributes.ariaSetSize}
	tabindex={attributes.tabIndex}
	class={typeof className === "function" ? className(itemContext) : className}
	style={typeof style === "function" ? style(itemContext) : style}
	onfocusin={composeEventHandlers(onfocusin, attributes.onfocusin)}
	onkeydown={composeEventHandlers(onkeydown, attributes.onkeydown)}
	onclick={composeEventHandlers(onclick, attributes.onclick)}
	ondragstart={composeEventHandlers(ondragstart, attributes.ondragstart)}
	ondragover={composeEventHandlers(ondragover, attributes.ondragover)}
	ondragleave={composeEventHandlers(ondragleave, attributes.ondragleave)}
	ondrop={composeEventHandlers(ondrop, attributes.ondrop)}
	ondragend={composeEventHandlers(ondragend, attributes.ondragend)}
>
	{@render children(itemContext)}
</div>
