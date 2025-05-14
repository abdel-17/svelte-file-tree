import type { FolderNode, TreeItemState } from "svelte-file-tree";

export interface TreeProps {
	root: FolderNode;
}

export interface TreeItemProps {
	item: TreeItemState;
	dropDestination: FolderNode | undefined;
	borderAnimationTargetId: string | undefined;
	onExpand: () => void;
	onCollapse: () => void;
	onRename: (name: string) => boolean;
}
