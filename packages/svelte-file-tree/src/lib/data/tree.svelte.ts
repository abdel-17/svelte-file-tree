import { SvelteSet } from "svelte/reactivity";

interface BaseFileTreeItem {
	id: string;
	name: string;
}

export interface FileItem extends BaseFileTreeItem {
	type: "file";
}

export interface FolderItem extends BaseFileTreeItem {
	type: "folder";
	children?: FileTreeItem[];
}

export type FileTreeItem = FileItem | FolderItem;

export type FileTreeProps = {
	items: FileTreeItem[];
	selected?: SvelteSet<string>;
	expanded?: SvelteSet<string>;
	defaultSelected?: Iterable<string>;
	defaultExpanded?: Iterable<string>;
};

export class FileTree {
	readonly selected: SvelteSet<string>;
	readonly expanded: SvelteSet<string>;
	nodes: FileTreeNode[] = $state([]);

	constructor(props: FileTreeProps) {
		this.selected = props.selected ?? new SvelteSet(props.defaultSelected);
		this.expanded = props.expanded ?? new SvelteSet(props.defaultExpanded);
		this.nodes = this.createNodes(props.items);
	}

	createNode(item: FileTreeItem, parent?: FolderNode) {
		switch (item.type) {
			case "file":
				return new FileTreeNode(this, item, parent);
			case "folder":
				return new FolderNode(this, item, parent);
		}
	}

	createNodes(items: ReadonlyArray<FileTreeItem>, parent?: FolderNode) {
		const nodes = Array<FileTreeNode>(items.length);
		for (let i = 0; i < items.length; i++) {
			nodes[i] = this.createNode(items[i], parent);
		}
		return nodes;
	}

	selectAll() {
		this.#selectAll(this.nodes);
	}

	#selectAll(nodes: FileTreeNode[]) {
		for (const node of nodes) {
			this.selected.add(node.id);
			if (node.isFolder() && node.expanded) {
				this.#selectAll(node.children);
			}
		}
	}
}

export class FileTreeNode {
	readonly tree: FileTree;
	readonly id: string;
	name = $state.raw("");
	parent?: FolderNode = $state.raw();

	constructor(tree: FileTree, item: FileTreeItem, parent: FolderNode | undefined) {
		this.tree = tree;
		this.id = item.id;
		this.name = item.name;
		this.parent = parent;
	}

	readonly depth: number = $derived.by(() => {
		if (this.parent === undefined) {
			return 0;
		}
		return this.parent.depth + 1;
	});

	readonly siblings = $derived.by(() => {
		if (this.parent === undefined) {
			return this.tree.nodes;
		}
		return this.parent.children;
	});

	readonly selected = $derived.by(() => this.tree.selected.has(this.id));

	select() {
		this.tree.selected.add(this.id);
	}

	unselect() {
		this.tree.selected.delete(this.id);
	}

	toggleSelection() {
		if (this.selected) {
			this.unselect();
		} else {
			this.select();
		}
	}

	isFolder(): this is FolderNode {
		return this instanceof FolderNode;
	}
}

export class FolderNode extends FileTreeNode {
	children: FileTreeNode[] = $state([]);

	constructor(tree: FileTree, item: FolderItem, parent: FolderNode | undefined) {
		super(tree, item, parent);
		if (item.children !== undefined) {
			this.children = tree.createNodes(item.children, this);
		}
	}

	readonly expanded = $derived.by(() => this.tree.expanded.has(this.id));

	expand() {
		this.tree.expanded.add(this.id);
	}

	collapse() {
		this.tree.expanded.delete(this.id);
	}

	toggleExpansion() {
		if (this.expanded) {
			this.collapse();
		} else {
			this.expand();
		}
	}

	contains(node: FileTreeNode) {
		let current = node;
		while (current.depth > this.depth) {
			current = current.parent!;
		}
		return current === this;
	}
}
