import { SvelteSet } from "svelte/reactivity";

export type FileItem = {
	type: "file";
	id: string;
	name: string;
};

export type FolderItem = {
	type: "folder";
	id: string;
	name: string;
	children?: FileTreeItem[];
};

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

	createNode(item: FileTreeItem, parent?: FolderNode): FileTreeNode {
		switch (item.type) {
			case "file":
				return new FileTreeNode(this, item, parent);
			case "folder":
				return new FolderNode(this, item, parent);
		}
	}

	createNodes(items: FileTreeItem[], parent?: FolderNode): FileTreeNode[] {
		const nodes = Array<FileTreeNode>(items.length);
		for (let i = 0; i < items.length; i++) {
			nodes[i] = this.createNode(items[i], parent);
		}
		return nodes;
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

	readonly siblings: FileTreeNode[] = $derived.by(() => {
		if (this.parent === undefined) {
			return this.tree.nodes;
		}
		return this.parent.children;
	});

	readonly selected: boolean = $derived.by(() => this.tree.selected.has(this.id));

	select(): void {
		this.tree.selected.add(this.id);
	}

	unselect(): void {
		this.tree.selected.delete(this.id);
	}

	toggleSelection(): void {
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

	readonly expanded: boolean = $derived.by(() => this.tree.expanded.has(this.id));

	expand(): void {
		this.tree.expanded.add(this.id);
	}

	collapse(): void {
		this.tree.expanded.delete(this.id);
	}

	toggleExpansion(): void {
		if (this.expanded) {
			this.collapse();
		} else {
			this.expand();
		}
	}

	contains(node: FileTreeNode): boolean {
		let current = node;
		while (current.depth > this.depth) {
			current = current.parent!;
		}
		return current === this;
	}
}
