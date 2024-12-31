import { SvelteSet } from "svelte/reactivity";

export interface FileTreeProps {
	defaultSelected?: Iterable<string>;
	selected?: SvelteSet<string>;
	defaultCopied?: Iterable<string>;
	copied?: SvelteSet<string>;
	defaultExpanded?: Iterable<string>;
	expanded?: SvelteSet<string>;
}

export class FileTree {
	readonly selected: SvelteSet<string>;
	readonly copied: SvelteSet<string>;
	readonly expanded: SvelteSet<string>;
	nodes: FileTreeNode[] = $state([]);

	constructor(props: FileTreeProps = {}) {
		const {
			defaultSelected,
			selected = new SvelteSet(defaultSelected),
			defaultCopied,
			copied = new SvelteSet(defaultCopied),
			defaultExpanded,
			expanded = new SvelteSet(defaultExpanded),
		} = props;
		this.selected = selected;
		this.copied = copied;
		this.expanded = expanded;
	}

	createFile(props: FileNodeProps): FileNode {
		return new FileNode(this, props);
	}

	createFolder(props: FolderNodeProps): FolderNode {
		return new FolderNode(this, props);
	}

	selectAll(): void {
		this.#selectAll(this.nodes);
	}

	#selectAll(nodes: FileTreeNode[]): void {
		for (const node of nodes) {
			this.selected.add(node.id);

			if (node.type === "folder" && node.expanded) {
				this.#selectAll(node.children);
			}
		}
	}

	copy(ids: Iterable<string>): void {
		this.copied.clear();
		for (const id of ids) {
			this.copied.add(id);
		}
	}
}

class BaseFileTreeNode {
	readonly #selected: SvelteSet<string>;
	readonly #copied: SvelteSet<string>;
	readonly id: string;
	name: string = $state.raw("");

	constructor(tree: FileTree, id: string, name: string) {
		this.#selected = tree.selected;
		this.#copied = tree.copied;
		this.id = id;
		this.name = name;
	}

	readonly selected: boolean = $derived.by(() => this.#selected.has(this.id));

	readonly copied: boolean = $derived.by(() => this.#copied.has(this.id));

	select(): void {
		this.#selected.add(this.id);
	}

	unselect(): void {
		this.#selected.delete(this.id);
	}

	toggleSelected(): void {
		if (this.selected) {
			this.#selected.delete(this.id);
		} else {
			this.#selected.add(this.id);
		}
	}
}

export interface FileNodeProps {
	id: string;
	name: string;
}

export class FileNode extends BaseFileTreeNode {
	readonly type = "file";

	constructor(tree: FileTree, props: FileNodeProps) {
		const { id, name } = props;
		super(tree, id, name);
	}
}

export interface FolderNodeProps {
	id: string;
	name: string;
	children?: FileTreeNode[];
}

export class FolderNode extends BaseFileTreeNode {
	readonly type = "folder";
	readonly #expanded: SvelteSet<string>;
	children: FileTreeNode[] = $state([]);

	constructor(tree: FileTree, props: FolderNodeProps) {
		const { id, name, children = [] } = props;
		super(tree, id, name);
		this.#expanded = tree.expanded;
		this.children = children;
	}

	readonly expanded: boolean = $derived.by(() => this.#expanded.has(this.id));

	expand(): void {
		this.#expanded.add(this.id);
	}

	collapse(): void {
		this.#expanded.delete(this.id);
	}

	toggleExpanded(): void {
		if (this.expanded) {
			this.#expanded.delete(this.id);
		} else {
			this.#expanded.add(this.id);
		}
	}
}

export type FileTreeNode = FileNode | FolderNode;
