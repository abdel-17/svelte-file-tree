import type { Ref } from "$lib/internal/ref.js";
import type { FileOrFolder, FileTree, FolderNode } from "$lib/tree.svelte.js";
import { getContext, setContext } from "svelte";
import type { DraggedIdState, TabbableIdState } from "./state.svelte.js";
import type { TreeProps } from "./types.js";

const TreeContextKey = Symbol("TreeContextKey");

export declare namespace TreeContext {
	type SelectUntilArgs = {
		node: FileOrFolder;
		element: HTMLElement;
	};

	type RenameItemArgs = {
		node: FileOrFolder;
		name: string;
		parent: TreeProps.Item<FolderNode> | undefined;
	};

	type DropDraggedArgs = {
		draggedId: string;
		node: FileOrFolder;
		index: number;
		parent: TreeProps.Item<FolderNode> | undefined;
		position: "before" | "inside" | "after";
	};
}

export type TreeContext = {
	tree: Ref<FileTree>;
	tabbableId: TabbableIdState;
	draggedId: DraggedIdState;
	getChildren: (item: TreeProps.Item<FolderNode> | undefined) => FileOrFolder[];
	getNextItem: (item: TreeProps.Item) => TreeProps.Item | undefined;
	getPreviousItem: (item: TreeProps.Item) => TreeProps.Item | undefined;
	selectUntil: (args: TreeContext.SelectUntilArgs) => void;
	renameItem: (args: TreeContext.RenameItemArgs) => boolean;
	dropDragged: (args: TreeContext.DropDraggedArgs) => void;
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
	parent: Ref<TreeProps.Item<FolderNode> | undefined>;
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
