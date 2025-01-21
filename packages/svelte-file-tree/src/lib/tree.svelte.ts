import { SvelteSet } from "svelte/reactivity";

export declare namespace FileTree {
	type FileItem = {
		type: "file";
		id: string;
		name: string;
	};

	type FolderItem = {
		type: "folder";
		id: string;
		name: string;
		children?: ReadonlyArray<Item>;
	};

	type Item = FileItem | FolderItem;

	type Node = FileNode | FolderNode;

	type Props = {
		items: ReadonlyArray<Item>;
		defaultSelectedIds?: Iterable<string>;
		selectedIds?: SvelteSet<string>;
		defaultExpandedIds?: Iterable<string>;
		expandedIds?: SvelteSet<string>;
	};
}

export class FileTree {
	readonly selectedIds: SvelteSet<string>;
	readonly expandedIds: SvelteSet<string>;
	children: Array<FileTree.Node> = $state([]);

	constructor(props: FileTree.Props) {
		this.selectedIds = props.selectedIds ?? new SvelteSet(props.defaultSelectedIds);
		this.expandedIds = props.expandedIds ?? new SvelteSet(props.defaultExpandedIds);
		this.children = props.items.map(createNode, this);
	}

	select(node: FileTree.Node) {
		this.selectedIds.add(node.id);
	}

	deselect(node: FileTree.Node) {
		this.selectedIds.delete(node.id);
	}

	toggleSelected(node: FileTree.Node) {
		if (node.selected) {
			this.selectedIds.delete(node.id);
		} else {
			this.selectedIds.add(node.id);
		}
	}

	selectAll() {
		this.#selectAll();
	}

	#selectAll(nodes = this.children) {
		for (const node of nodes) {
			this.selectedIds.add(node.id);

			if (node.type === "folder" && node.expanded) {
				this.#selectAll(node.children);
			}
		}
	}

	expand(node: FolderNode) {
		this.expandedIds.add(node.id);
	}

	collapse(node: FolderNode) {
		this.expandedIds.delete(node.id);
	}

	toggleExpanded(node: FolderNode) {
		if (node.expanded) {
			this.expandedIds.delete(node.id);
		} else {
			this.expandedIds.add(node.id);
		}
	}
}

export class FileNode {
	readonly type = "file";
	readonly #selectedIds: SvelteSet<string>;
	readonly id: string;
	name = $state.raw("");
	element: HTMLElement | null = $state.raw(null);

	constructor(tree: FileTree, id: string, name: string) {
		this.#selectedIds = tree.selectedIds;
		this.id = id;
		this.name = name;
	}

	readonly selected = $derived.by(() => this.#selectedIds.has(this.id));
}

export class FolderNode {
	readonly type = "folder";
	readonly #selectedIds: SvelteSet<string>;
	readonly #expandedIds: SvelteSet<string>;
	readonly id: string;
	name = $state.raw("");
	children: Array<FileTree.Node> = $state([]);
	element: HTMLElement | null = $state.raw(null);

	constructor(
		tree: FileTree,
		id: string,
		name: string,
		children: ReadonlyArray<FileTree.Item> = [],
	) {
		this.#selectedIds = tree.selectedIds;
		this.#expandedIds = tree.expandedIds;
		this.id = id;
		this.name = name;
		this.children = children.map(createNode, tree);
	}

	readonly selected = $derived.by(() => this.#selectedIds.has(this.id));

	readonly expanded = $derived.by(() => this.#expandedIds.has(this.id));
}

function createNode(this: FileTree, item: FileTree.Item) {
	switch (item.type) {
		case "file": {
			return new FileNode(this, item.id, item.name);
		}
		case "folder": {
			return new FolderNode(this, item.id, item.name, item.children);
		}
	}
}
