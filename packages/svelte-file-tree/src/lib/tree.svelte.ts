import { SvelteSet } from "svelte/reactivity";

export interface FileTreeProps {
	selected?: SvelteSet<string>;
	defaultSelected?: Iterable<string>;
	copied?: SvelteSet<string>;
	defaultCopied?: Iterable<string>;
	expanded?: SvelteSet<string>;
	defaultExpanded?: Iterable<string>;
}

export interface FileNodeProps {
	id: string;
	name: string;
}

export interface FolderNodeProps {
	id: string;
	name: string;
	children?: FileTreeNode[];
}

export class FileTree {
	readonly selected: SvelteSet<string>;
	readonly copied: SvelteSet<string>;
	readonly expanded: SvelteSet<string>;
	nodes: FileTreeNode[] = $state([]);

	constructor(props: FileTreeProps = {}) {
		this.selected = props.selected ?? new SvelteSet(props.defaultSelected);
		this.copied = props.copied ?? new SvelteSet(props.defaultCopied);
		this.expanded = props.expanded ?? new SvelteSet(props.defaultExpanded);
	}

	createFile(props: FileNodeProps): FileNode {
		return new FileNode(this, props);
	}

	createFolder(props: FolderNodeProps): FolderNode {
		return new FolderNode(this, props);
	}

	// TODO: test
	onDelete(nodes: FileTreeNode[]): void {
		this.#onDelete(nodes);
	}

	#onDelete(nodes: FileTreeNode[]): boolean {
		for (const node of nodes) {
			this.selected.delete(node.id);
			this.copied.delete(node.id);
			this.expanded.delete(node.id);

			if (this.selected.size === 0 && this.copied.size === 0 && this.expanded.size === 0) {
				return true;
			}

			if (node.type === "folder") {
				const done = this.#onDelete(node.children);
				if (done) {
					return true;
				}
			}
		}
		return false;
	}
}

class BaseFileTreeNode {
	readonly tree: FileTree;
	readonly id: string;
	name: string = $state.raw("");
	parent?: FolderNode = $state.raw();

	constructor(tree: FileTree, props: FileNodeProps) {
		this.tree = tree;
		this.id = props.id;
		this.name = props.name;
	}

	readonly depth: number = $derived.by(() => {
		if (this.parent === undefined) {
			return 0;
		} else {
			return this.parent.depth + 1;
		}
	});

	readonly siblings: FileTreeNode[] = $derived.by(() => {
		if (this.parent === undefined) {
			return this.tree.nodes;
		} else {
			return this.parent.children;
		}
	});

	readonly selected: boolean = $derived.by(() => this.tree.selected.has(this.id));

	readonly copied: boolean = $derived.by(() => this.tree.copied.has(this.id));
}

export class FileNode extends BaseFileTreeNode {
	readonly type = "file";

	constructor(tree: FileTree, props: FileNodeProps) {
		super(tree, props);
	}
}

export class FolderNode extends BaseFileTreeNode {
	readonly type = "folder";
	children: FileTreeNode[] = $state([]);

	constructor(tree: FileTree, props: FolderNodeProps) {
		super(tree, props);

		if (props.children !== undefined) {
			for (const child of props.children) {
				child.parent = this;
			}
			this.children = props.children;
		}
	}

	readonly expanded: boolean = $derived.by(() => this.tree.expanded.has(this.id));

	createFile(props: FileNodeProps): FileNode {
		const file = this.tree.createFile(props);
		file.parent = this;
		return file;
	}

	createFolder(props: FolderNodeProps): FolderNode {
		const folder = this.tree.createFolder(props);
		folder.parent = this;
		return folder;
	}
}

export type FileTreeNode = FileNode | FolderNode;
