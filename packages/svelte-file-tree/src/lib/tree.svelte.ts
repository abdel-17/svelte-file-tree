import { SvelteSet } from "svelte/reactivity";
import { LinkedState } from "./internal/helpers.svelte.js";

export type FileTreeProps = {
	children: (tree: FileTree) => Array<FileTreeNode>;
	defaultSelectedIds?: Iterable<string>;
	selectedIds?: SvelteSet<string>;
	defaultExpandedIds?: Iterable<string>;
	expandedIds?: SvelteSet<string>;
};

export type FileTreeJSON = {
	selectedIds: Array<string>;
	expandedIds: Array<string>;
	children: Array<FileTreeNodeJSON>;
};

export class FileTree {
	readonly selectedIds: SvelteSet<string>;
	readonly expandedIds: SvelteSet<string>;
	readonly #children: LinkedState<Array<FileTreeNode>>;

	constructor(props: FileTreeProps) {
		this.selectedIds = props.selectedIds ?? new SvelteSet(props.defaultSelectedIds);
		this.expandedIds = props.expandedIds ?? new SvelteSet(props.defaultExpandedIds);
		this.#children = new LinkedState(() => props.children(this));
	}

	get children(): Array<FileTreeNode> {
		return this.#children.current;
	}

	set children(value: Array<FileTreeNode>) {
		this.#children.current = value;
	}

	getNextNonChildItem(current: FileTreeItemPosition): FileTreeItemPosition | undefined {
		let { index, parent } = current;
		while (true) {
			const siblings = parent?.node.children ?? this.children;
			const nextIndex = index + 1;
			if (nextIndex !== siblings.length) {
				return {
					node: siblings[nextIndex],
					index: nextIndex,
					parent,
				};
			}

			if (parent === undefined) {
				return;
			}

			index = parent.index;
			parent = parent.parent;
		}
	}

	getNextItem(current: FileTreeItemPosition): FileTreeItemPosition | undefined {
		const { node } = current;
		if (node.type === "folder" && node.expanded && node.children.length !== 0) {
			return {
				node: node.children[0],
				index: 0,
				parent: current as FileTreeItemPosition<FolderNode>,
			};
		}

		return this.getNextNonChildItem(current);
	}

	getPreviousItem(current: FileTreeItemPosition): FileTreeItemPosition | undefined {
		if (current.index === 0) {
			return current.parent;
		}

		let parent = current.parent;
		let index = current.index - 1;
		let node = parent?.node.children[index] ?? this.children[index];

		while (node.type === "folder" && node.expanded && node.children.length !== 0) {
			parent = { node, index, parent };
			index = node.children.length - 1;
			node = node.children[index];
		}

		return { node, index, parent };
	}

	#selectVisible(nodes: Array<FileTreeNode>): void {
		for (const node of nodes) {
			this.selectedIds.add(node.id);

			if (node.type === "folder" && node.expanded) {
				this.#selectVisible(node.children);
			}
		}
	}

	selectVisible(): void {
		this.#selectVisible(this.children);
	}

	toJSON(): FileTreeJSON {
		return {
			selectedIds: Array.from(this.selectedIds),
			expandedIds: Array.from(this.expandedIds),
			children: this.children.map((child) => child.toJSON()),
		};
	}
}

class BaseFileTreeNode {
	readonly tree: FileTree;
	readonly id: string;
	name = $state.raw("");

	constructor(tree: FileTree, id: string, name: string) {
		this.tree = tree;
		this.id = id;
		this.name = name;
	}

	readonly selected: boolean = $derived.by(() => this.tree.selectedIds.has(this.id));

	select(): void {
		this.tree.selectedIds.add(this.id);
	}

	deselect(): void {
		this.tree.selectedIds.delete(this.id);
	}

	toggleSelected(): void {
		if (this.selected) {
			this.tree.selectedIds.delete(this.id);
		} else {
			this.tree.selectedIds.add(this.id);
		}
	}
}

export type FileNodeProps = {
	tree: FileTree;
	id: string;
	name: string;
};

export type FileNodeJSON = {
	type: "file";
	id: string;
	name: string;
};

export class FileNode extends BaseFileTreeNode {
	readonly type = "file";

	constructor(props: FileNodeProps) {
		super(props.tree, props.id, props.name);
	}

	toJSON(): FileNodeJSON {
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

export type FolderNodeJSON = {
	type: "folder";
	id: string;
	name: string;
	children: Array<FileTreeNodeJSON>;
};

export class FolderNode extends BaseFileTreeNode {
	readonly type = "folder";
	children: Array<FileTreeNode> = $state([]);

	constructor(props: FolderNodeProps) {
		super(props.tree, props.id, props.name);
		this.children = props.children;
	}

	readonly expanded: boolean = $derived.by(() => this.tree.expandedIds.has(this.id));

	expand(): void {
		this.tree.expandedIds.add(this.id);
	}

	collapse(): void {
		this.tree.expandedIds.delete(this.id);
	}

	toggleExpanded(): void {
		if (this.expanded) {
			this.tree.expandedIds.delete(this.id);
		} else {
			this.tree.expandedIds.add(this.id);
		}
	}

	toJSON(): FolderNodeJSON {
		return {
			type: "folder",
			id: this.id,
			name: this.name,
			children: this.children.map((child) => child.toJSON()),
		};
	}
}

export type FileTreeNode = FileNode | FolderNode;

export type FileTreeNodeJSON = FileNodeJSON | FolderNodeJSON;

export type FileTreeItemPosition<TNode extends FileTreeNode = FileTreeNode> = {
	node: TNode;
	index: number;
	parent: FileTreeItemPosition<FolderNode> | undefined;
};
