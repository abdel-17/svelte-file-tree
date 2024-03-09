<script lang="ts" context="module">
	type TreeContext = {
		getItemId: (node: TreeNode<any>) => string;
		expandedIds: WritableSet<string>;
		selectedIds: WritableSet<string>;
		focusableId: Writable<string | null>;
	};

	const contextKey = Symbol();

	export function getTreeContext(): TreeContext {
		return getContext(contextKey);
	}
</script>

<script lang="ts" strictEvents>
	import { flattenTree, type Tree, type TreeNode } from "$lib/helpers/tree.js";
	import { withChangeListener } from "$lib/helpers/with-change-listener.js";
	import { writableSet, type WritableSet } from "$lib/helpers/writable-set.js";
	import { getContext, setContext } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { writable, type Writable } from "svelte/store";

	type Value = $$Generic;

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		tree: Tree<Value> | Tree<Value>[];
		getItemId: (item: TreeNode<Value>) => string;
		expandedIds?: Set<string>;
		selectedIds?: Set<string>;
	}

	export let tree: $$Props["tree"];
	export let getItemId: $$Props["getItemId"];
	export let expandedIds = new Set<string>();
	export let selectedIds = new Set<string>();

	$: items = Array.isArray(tree) ? flattenTree(...tree) : flattenTree(tree);

	const context: TreeContext = setContext(contextKey, {
		getItemId,
		expandedIds: withChangeListener(writableSet(expandedIds), (value) => {
			expandedIds = value;
		}),
		selectedIds: withChangeListener(writableSet(selectedIds), (value) => {
			selectedIds = value;
		}),
		focusableId: writable(null),
	});

	$: context.expandedIds.set(expandedIds);
	$: context.selectedIds.set(selectedIds);
</script>

<div role="tree" aria-multiselectable="true" data-tree-view {...$$restProps}>
	{#each items as item (context.getItemId(item))}
		<slot {item} />
	{/each}
</div>
