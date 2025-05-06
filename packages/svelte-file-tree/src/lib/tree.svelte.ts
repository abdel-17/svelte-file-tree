function getTotalCount(nodes: Array<FileNode | FolderNode>) {
	let count = 0;
	for (const node of nodes) {
		count++;

		if (node.type === "folder") {
			count += node.count;
		}
	}
	return count;
}

export class FileTree<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
> {
	children: Array<TFile | TFolder> = $state([]);

	constructor(children: Array<TFile | TFolder>) {
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
	name = $state.raw("");

	constructor({ id, name }: FileNodeProps) {
		this.id = id;
		this.name = name;
	}

	readonly type = "file";
}

export type FolderNodeProps<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
> = {
	id: string;
	name: string;
	children: Array<TFile | TFolder>;
};

export class FolderNode<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile, TFolder> = DefaultTFolder<TFile>,
> {
	readonly id: string;
	name = $state.raw("");
	children: Array<TFile | TFolder> = $state([]);

	constructor({ id, name, children }: FolderNodeProps<TFile, TFolder>) {
		this.id = id;
		this.name = name;
		this.children = children;
	}

	readonly type = "folder";

	readonly count = $derived(getTotalCount(this.children));
}

export type DefaultTFolder<TFile extends FileNode> = FolderNode<TFile, FolderNode<TFile>>;
