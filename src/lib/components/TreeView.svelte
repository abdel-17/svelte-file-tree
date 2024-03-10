<script lang="ts" context="module">
	export type TreeContext = {
		expandedIds: WritableSet<string>;
		selectedIds: WritableSet<string>;
		visibleIds: Readable<Set<string>>;
		items: Readable<TreeNode<unknown>[]>;
		focusableId: Writable<string | null>;
		clearSelectionOnBlur: Writable<boolean>;
	};

	const contextKey = Symbol();

	export function getTreeContext(): TreeContext {
		const context: TreeContext | undefined = getContext(contextKey);
		if (context === undefined) {
			throw new Error("Must be used within a <TreeView>");
		}
		return context;
	}
</script>

<script lang="ts" generics="Value" strictEvents>
	import { onChange } from "$lib/helpers/on-change.js";
	import {
		flattenTree,
		type TreeList,
		type TreeNode,
	} from "$lib/helpers/tree.js";
	import { writableSet, type WritableSet } from "$lib/helpers/writable-set.js";
	import { getContext, setContext } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { writable, type Readable, type Writable } from "svelte/store";

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		tree: TreeList<Value>;
		getItemId: (value: Value) => string;
		expandedIds?: Set<string>;
		selectedIds?: Set<string>;
	}

	export let tree: $$Props["tree"];
	export let getItemId: $$Props["getItemId"];
	export let expandedIds = new Set<string>();
	export let selectedIds = new Set<string>();

	$: items = flattenTree(tree, getItemId);

	const context = {
		expandedIds: onChange(writableSet(expandedIds), (value) => {
			expandedIds = value;
		}),
		selectedIds: onChange(writableSet(selectedIds), (value) => {
			selectedIds = value;
		}),
		visibleIds: writable(new Set()),
		items: writable(items),
		focusableId: writable(null),
		clearSelectionOnBlur: writable(true),
	} satisfies TreeContext;

	$: context.expandedIds.set(expandedIds);
	$: context.selectedIds.set(selectedIds);
	$: context.items.set(items);
	$: context.visibleIds.update((visibleIds) => {
		visibleIds.clear();

		let node = items[0];
		while (node !== undefined) {
			addVisibleIdsTo(visibleIds, node, expandedIds);
			node = node.nextSibling;
		}

		return visibleIds;
	});

	function addVisibleIdsTo(
		target: Set<string>,
		node: TreeNode<Value>,
		expandedIds: Set<string>,
	) {
		target.add(node.id);

		if (!expandedIds.has(node.id)) {
			return;
		}

		for (const child of node.children) {
			addVisibleIdsTo(target, child, expandedIds);
		}
	}

	setContext(contextKey, context);
</script>

<div role="tree" aria-multiselectable="true" data-tree-view {...$$restProps}>
	<slot {items} />
</div>
