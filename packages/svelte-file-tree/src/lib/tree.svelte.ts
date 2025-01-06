import { SvelteSet } from "svelte/reactivity";

export type FileTreeProps = {
	defaultSelected?: Iterable<string>;
	selected?: SvelteSet<string>;
	defaultExpanded?: Iterable<string>;
	expanded?: SvelteSet<string>;
};

export class FileTree {
	readonly selected: SvelteSet<string>;
	readonly expanded: SvelteSet<string>;
	children: FileTreeNode[] = $state([]);

	constructor(props: FileTreeProps = {}) {
		const {
			defaultSelected,
			selected = new SvelteSet(defaultSelected),
			defaultExpanded,
			expanded = new SvelteSet(defaultExpanded),
		} = props;
		this.selected = selected;
		this.expanded = expanded;
	}

	createFile(props: FileNodeProps): FileNode {
		return new FileNode(this, props);
	}

	createFolder(props: FolderNodeProps): FolderNode {
		return new FolderNode(this, props);
	}

	selectAll(): void {
		this.#selectAll();
	}

	#selectAll(nodes = this.children): void {
		for (const node of nodes) {
			this.selected.add(node.id);

			if (node.type === "folder" && node.expanded) {
				this.#selectAll(node.children);
			}
		}
	}
}

class BaseFileTreeNode {
	readonly tree: FileTree;
	readonly id: string;
	name: string = $state.raw("");

	constructor(tree: FileTree, id: string, name: string) {
		this.tree = tree;
		this.id = id;
		this.name = name;
	}

	readonly selected: boolean = $derived.by(() => this.tree.selected.has(this.id));

	select(): void {
		this.tree.selected.add(this.id);
	}

	deselect(): void {
		this.tree.selected.delete(this.id);
	}

	toggleSelected(): void {
		if (this.selected) {
			this.tree.selected.delete(this.id);
		} else {
			this.tree.selected.add(this.id);
		}
	}
}

export type FileNodeProps = {
	id: string;
	name: string;
};

export class FileNode extends BaseFileTreeNode {
	readonly type = "file";

	constructor(tree: FileTree, props: FileNodeProps) {
		const { id, name } = props;
		super(tree, id, name);
	}
}

export type FolderNodeProps = {
	id: string;
	name: string;
	children?: FileTreeNode[];
};

export class FolderNode extends BaseFileTreeNode {
	readonly type = "folder";
	children: FileTreeNode[] = $state([]);

	constructor(tree: FileTree, props: FolderNodeProps) {
		const { id, name, children = [] } = props;
		super(tree, id, name);
		this.children = children;
	}

	readonly expanded: boolean = $derived.by(() => this.tree.expanded.has(this.id));

	expand(): void {
		this.tree.expanded.add(this.id);
	}

	collapse(): void {
		this.tree.expanded.delete(this.id);
	}

	toggleExpanded(): void {
		if (this.expanded) {
			this.tree.expanded.delete(this.id);
		} else {
			this.tree.expanded.add(this.id);
		}
	}
}

export type FileTreeNode = FileNode | FolderNode;
