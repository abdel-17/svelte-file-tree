<script lang="ts" module>
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext, type Snippet } from "svelte";
	import type { TreeState } from "./state.svelte.js";
	import type { TreeItemState } from "./types.js";

	const CONTEXT_KEY = Symbol("TreeItemProvider");

	export type TreeItemProviderContext = {
		treeState: TreeState;
		item: () => TreeItemState;
	};

	export function getTreeItemProviderContext(): TreeItemProviderContext {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <Tree> found");
		}

		return getContext(CONTEXT_KEY);
	}

	function setTreeItemProviderContext(context: TreeItemProviderContext): void {
		setContext(CONTEXT_KEY, context);
	}
</script>

<script lang="ts">
	const {
		treeState,
		item,
		children,
	}: {
		treeState: TreeState;
		item: TreeItemState;
		children: Snippet;
	} = $props();

	setTreeItemProviderContext({
		treeState,
		item: () => item,
	});

	$effect(() => {
		return () => {
			treeState.onDeleteItem(item.node.id);
		};
	});
</script>

{@render children()}
