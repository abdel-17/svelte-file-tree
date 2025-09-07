import {
	FileNode as BaseFileNode,
	FileTree as BaseFileTree,
	FolderNode as BaseFolderNode,
	TreeItemState as BaseTreeItemState,
} from "svelte-file-tree";

function getTotalSize(nodes: Array<FileNode | FolderNode>) {
	let result = 0;
	for (const node of nodes) {
		result += node.size;
	}
	return result;
}

export class FileTree extends BaseFileTree<FileNode | FolderNode> {
	readonly size: number = $derived(getTotalSize(this.children));
}

export type FileNodeProps = {
	id: string;
	name: string;
	size: number;
};

export class FileNode extends BaseFileNode {
	readonly size: number;

	constructor(props: FileNodeProps) {
		super(props);
		this.size = props.size;
	}
}

export type FolderNodeProps = {
	id: string;
	name: string;
	children: Array<FileNode | FolderNode>;
};

export class FolderNode extends BaseFolderNode<FileNode | FolderNode> {
	readonly size: number = $derived(getTotalSize(this.children));
}

export type FileTreeNode = FileNode | FolderNode;

export type TreeItemState<TNode extends FileTreeNode = FileTreeNode> = BaseTreeItemState<
	FileNode,
	FolderNode,
	TNode
>;
