<script lang="ts" context="module">
	export type TreeContext = {
		expandedIds: WritableSet<string>;
		selectedIds: WritableSet<string>;
		focusableId: Writable<string | null>;
	};

	const contextKey = Symbol();

	export function getTreeContext(): TreeContext {
		return getContext(contextKey);
	}
</script>

<script lang="ts" generics="Value" strictEvents>
	import { flattenTree, type TreeList } from "$lib/helpers/tree.js";
	import { withChangeListener } from "$lib/helpers/with-change-listener.js";
	import { writableSet, type WritableSet } from "$lib/helpers/writable-set.js";
	import { getContext, setContext } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { writable, type Writable } from "svelte/store";

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
		expandedIds: withChangeListener(writableSet(expandedIds), (value) => {
			expandedIds = value;
		}),
		selectedIds: withChangeListener(writableSet(selectedIds), (value) => {
			selectedIds = value;
		}),
		focusableId: writable(null),
	} satisfies TreeContext;

	$: context.expandedIds.set(expandedIds);
	$: context.selectedIds.set(selectedIds);

	setContext(contextKey, context);
</script>

<div role="tree" aria-multiselectable="true" data-tree-view {...$$restProps}>
	{#each items as item, index (item.id)}
		<slot {item} {index} />
	{/each}
</div>
