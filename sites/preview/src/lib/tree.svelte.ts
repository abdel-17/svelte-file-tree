import * as tree from "svelte-file-tree";

export type FileTreeNode = FileNode | FolderNode;

export function getTotalSize(nodes: Array<FileTreeNode>) {
	let size = 0;
	for (const node of nodes) {
		size += node.size;
	}
	return size;
}

export class FileTree extends tree.FileTree<FileNode, FolderNode> {
	readonly size = $derived(getTotalSize(this.children));
}

export interface FileNodeProps extends tree.FileNodeProps {
	size: number;
}

export class FileNode extends tree.FileNode {
	readonly size: number;

	constructor(props: FileNodeProps) {
		super(props);
		this.size = props.size;
	}
}

export interface FolderNodeProps extends tree.FolderNodeProps<FileNode, FolderNode> {}

export class FolderNode extends tree.FolderNode<FileNode, FolderNode> {
	readonly size = $derived(getTotalSize(this.children));
}
