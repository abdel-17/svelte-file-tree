import type { FolderNode, TreeItemState } from "svelte-file-tree";

export interface TreeProps {
	root: FolderNode;
}

export interface TreeItemProps {
	item: TreeItemState;
	dropDestination: FolderNode | undefined;
	onExpand: () => void;
	onCollapse: () => void;
}
