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
	children: ReadonlyArray<FileTreeItem>;
};

export type FileTreeItem = FileItem | FolderItem;

export type FileTreeProps = {
	children: ReadonlyArray<FileTreeItem>;
	defaultSelected?: Iterable<string>;
	selected?: SvelteSet<string>;
	defaultExpanded?: Iterable<string>;
	expanded?: SvelteSet<string>;
};

export type FileTreeJSON = {
	selected: Array<string>;
	expanded: Array<string>;
	children: Array<FileTreeItem>;
};

export class FileTree {
	readonly selected: SvelteSet<string>;
	readonly expanded: SvelteSet<string>;
	children: Array<FileTreeNode> = $state([]);

	constructor(props: FileTreeProps) {
		this.selected = props.selected ?? new SvelteSet(props.defaultSelected);
		this.expanded = props.expanded ?? new SvelteSet(props.defaultExpanded);
		this.children = props.children.map(createNode, this);
	}

	toJSON(): FileTreeJSON {
		return {
			selected: Array.from(this.selected),
			expanded: Array.from(this.expanded),
			children: this.children.map((child) => child.toJSON()),
		};
	}
}

function createNode(this: FileTree, item: FileTreeItem): FileTreeNode {
	switch (item.type) {
		case "file": {
			return new FileNode({
				tree: this,
				id: item.id,
				name: item.name,
			});
		}
		case "folder": {
			return new FolderNode({
				tree: this,
				id: item.id,
				name: item.name,
				children: item.children.map(createNode, this),
			});
		}
	}
}

class BaseFileTreeNode {
	readonly #selectedIds: SvelteSet<string>;
	readonly id: string;
	name = $state.raw("");

	constructor(tree: FileTree, id: string, name: string) {
		this.#selectedIds = tree.selected;
		this.id = id;
		this.name = name;
	}

	readonly selected: boolean = $derived.by(() => this.#selectedIds.has(this.id));

	select(): void {
		this.#selectedIds.add(this.id);
	}

	deselect(): void {
		this.#selectedIds.delete(this.id);
	}

	toggleSelected(): void {
		if (this.selected) {
			this.#selectedIds.delete(this.id);
		} else {
			this.#selectedIds.add(this.id);
		}
	}
}

export type FileNodeProps = {
	tree: FileTree;
	id: string;
	name: string;
};

export class FileNode extends BaseFileTreeNode {
	readonly type = "file";

	constructor(props: FileNodeProps) {
		super(props.tree, props.id, props.name);
	}

	toJSON(): FileItem {
		return {
			type: "file",
			id: this.id,
			name: this.name,
		};
	}
}

export type FolderNodeProps = {
	tree: FileTree;
	id: string;
	name: string;
	children: Array<FileTreeNode>;
};

export class FolderNode extends BaseFileTreeNode {
	readonly type = "folder";
	readonly #expandedIds: SvelteSet<string>;
	children: Array<FileTreeNode> = $state([]);

	constructor(props: FolderNodeProps) {
		super(props.tree, props.id, props.name);
		this.#expandedIds = props.tree.expanded;
		this.children = props.children;
	}

	readonly expanded: boolean = $derived.by(() => this.#expandedIds.has(this.id));

	expand(): void {
		this.#expandedIds.add(this.id);
	}

	collapse(): void {
		this.#expandedIds.delete(this.id);
	}

	toggleExpanded(): void {
		if (this.expanded) {
			this.#expandedIds.delete(this.id);
		} else {
			this.#expandedIds.add(this.id);
		}
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
