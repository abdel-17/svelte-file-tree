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
	defaultSelected?: Iterable<string>;
	copied?: SvelteSet<string>;
	defaultCopied?: Iterable<string>;
	expanded?: SvelteSet<string>;
	defaultExpanded?: Iterable<string>;
};

export class FileTree {
	readonly selected: SvelteSet<string>;
	readonly copied: SvelteSet<string>;
	readonly expanded: SvelteSet<string>;
	nodes: FileTreeNode[] = $state([]);

	constructor(props: FileTreeProps) {
		this.selected = props.selected ?? new SvelteSet(props.defaultSelected);
		this.copied = props.copied ?? new SvelteSet(props.defaultCopied);
		this.expanded = props.expanded ?? new SvelteSet(props.defaultExpanded);
		this.nodes = this.createNodes(props.items);
	}

	createNode(item: FileTreeItem, parent?: FolderNode): FileTreeNode {
		switch (item.type) {
			case "file":
				return new FileNode(this, item.id, item.name, parent);
			case "folder":
				return new FolderNode(this, item.id, item.name, parent, item.children);
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

class BaseFileTreeNode {
	readonly tree: FileTree;
	readonly id: string;
	name: string = $state.raw("");
	parent?: FolderNode = $state.raw();

	constructor(tree: FileTree, id: string, name: string, parent?: FolderNode) {
		this.tree = tree;
		this.id = id;
		this.name = name;
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

	readonly copied: boolean = $derived.by(() => this.tree.copied.has(this.id));

	select(): void {
		this.tree.selected.add(this.id);
	}

	unselect(): void {
		this.tree.selected.delete(this.id);
	}

	toggleSelected(): void {
		if (this.selected) {
			this.unselect();
		} else {
			this.select();
		}
	}

	copy(): void {
		this.tree.copied.add(this.id);
	}

	uncopy(): void {
		this.tree.copied.delete(this.id);
	}

	toggleCopied(): void {
		if (this.copied) {
			this.uncopy();
		} else {
			this.copy();
		}
	}

	isFile(): this is FileNode {
		return this instanceof FileNode;
	}

	isFolder(): this is FolderNode {
		return this instanceof FolderNode;
	}
}

export class FileNode extends BaseFileTreeNode {
	toJSON(): FileItem {
		return {
			type: "file",
			id: this.id,
			name: this.name,
		};
	}
}

export class FolderNode extends BaseFileTreeNode {
	children: FileTreeNode[] = $state([]);

	constructor(
		tree: FileTree,
		id: string,
		name: string,
		parent?: FolderNode,
		children?: FileTreeItem[],
	) {
		super(tree, id, name, parent);

		if (children !== undefined) {
			this.children = tree.createNodes(children, this);
		}
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

	toJSON(): FolderItem {
		return {
			type: "folder",
			id: this.id,
			name: this.name,
			children: this.children.map((child) => child.toJSON()),
		};
	}
}

export type FileTreeNode = FileNode | FolderNode;
