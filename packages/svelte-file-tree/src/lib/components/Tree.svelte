<script lang="ts" module>
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import type { TreeItemState, TreeProps } from "./types.js";

	const CONTEXT_KEY = Symbol("TreeContext");

	export type TreeState<T> = {
		get_id: (node: T) => string;
		get_children: (node: T) => T[] | undefined;
		has_children: (node: T) => boolean;
		get_selected_ids: () => SvelteSet<string>;
		get_expanded_ids: () => SvelteSet<string>;
		get_ref: () => HTMLDivElement | null;
		get_tabbable_id: () => string | undefined;
		set_tabbable_id: (value: string | undefined) => void;
		get_items: () => TreeItemState<T>[];
		on_focus: (item: TreeItemState<T>) => void;
		select_until: (index: number) => void;
	};

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
		getId = (node: any) => node.id,
		getChildren = (node: any) => node.children,
		hasChildren = (node) => {
			const children = getChildren(node);
			return children !== undefined && children.length !== 0;
		},
		defaultSelectedIds,
		selectedIds = new SvelteSet(defaultSelectedIds),
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
		ref = $bindable(null),
		onFocus = (item) => document.getElementById(item.elementId)?.focus(),
		children,
		...rest
	}: TreeProps<T> = $props();

	let tabbable_id: string | undefined = $state.raw();

	const items = $derived.by(() => {
		const result: TreeItemState<T>[] = [];

		function flatten(children: T[], parent?: TreeItemState<T>) {
			const depth = parent === undefined ? 0 : parent.depth + 1;
			for (let i = 0; i < children.length; i++) {
				const node = children[i];
				const id = getId(node);
				const item: TreeItemState<T> = {
					id,
					elementId: `${uid}-${id}`,
					node,
					index: result.length,
					depth,
					parent,
					parentChildren: children,
					indexInChildren: i,
					expanded: expandedIds.has(id),
				};
				result.push(item);

				if (item.expanded) {
					const children = getChildren(node);
					if (children !== undefined) {
						flatten(children, item);
					}
				}
			}
		}
		flatten(root);

		return result;
	});

	const lookup = $derived.by(() => {
		const result = new Map<string, TreeItemState<T>>();
		for (const item of items) {
			result.set(item.id, item);
		}
		return result;
	});

	export function getItems() {
		return items;
	}

	export function getItem(id: string) {
		return lookup.get(id);
	}

	function select_until(index: number) {
		if (index < 0 || index >= items.length) {
			return;
		}

		let start_index = 0;
		for (const id of Array.from(selectedIds).reverse()) {
			const item = lookup.get(id);
			if (item !== undefined) {
				start_index = item.index;
				break;
			}
		}

		if (start_index < index) {
			for (let i = start_index + 1; i <= index; i++) {
				selectedIds.add(items[i].id);
			}
		} else if (start_index > index) {
			for (let i = start_index - 1; i >= index; i--) {
				selectedIds.add(items[i].id);
			}
		}
	}

	const tree_state: TreeState<T> = {
		get_id: (node) => getId(node),
		get_children: (node) => getChildren(node),
		has_children: (node) => hasChildren(node),
		get_selected_ids: () => selectedIds,
		get_expanded_ids: () => expandedIds,
		get_ref: () => ref,
		get_tabbable_id: () => tabbable_id,
		set_tabbable_id: (value) => {
			tabbable_id = value;
		},
		get_items: () => items,
		on_focus: (item) => onFocus(item),
		select_until,
	};
	setContext(CONTEXT_KEY, tree_state);
</script>

<div {...rest} bind:this={ref} role="tree" aria-multiselectable="true">
	{@render children?.({ items })}
</div>
