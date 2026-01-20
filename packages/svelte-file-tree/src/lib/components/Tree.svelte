<script lang="ts" module>
	import { noop } from "$lib/internal/helpers.js";
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { create_tree_state, type TreeState } from "./state.svelte.js";
	import type { TreeProps } from "./types.js";

	const CONTEXT_KEY = Symbol("TreeContext");

	export function get_tree_state<T>(): TreeState<T> {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <Tree> found");
		}
		return getContext(CONTEXT_KEY);
	}
</script>

<script lang="ts" generics="T">
	const uid = $props.id();
	let {
		root,
		getId = (data: any) => data.id,
		getChildren = (data: any) => data.children,
		hasChildren = (data) => {
			const children = getChildren(data);
			return children !== undefined && children.length !== 0;
		},
		defaultSelectedIds,
		selectedIds = new SvelteSet(defaultSelectedIds),
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
		defaultClipboardIds,
		clipboardIds = new SvelteSet(defaultClipboardIds),
		pasteOperation = $bindable(),
		ref = $bindable(null),
		onFocus = (item) => document.getElementById(item.elementId)?.focus(),
		onCircularReference = noop,
		onCopy = noop,
		onMove = noop,
		onRemove = noop,
		children,
		...rest
	}: TreeProps<T> = $props();

	const tree_state = create_tree_state({
		uid,
		root: () => root,
		get_id: (data) => getId(data),
		get_children: (data) => getChildren(data),
		has_children: (data) => hasChildren(data),
		selected_ids: () => selectedIds,
		expanded_ids: () => expandedIds,
		clipboard_ids: () => clipboardIds,
		paste_operation: () => pasteOperation,
		set_paste_operation: (value) => {
			pasteOperation = value;
		},
		ref: () => ref,
		on_focus: (args) => onFocus(args),
		on_circular_reference: (args) => onCircularReference(args),
		on_copy: (args) => onCopy(args),
		on_move: (args) => onMove(args),
		on_remove: (args) => onRemove(args),
	});
	setContext(CONTEXT_KEY, tree_state);

	export const getItems = tree_state.get_items;
	export const getItem = tree_state.get_item;
	export const remove = tree_state.remove;
	export const paste = tree_state.paste;
</script>

<div {...rest} bind:this={ref} role="tree" aria-multiselectable="true">
	{@render children?.({ items: getItems() })}
</div>
