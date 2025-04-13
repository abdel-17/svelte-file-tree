import type { FileTree, FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import type * as tree from "svelte-file-tree";

export type TreeItemState = tree.TreeItemState<FileTreeNode>;

export type RenameItemArgs = {
	target: TreeItemState;
	name: string;
};

export type CreateFolderArgs = {
	target: FolderNode | FileTree;
	name: string;
};

export type UploadFilesArgs = {
	target: FolderNode | FileTree;
	files: FileList;
};

export interface TreeProps
	extends Omit<
		tree.TreeProps<FileTreeNode>,
		"tree" | "item" | "copyNode" | "onResolveNameConflict" | "onCircularReferenceError"
	> {
	tree: FileTree;
	onRenameItem?: (args: RenameItemArgs) => boolean | Promise<boolean>;
	onCreateFolder?: (args: CreateFolderArgs) => boolean | Promise<boolean>;
	onUploadFiles?: (args: UploadFilesArgs) => boolean | Promise<boolean>;
}
