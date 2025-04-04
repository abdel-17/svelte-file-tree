function getTotalCount(nodes: Array<FileTreeNode>): number {
	let count = 0;
	for (const node of nodes) {
		count += node.count;
	}
	return count;
}

export class FileTree<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> {
	children: Array<TNode> = $state([]);

	constructor(children: Array<TNode>) {
		this.children = children;
	}

	readonly count = $derived(getTotalCount(this.children));
}

export type FileNodeProps = {
	id: string;
	name: string;
};

export class FileNode {
	readonly id: string;
	name: string = $state.raw("");

	constructor({ id, name }: FileNodeProps) {
		this.id = id;
		this.name = name;
	}

	readonly type = "file";

	readonly count = 1;
}

export type FolderNodeProps<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = {
	id: string;
	name: string;
	children: Array<TNode>;
};

export class FolderNode<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> {
	readonly id: string;
	name: string = $state.raw("");
	children: Array<TNode> = $state([]);

	constructor({ id, name, children }: FolderNodeProps<TNode>) {
		this.id = id;
		this.name = name;
		this.children = children;
	}

	readonly type = "folder";

	readonly count = $derived(1 + getTotalCount(this.children));
}

export type FileTreeNode = FileNode | FolderNode<FileTreeNode>;
