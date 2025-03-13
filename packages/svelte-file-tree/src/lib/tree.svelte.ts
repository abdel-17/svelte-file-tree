export type FileTreeNode = FileNode | FolderNode;

export type FileTreeNodeJSON = FileNodeJSON | FolderNodeJSON;

export type FileTreeJSON = {
	children: Array<FileTreeNodeJSON>;
};

export class FileTree {
	children: Array<FileTreeNode> = $state([]);

	constructor(children: Array<FileTreeNode>) {
		this.children = children;
	}

	toJSON(): FileTreeJSON {
		return {
			children: this.children.map((child) => child.toJSON()),
		};
	}
}

export type FileNodeProps = {
	id: string;
	name: string;
};

export type FileNodeJSON = {
	type: "file";
	id: string;
	name: string;
};

export class FileNode {
	readonly id: string;
	name = $state.raw("");

	constructor({ id, name }: FileNodeProps) {
		this.id = id;
		this.name = name;
	}

	readonly type = "file";

	toJSON(): FileNodeJSON {
		return {
			type: "file",
			id: this.id,
			name: this.name,
		};
	}
}

export type FolderNodeProps = {
	id: string;
	name: string;
	children: Array<FileTreeNode>;
};

export type FolderNodeJSON = {
	type: "folder";
	id: string;
	name: string;
	children: Array<FileTreeNodeJSON>;
};

export class FolderNode {
	readonly id: string;
	name = $state.raw("");
	children: Array<FileTreeNode> = $state([]);

	constructor({ id, name, children }: FolderNodeProps) {
		this.id = id;
		this.name = name;
		this.children = children;
	}

	readonly type = "folder";

	toJSON(): FolderNodeJSON {
		return {
			type: "folder",
			id: this.id,
			name: this.name,
			children: this.children.map((child) => child.toJSON()),
		};
	}
}
