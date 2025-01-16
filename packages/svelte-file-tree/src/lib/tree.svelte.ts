import { SvelteSet } from "svelte/reactivity";

export declare namespace FileTree {
	type Props = {
		defaultSelectedIds?: Iterable<string>;
		selectedIds?: SvelteSet<string>;
		defaultExpandedIds?: Iterable<string>;
		expandedIds?: SvelteSet<string>;
	};

	type FileProps = {
		id: string;
		name: string;
	};

	type FolderProps = {
		id: string;
		name: string;
		children?: FileOrFolder[];
	};
}

export class FileTree {
	readonly selectedIds: SvelteSet<string>;
	readonly expandedIds: SvelteSet<string>;
	readonly clipboard = new FileTreeClipboard();
	children: FileOrFolder[] = $state([]);
	_element: HTMLElement | null = $state.raw(null);

	constructor({
		defaultSelectedIds,
		selectedIds = new SvelteSet(defaultSelectedIds),
		defaultExpandedIds,
		expandedIds = new SvelteSet(defaultExpandedIds),
	}: FileTree.Props = {}) {
		this.selectedIds = selectedIds;
		this.expandedIds = expandedIds;
	}

	get element(): HTMLElement | null {
		return this._element;
	}

	file({ id, name }: FileTree.FileProps): FileNode {
		return new FileNode(this, id, name);
	}

	folder({ id, name, children }: FileTree.FolderProps): FolderNode {
		return new FolderNode(this, id, name, children);
	}

	selectAll(): void {
		this.#selectAll();
	}

	#selectAll(nodes = this.children): void {
		for (const node of nodes) {
			this.selectedIds.add(node.id);

			if (node.type === "folder" && node.expanded) {
				this.#selectAll(node.children);
			}
		}
	}
}

export declare namespace FileTreeClipboard {
	type Action = "copy" | "cut";

	type SetArgs = {
		action: Action;
		ids: Iterable<string>;
	};
}

export class FileTreeClipboard {
	readonly #ids = new SvelteSet<string>();
	#action?: FileTreeClipboard.Action = $state.raw();

	get ids(): ReadonlySet<string> {
		return this.#ids;
	}

	get action(): FileTreeClipboard.Action | undefined {
		return this.#action;
	}

	set({ action, ids }: FileTreeClipboard.SetArgs): void {
		this.#ids.clear();
		for (const id of ids) {
			this.#ids.add(id);
		}

		if (this.#ids.size === 0) {
			this.#action = undefined;
		} else {
			this.#action = action;
		}
	}

	delete(id: string): void {
		this.#ids.delete(id);

		if (this.#ids.size === 0) {
			this.#action = undefined;
		}
	}

	clear(): void {
		this.#ids.clear();
		this.#action = undefined;
	}
}

class BaseFileTreeNode {
	readonly #selectedIds: SvelteSet<string>;
	readonly #clipboardIds: ReadonlySet<string>;
	readonly id: string;
	name: string = $state.raw("");
	_element: HTMLElement | null = $state.raw(null);

	constructor(tree: FileTree, id: string, name: string) {
		this.#selectedIds = tree.selectedIds;
		this.#clipboardIds = tree.clipboard.ids;
		this.id = id;
		this.name = name;
	}

	get element(): HTMLElement | null {
		return this._element;
	}

	readonly selected: boolean = $derived.by(() => this.#selectedIds.has(this.id));

	readonly inClipboard: boolean = $derived.by(() => this.#clipboardIds.has(this.id));

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

export class FileNode extends BaseFileTreeNode {
	readonly type = "file";
}

export class FolderNode extends BaseFileTreeNode {
	readonly type = "folder";
	readonly #expandedIds: SvelteSet<string>;
	children: FileOrFolder[] = $state([]);

	constructor(tree: FileTree, id: string, name: string, children: FileOrFolder[] = []) {
		super(tree, id, name);
		this.#expandedIds = tree.expandedIds;
		this.children = children;
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
}

export type FileOrFolder = FileNode | FolderNode;
