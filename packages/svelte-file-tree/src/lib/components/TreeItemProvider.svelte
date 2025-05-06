<script lang="ts" module>
	import type { DefaultTFolder, FileNode, FileTree, FolderNode } from "$lib/tree.svelte.js";
	import { DEV } from "esm-env";
	import { getContext, hasContext, setContext, type Snippet } from "svelte";
	import type { TreeState } from "./state.svelte.js";
	import type { TreeItemState } from "./types.js";

	const CONTEXT_KEY = Symbol("TreeItemProvider");

	export type TreeItemProviderContext<
		TFile extends FileNode = FileNode,
		TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
		TTree extends FileTree<TFile, TFolder> = FileTree<TFile, TFolder>,
	> = {
		treeState: TreeState<TFile, TFolder, TTree>;
		item: () => TreeItemState<TFile, TFolder>;
	};

	export function getTreeItemProviderContext(): TreeItemProviderContext {
		if (DEV && !hasContext(CONTEXT_KEY)) {
			throw new Error("No parent <Tree> found");
		}

		return getContext(CONTEXT_KEY);
	}
</script>

<script
	lang="ts"
	generics="
		TFile extends FileNode = FileNode,
		TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
		TTree extends FileTree<TFile, TFolder> = FileTree<TFile, TFolder>,
	"
>
	const {
		treeState,
		item,
		children,
	}: {
		treeState: TreeState<TFile, TFolder, TTree>;
		item: TreeItemState<TFile, TFolder>;
		children: Snippet;
	} = $props();

	const context: TreeItemProviderContext<TFile, TFolder, TTree> = {
		treeState,
		item: () => item,
	};
	setContext(CONTEXT_KEY, context);

	$effect(() => {
		return () => {
			treeState.onItemRemoved(item.node.id);
		};
	});
</script>

{@render children()}
