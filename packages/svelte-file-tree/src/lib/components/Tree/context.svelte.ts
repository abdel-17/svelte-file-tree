import type { Ref } from "$lib/internal/ref.js";
import type { FileOrFolder, FileTree } from "$lib/tree.svelte.js";
import { getContext, setContext } from "svelte";
import type { DraggedState, TabbableState } from "./state.svelte.js";
import type { TreeProps } from "./types.js";

const TreeContextKey = Symbol("TreeContextKey");

export declare namespace TreeContext {
	type Item = {
		node: FileOrFolder;
		index: number;
		parent: TreeProps.ItemParent | undefined;
	};

	type SelectUntilArgs = {
		node: FileOrFolder;
		element: HTMLElement;
	};

	type RenameItemArgs = {
		node: FileOrFolder;
		name: string;
		parent: TreeProps.ItemParent | undefined;
	};
}

export type TreeContext = {
	tree: Ref<FileTree>;
	lookup: ReadonlyMap<string, TreeContext.Item>;
	tabbable: TabbableState;
	dragged: DraggedState;
	getChildren: (parent: TreeProps.ItemParent | undefined) => FileOrFolder[];
	getNextItem: (item: TreeContext.Item) => TreeContext.Item | undefined;
	getPreviousItem: (item: TreeContext.Item) => TreeContext.Item | undefined;
	selectUntil: (args: TreeContext.SelectUntilArgs) => void;
	renameItem: (args: TreeContext.RenameItemArgs) => boolean;
};

export function getTreeContext(): TreeContext {
	const context: TreeContext | undefined = getContext(TreeContextKey);
	if (context === undefined) {
		throw new Error("No parent <Tree> found");
	}
	return context;
}

export function setTreeContext(context: TreeContext): void {
	setContext(TreeContextKey, context);
}

const TreeItemProviderContextKey = Symbol("TreeItemProviderContextKey");

export type TreeItemProviderContext = {
	node: Ref<FileOrFolder>;
	index: Ref<number>;
	depth: Ref<number>;
	parent: Ref<TreeProps.ItemParent | undefined>;
};

export function getTreeItemProviderContext(): TreeItemProviderContext {
	const context: TreeItemProviderContext | undefined = getContext(TreeItemProviderContextKey);
	if (context === undefined) {
		throw new Error("No parent <Tree> found");
	}
	return context;
}

export function setTreeItemProviderContext(context: TreeItemProviderContext): void {
	setContext(TreeItemProviderContextKey, context);
}
