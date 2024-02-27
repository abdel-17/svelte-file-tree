<script lang="ts" context="module">
	type TreeContext = {
		idPrefix: string;
		nodes: Writable<Tree<string>[]>;
		expandedIds: Writable<Set<string>>;
		selectedIds: Writable<Set<string>>;
		focusableId: Writable<string | null>;
	};

	const contextKey = Symbol();

	export function getTreeContext(): TreeContext {
		return getContext(contextKey);
	}
</script>

<script lang="ts">
	import { withChangeListener } from "$lib/helpers/with-change-listener.js";
	import { Tree } from "$lib/helpers/tree.js";
	import { nanoid } from "nanoid/non-secure";
	import { getContext, setContext } from "svelte";
	import { writable, type Writable } from "svelte/store";

	export let tree: Tree<string>;
	export let expandedIds = new Set<string>();
	export let selectedIds = new Set<string>();

	$: nodes = Array.from(
		tree.filter(
			(node) => node.parent === undefined || expandedIds.has(node.parent.id),
		),
	);

	const context: TreeContext = setContext(contextKey, {
		idPrefix: nanoid(),
		nodes: writable(nodes),
		expandedIds: withChangeListener(writable(expandedIds), (value) => {
			expandedIds = value;
		}),
		selectedIds: withChangeListener(writable(selectedIds), (value) => {
			selectedIds = value;
		}),
		focusableId: writable(null),
	});

	$: context.nodes.set(nodes);
	$: context.expandedIds.set(expandedIds);
	$: context.selectedIds.set(selectedIds);
</script>

<div role="tree" aria-multiselectable="true">
	<slot {nodes} />
</div>
