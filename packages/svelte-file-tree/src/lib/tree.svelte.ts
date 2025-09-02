export class FileTree<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> {
	children: Array<TNode>;

	constructor(children: Array<TNode>) {
		this.children = $state(children);
	}

	readonly type = "tree";
}

export type FileNodeProps = {
	id: string;
	name: string;
};

export class FileNode {
	id: string;
	name: string;

	constructor(props: FileNodeProps) {
		this.id = $state.raw(props.id);
		this.name = $state.raw(props.name);
	}

	readonly type = "file";
}

export type FolderNodeProps<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> = {
	id: string;
	name: string;
	children: Array<TNode>;
};

export class FolderNode<TNode extends FileNode | FolderNode<TNode> = FileTreeNode> {
	id: string;
	name: string;
	children: Array<TNode>;

	constructor(props: FolderNodeProps<TNode>) {
		this.id = $state.raw(props.id);
		this.name = $state.raw(props.name);
		this.children = $state(props.children);
	}

	readonly type = "folder";
}

export type FileTreeNode = FileNode | FolderNode<FileTreeNode>;

export type DefaultTFolder<TFile extends FileNode = FileNode> = FolderNode<
	TFile | DefaultTFolder<TFile>
>;

export type TreeItemStateProps<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TNode extends TFile | TFolder = TFile | TFolder,
> = {
	node: TNode;
	nodeIndex: number;
	index: number;
	parent: TreeItemState<TFile, TFolder, TFolder> | undefined;
	selected: () => boolean;
	expanded: () => boolean;
	inClipboard: () => boolean;
	disabled: () => boolean;
	visible: () => boolean;
};

export class TreeItemState<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TNode extends TFile | TFolder = TFile | TFolder,
> {
	readonly node: TNode;
	readonly nodeIndex: number;
	readonly index: number;
	readonly parent: TreeItemState<TFile, TFolder, TFolder> | undefined;
	readonly depth: number;
	readonly selected: boolean;
	readonly expanded: boolean;
	readonly inClipboard: boolean;
	readonly disabled: boolean;
	readonly visible: boolean;

	constructor(props: TreeItemStateProps<TFile, TFolder, TNode>) {
		this.node = props.node;
		this.nodeIndex = props.nodeIndex;
		this.index = props.index;
		this.parent = props.parent;
		this.depth = props.parent === undefined ? 0 : props.parent.depth + 1;
		this.selected = $derived.by(props.selected);
		this.expanded = $derived.by(props.expanded);
		this.inClipboard = $derived.by(props.inClipboard);
		this.disabled = $derived.by(props.disabled);
		this.visible = $derived.by(props.visible);
	}

	readonly type = "item";
}
