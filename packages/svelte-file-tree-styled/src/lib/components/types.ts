import type { FileTree, FileTreeNode, FolderNode, TreeProps } from "svelte-file-tree";

export type AddItemsArgs = {
	target: FolderNode | FileTree;
	added: Array<FileTreeNode>;
};

export interface StyledTreeProps extends Omit<TreeProps, "item" | "onResolveNameConflict"> {
	onAddItems?: (args: AddItemsArgs) => boolean | Promise<boolean>;
}
