import type { FileNode, FileTree, FolderNode, TreeItemState } from "svelte-file-tree";

export interface TreeProps {
	tree: FileTree;
}

export interface TreeItemProps {
	item: TreeItemState<FileNode, FolderNode>;
	dropDestination: FolderNode | FileTree | undefined;
	onExpand: () => void;
	onCollapse: () => void;
}
