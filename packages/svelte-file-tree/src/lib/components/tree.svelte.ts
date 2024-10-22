import { SvelteSet } from "svelte/reactivity";

export type TreeItem<Value> = {
	id: string;
	value: Value;
	children?: ReadonlyArray<TreeItem<Value>>;
};

export type TreeProps<Value> = {
	items: ReadonlyArray<TreeItem<Value>>;
	id?: string;
	defaultSelected?: Iterable<string> | null;
	defaultExpanded?: Iterable<string> | null;
};

export class Tree<Value> {
	readonly #props: TreeProps<Value>;
	readonly #selectedIds: SvelteSet<string>;
	readonly #expandedIds: SvelteSet<string>;
	#invertSelection = $state(false);

	constructor(props: TreeProps<Value>) {
		this.#props = props;
		this.#selectedIds = new SvelteSet(props.defaultSelected);
		this.#expandedIds = new SvelteSet(props.defaultExpanded);
	}

	readonly id: string = $derived.by(() => {
		const id = this.#props.id;
		if (id === undefined) {
			return crypto.randomUUID();
		}
		return id;
	});

	readonly roots: ReadonlyArray<TreeNode<Value>> = $derived.by(() =>
		this.#props.items.map((item, i) => new TreeNode(this, item, i)),
	);

	readonly size: number = $derived.by(() => {
		let size = 0;
		for (const root of this.roots) {
			size += root.size;
		}
		return size;
	});

	itemSelected(id: string): boolean {
		const selected = this.#selectedIds.has(id);
		if (this.#invertSelection) {
			return !selected;
		}
		return selected;
	}

	allSelected(): boolean {
		if (this.#invertSelection) {
			return this.#selectedIds.size === 0;
		}

		// The size of the tree is greater than or equal to the number of roots.
		// If the number of selected items is less than the number of roots,
		// then surely not all items are selected. This is an optimization
		// to avoid computing the tree's size, which can be expensive.
		const selectedCount = this.#selectedIds.size;
		return selectedCount >= this.roots.length && selectedCount === this.size;
	}

	selectItem(id: string): void {
		if (this.#invertSelection) {
			this.#selectedIds.delete(id);
		} else {
			this.#selectedIds.add(id);
		}
	}

	deselectItem(id: string): void {
		if (this.#invertSelection) {
			this.#selectedIds.add(id);
		} else {
			this.#selectedIds.delete(id);
		}
	}

	selectAll(): void {
		this.#invertSelection = true;
		this.#selectedIds.clear();
	}

	deselectAll(): void {
		this.#invertSelection = false;
		this.#selectedIds.clear();
	}

	itemExpanded(id: string): boolean {
		return this.#expandedIds.has(id);
	}

	expandItem(id: string): void {
		this.#expandedIds.add(id);
	}

	collapseItem(id: string): void {
		this.#expandedIds.delete(id);
	}

	collapseAll(): void {
		this.#expandedIds.clear();
	}

	findElement(): HTMLElement {
		const element = document.getElementById(this.id);
		if (element === null) {
			throw new Error(`TreeView "${this.id}" not mounted in the DOM`);
		}
		return element;
	}

	getTreeItemElementId(id: string): string {
		return this.id + ":" + id;
	}

	findTreeItemElement(id: string): HTMLElement {
		const element = document.getElementById(this.getTreeItemElementId(id));
		if (element === null) {
			throw new Error(`TreeItem "${id}" not mounted in the DOM`);
		}
		return element;
	}

	*[Symbol.iterator](): Iterator<TreeNode<Value>> {
		for (const root of this.roots) {
			yield* root;
		}
	}
}

export class TreeNode<Value> {
	readonly #tree: Tree<Value>;
	readonly #id: string;
	#levelIndex: number = $state()!;
	#parent: TreeNode<Value> | undefined = $state();
	#children: Array<TreeNode<Value>> = $state()!;
	value: Value = $state()!;

	constructor(
		tree: Tree<Value>,
		item: TreeItem<Value>,
		levelIndex: number,
		parent?: TreeNode<Value>,
	) {
		this.#tree = tree;
		this.#id = item.id;
		this.#levelIndex = levelIndex;
		this.#parent = parent;
		this.#children =
			item.children?.map((child, i) => new TreeNode(tree, child, i, this)) ??
			[];
		this.value = item.value;
	}

	get tree(): Tree<Value> {
		return this.#tree;
	}

	get id(): string {
		return this.#id;
	}

	get levelIndex(): number {
		return this.#levelIndex;
	}

	get parent(): TreeNode<Value> | undefined {
		return this.#parent;
	}

	get children(): ReadonlyArray<TreeNode<Value>> {
		return this.#children;
	}

	get elementId(): string {
		return this.#tree.getTreeItemElementId(this.#id);
	}

	readonly selected: boolean = $derived.by(() =>
		this.#tree.itemSelected(this.#id),
	);

	readonly expanded: boolean = $derived.by(() =>
		this.#tree.itemExpanded(this.#id),
	);

	readonly visible: boolean = $derived.by(() => {
		if (this.#parent === undefined) {
			return true;
		}
		return this.#parent.expanded && this.#parent.visible;
	});

	readonly depth: number = $derived.by(() => {
		if (this.#parent === undefined) {
			return 0;
		}
		return this.#parent.depth + 1;
	});

	readonly level: ReadonlyArray<TreeNode<Value>> = $derived.by(() => {
		if (this.#parent === undefined) {
			return this.#tree.roots;
		}
		return this.#parent.children;
	});

	readonly size: number = $derived.by(() => {
		let size = 1;
		for (const child of this.#children) {
			size += child.size;
		}
		return size;
	});

	readonly previous: TreeNode<Value> | undefined = $derived.by(() => {
		const previousSibling = this.level[this.#levelIndex - 1];
		if (previousSibling === undefined) {
			return this.#parent;
		}

		let current = previousSibling;
		while (current.expanded && current.children.length !== 0) {
			// Navigate to the last child until a leaf node is found.
			current = current.children.at(-1)!;
		}
		return current;
	});

	readonly next: TreeNode<Value> | undefined = $derived.by(() => {
		if (this.expanded && this.#children.length !== 0) {
			return this.#children[0]!;
		}

		let current: TreeNode<Value> = this;
		while (true) {
			const nextSibling = current.level[current.#levelIndex + 1];
			if (nextSibling !== undefined) {
				return nextSibling;
			}

			// Navigate up until a next sibling is found.
			if (current.#parent === undefined) {
				return;
			}
			current = current.#parent;
		}
	});

	select(): void {
		this.#tree.selectItem(this.#id);
	}

	deselect(): void {
		this.#tree.deselectItem(this.#id);
	}

	toggleSelection(): void {
		if (this.selected) {
			this.deselect();
		} else {
			this.select();
		}
	}

	expand(): void {
		this.#tree.expandItem(this.#id);
	}

	collapse(): void {
		this.#tree.collapseItem(this.#id);
	}

	toggleExpansion(): void {
		if (this.expanded) {
			this.collapse();
		} else {
			this.expand();
		}
	}

	findElement(): HTMLElement {
		return this.#tree.findTreeItemElement(this.#id);
	}

	*[Symbol.iterator](): Iterator<TreeNode<Value>> {
		yield this;
		for (const child of this.#children) {
			yield* child;
		}
	}
}
