export type FileTreeNodeData = {
	name: string;
};

export type FileTreeNode<TData extends FileTreeNodeData = FileTreeNodeData> =
	| FileNode<TData>
	| FolderNode<TData>;

export class FileTree<TData extends FileTreeNodeData = FileTreeNodeData> {
	children: Array<FileTreeNode<TData>> = $state([]);

	constructor(children: Array<FileTreeNode<TData>>) {
		this.children = children;
	}
}

export type FileNodeProps<TData extends FileTreeNodeData = FileTreeNodeData> = {
	id: string;
	data: TData;
};

export class FileNode<TData extends FileTreeNodeData = FileTreeNodeData> {
	readonly id: string;
	data: TData = $state({} as TData);

	constructor({ id, data }: FileNodeProps<TData>) {
		this.id = id;
		this.data = data;
	}

	readonly type = "file";
}

export type FolderNodeProps<TData extends FileTreeNodeData = FileTreeNodeData> = {
	id: string;
	data: TData;
	children: Array<FileTreeNode<TData>>;
};

export class FolderNode<TData extends FileTreeNodeData = FileTreeNodeData> {
	readonly id: string;
	data: TData = $state({} as TData);
	children: Array<FileTreeNode<TData>> = $state([]);

	constructor({ id, data, children }: FolderNodeProps<TData>) {
		this.id = id;
		this.data = data;
		this.children = children;
	}

	readonly type = "folder";
}
