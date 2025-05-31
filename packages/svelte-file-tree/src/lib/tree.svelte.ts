import type { SvelteSet } from "svelte/reactivity";

export type FileNodeProps = {
	id: string;
	name: string;
};

export class FileNode {
	id: string;
	name = $state.raw("");

	constructor(props: FileNodeProps) {
		this.id = props.id;
		this.name = props.name;
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
	name = $state.raw("");
	children: Array<TNode> = $state([]);

	constructor(props: FolderNodeProps<TNode>) {
		this.id = props.id;
		this.name = props.name;
		this.children = props.children;
	}

	readonly type = "folder";

	readonly count = $derived.by(() => {
		let result = 0;
		for (const child of this.children) {
			result++;

			if (child.type === "folder") {
				result += child.count;
			}
		}
		return result;
	});
}

export type FileTreeNode = FileNode | FolderNode<FileTreeNode>;

export type DefaultTFolder<TFile extends FileNode = FileNode> = FolderNode<
	TFile | DefaultTFolder<TFile>
>;

export type PasteOperation = "copy" | "cut";

export type TreeClipboard = {
	operation: PasteOperation;
	ids: SvelteSet<string>;
};

export type TreeItemStateProps<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TNode extends TFile | TFolder = TFile | TFolder,
> = {
	node: TNode;
	index: number;
	parent?: TreeItemState<TFile, TFolder, TFolder>;
	selectedIds: () => SvelteSet<string>;
	expandedIds: () => SvelteSet<string>;
	clipboard: () => TreeClipboard | undefined;
	isItemDisabled: () => boolean | ((node: TFile | TFolder) => boolean);
};

export class TreeItemState<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
	TNode extends TFile | TFolder = TFile | TFolder,
> {
	readonly node: TNode;
	readonly index: number;
	readonly parent?: TreeItemState<TFile, TFolder, TFolder>;
	readonly depth: number;
	readonly #selectedIds: () => SvelteSet<string>;
	readonly #expandedIds: () => SvelteSet<string>;
	readonly #clipboard: () => TreeClipboard | undefined;
	readonly #isItemDisabled: () => boolean | ((node: TFile | TFolder) => boolean);

	constructor(props: TreeItemStateProps<TFile, TFolder, TNode>) {
		this.node = props.node;
		this.index = props.index;
		this.parent = props.parent;
		this.depth = props.parent === undefined ? 0 : props.parent.depth + 1;
		this.#selectedIds = props.selectedIds;
		this.#expandedIds = props.expandedIds;
		this.#clipboard = props.clipboard;
		this.#isItemDisabled = props.isItemDisabled;
	}

	readonly selected = $derived.by(() => this.#selectedIds().has(this.node.id));

	readonly expanded = $derived.by(() => this.#expandedIds().has(this.node.id));

	readonly inClipboard = $derived.by(() => {
		const clipboard = this.#clipboard();
		return clipboard !== undefined && clipboard.ids.has(this.node.id);
	});

	readonly disabled = $derived.by(() => {
		if (this.parent?.disabled) {
			return true;
		}

		const isItemDisabled = this.#isItemDisabled();
		if (typeof isItemDisabled === "function") {
			return isItemDisabled(this.node);
		}
		return isItemDisabled;
	});

	readonly visible: boolean = $derived.by(() => {
		const parent = this.parent;
		if (parent === undefined) {
			return true;
		}
		return parent.expanded && parent.visible;
	});
}
