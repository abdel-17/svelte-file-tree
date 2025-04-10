import type { FileTree, FileTreeNode } from "$lib/tree.svelte";
import * as tree from "svelte-file-tree";

export type TreeItemState = tree.TreeItemState<FileTreeNode>;

export type RenameItemArgs = {
	target: TreeItemState;
	name: string;
};

export interface TreeProps
	extends Omit<
		tree.TreeProps<FileTreeNode>,
		"tree" | "item" | "copyNode" | "onResolveNameConflict" | "onCircularReferenceError"
	> {
	tree: FileTree;
	onRenameItem?: (args: RenameItemArgs) => boolean | Promise<boolean>;
}

export type TreeContextMenuState =
	| {
			type: "tree";
	  }
	| {
			type: "item";
			item: () => TreeItemState;
	  };

export type FileDropState =
	| {
			type: "tree";
	  }
	| {
			type: "item";
			item: () => TreeItemState;
	  };
