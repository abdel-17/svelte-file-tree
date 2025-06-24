import type { DragEventArgs, FileTree, TreeItemState } from "svelte-file-tree";

export interface TreeProps {
	root: FileTree;
}

export interface TreeItemProps {
	item: TreeItemState;
	isDropDestination: boolean;
	isBorderAnimationTarget: boolean;
	onDragLeave: (args: DragEventArgs) => void;
	onExpand: (item: TreeItemState) => void;
	onCollapse: (item: TreeItemState) => void;
	onRename: (item: TreeItemState, name: string) => boolean;
}
