import type { TreeItemState } from "svelte-file-tree";
import type { FileNode, FileTree, FolderNode } from "$lib/tree.svelte";

export interface TreeProps {
	tree: FileTree;
}

export interface TreeItemProps {
	item: TreeItemState<FileNode, FolderNode>;
	dropDestination: FolderNode | FileTree | undefined;
	onExpand: () => void;
	onCollapse: () => void;
}
