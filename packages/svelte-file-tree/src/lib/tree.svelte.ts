import { SvelteSet } from "svelte/reactivity";
import { LinkedState } from "./internal/helpers.svelte.js";

export declare namespace FileTree {
	type Node = FileNode | FolderNode;

	type Props = {
		children: (tree: FileTree) => Array<Node>;
		defaultSelectedIds?: Iterable<string>;
		selectedIds?: SvelteSet<string>;
		defaultExpandedIds?: Iterable<string>;
		expandedIds?: SvelteSet<string>;
		defaultClipboardIds?: Iterable<string>;
		clipboardIds?: SvelteSet<string>;
	};

	type JSON = {
		children: Array<FileNode.JSON | FolderNode.JSON>;
		selectedIds: Array<string>;
		expandedIds: Array<string>;
		clipboardIds: Array<string>;
	};
}

export class FileTree {
	readonly #children: LinkedState<Array<FileTree.Node>>;
	readonly selectedIds: SvelteSet<string>;
	readonly expandedIds: SvelteSet<string>;
	readonly clipboardIds: SvelteSet<string>;

	constructor(props: FileTree.Props) {
		this.#children = new LinkedState(() => props.children(this));
		this.selectedIds = props.selectedIds ?? new SvelteSet(props.defaultSelectedIds);
		this.expandedIds = props.expandedIds ?? new SvelteSet(props.defaultExpandedIds);
		this.clipboardIds = props.clipboardIds ?? new SvelteSet(props.defaultClipboardIds);
	}

	get children(): Array<FileTree.Node> {
		return this.#children.current;
	}

	set children(value: Array<FileTree.Node>) {
		this.#children.current = value;
	}

	#selectVisible(nodes: Array<FileTree.Node>): void {
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

	toJSON(): FileTree.JSON {
		return {
			children: this.children.map((child) => child.toJSON()),
			selectedIds: Array.from(this.selectedIds),
			expandedIds: Array.from(this.expandedIds),
			clipboardIds: Array.from(this.clipboardIds),
		};
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

	readonly selected: boolean = $derived.by(() => this.tree.selectedIds.has(this.id));

	readonly inClipboard: boolean = $derived.by(() => this.tree.clipboardIds.has(this.id));

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

	addToClipboard(): void {
		this.tree.clipboardIds.add(this.id);
	}

	deleteFromClipboard(): void {
		this.tree.clipboardIds.delete(this.id);
	}
}

export declare namespace FileNode {
	type Props = {
		tree: FileTree;
		id: string;
		name: string;
	};

	type JSON = {
		type: "file";
		id: string;
		name: string;
	};
}

export class FileNode extends BaseFileTreeNode {
	constructor(props: FileNode.Props) {
		super(props.tree, props.id, props.name);
	}

	readonly type = "file";

	toJSON(): FileNode.JSON {
		return {
			type: "file",
			id: this.id,
			name: this.name,
		};
	}
}

export declare namespace FolderNode {
	type Props = {
		tree: FileTree;
		id: string;
		name: string;
		children: Array<FileTree.Node>;
	};

	type JSON = {
		type: "folder";
		id: string;
		name: string;
		children: Array<FileNode.JSON | FolderNode.JSON>;
	};
}

export class FolderNode extends BaseFileTreeNode {
	children: Array<FileTree.Node> = $state([]);

	constructor(props: FolderNode.Props) {
		super(props.tree, props.id, props.name);
		this.children = props.children;
	}

	readonly type = "folder";

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

	toJSON(): FolderNode.JSON {
		return {
			type: "folder",
			id: this.id,
			name: this.name,
			children: this.children.map((child) => child.toJSON()),
		};
	}
}
