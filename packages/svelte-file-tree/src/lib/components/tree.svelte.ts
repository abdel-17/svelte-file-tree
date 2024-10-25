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
	readonly #selected: SvelteSet<string>;
	readonly #expanded: SvelteSet<string>;
	#selectionInverted: boolean = $state(false);

	constructor(props: TreeProps<Value>) {
		this.#props = props;
		this.#selected = new SvelteSet(props.defaultSelected);
		this.#expanded = new SvelteSet(props.defaultExpanded);
	}

	readonly id: string = $derived.by(
		() => this.#props.id ?? crypto.randomUUID(),
	);

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

	*all(): Generator<TreeNode<Value>> {
		for (const root of this.roots) {
			yield* root.all();
		}
	}

	*iter(): Generator<TreeNode<Value>> {
		for (const root of this.roots) {
			yield* root.iter();
		}
	}

	*reversed(): Generator<TreeNode<Value>> {
		for (let i = this.roots.length - 1; i >= 0; i--) {
			const root = this.roots[i]!;
			yield* root.reversed();
		}
	}

	[Symbol.iterator](): Generator<TreeNode<Value>> {
		return this.iter();
	}

	itemSelected(id: string): boolean {
		const selected = this.#selected.has(id);
		if (this.#selectionInverted) {
			return !selected;
		}
		return selected;
	}

	allSelected(): boolean {
		const selectedCount = this.#selected.size;
		if (this.#selectionInverted) {
			return selectedCount === 0;
		}

		// The size of the tree is greater than or equal to the number of roots.
		// If the number of selected items is less than the number of roots,
		// then surely not all items are selected. This is an optimization
		// to avoid computing the tree's size, which can be expensive.
		if (selectedCount < this.roots.length) {
			return false;
		}

		return selectedCount === this.size;
	}

	selectItem(id: string): void {
		if (this.#selectionInverted) {
			this.#selected.delete(id);
		} else {
			this.#selected.add(id);
		}
	}

	deselectItem(id: string): void {
		if (this.#selectionInverted) {
			this.#selected.add(id);
		} else {
			this.#selected.delete(id);
		}
	}

	selectAll(): void {
		this.#selectionInverted = true;
		this.#selected.clear();
	}

	deselectAll(): void {
		this.#selectionInverted = false;
		this.#selected.clear();
	}

	itemExpanded(id: string): boolean {
		return this.#expanded.has(id);
	}

	expandItem(id: string): void {
		this.#expanded.add(id);
	}

	collapseItem(id: string): void {
		this.#expanded.delete(id);
	}

	collapseAll(): void {
		this.#expanded.clear();
	}

	findElement(): HTMLElement {
		const element = document.getElementById(this.id);
		if (element === null) {
			throw new Error("TreeView element not found");
		}
		return element;
	}

	first(): TreeNode<Value> | null {
		if (this.roots.length === 0) {
			return null;
		}
		return this.roots[0]!;
	}

	last(): TreeNode<Value> | null {
		if (this.roots.length === 0) {
			return null;
		}

		let last = this.roots.at(-1)!;
		while (last.expanded && last.children.length !== 0) {
			last = last.children.at(-1)!;
		}
		return last;
	}

	treeItemElementId(nodeId: string): string {
		return this.id + ":" + nodeId;
	}

	findTreeItemElement(nodeId: string): HTMLElement {
		const elementId = this.treeItemElementId(nodeId);
		const element = document.getElementById(elementId);
		if (element === null) {
			throw new Error("TreeItem element not found");
		}
		return element;
	}
}

export class TreeNode<Value> {
	readonly #tree: Tree<Value>;
	readonly #id: string;
	value: Value = $state()!;
	#levelIndex: number = $state()!;
	#parent: TreeNode<Value> | null = $state()!;
	#children: Array<TreeNode<Value>> = $state()!;

	constructor(
		tree: Tree<Value>,
		item: TreeItem<Value>,
		levelIndex: number,
		parent: TreeNode<Value> | null = null,
	) {
		this.#tree = tree;
		this.#id = item.id;
		this.value = item.value;
		this.#levelIndex = levelIndex;
		this.#parent = parent;
		this.#children =
			item.children?.map((child, i) => new TreeNode(tree, child, i, this)) ??
			[];
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

	get parent(): TreeNode<Value> | null {
		return this.#parent;
	}

	get children(): ReadonlyArray<TreeNode<Value>> {
		return this.#children;
	}

	readonly selected: boolean = $derived.by(() =>
		this.#tree.itemSelected(this.#id),
	);

	readonly expanded: boolean = $derived.by(() =>
		this.#tree.itemExpanded(this.#id),
	);

	readonly depth: number = $derived.by(() => {
		if (this.#parent === null) {
			return 0;
		}
		return this.#parent.depth + 1;
	});

	readonly size: number = $derived.by(() => {
		let size = 1;
		for (const child of this.#children) {
			size += child.size;
		}
		return size;
	});

	*all(): Generator<TreeNode<Value>> {
		yield this;
		for (const child of this.#children) {
			yield* child.all();
		}
	}

	*iter(): Generator<TreeNode<Value>> {
		yield this;
		if (this.expanded) {
			for (const child of this.#children) {
				yield* child.iter();
			}
		}
	}

	*reversed(): Generator<TreeNode<Value>> {
		if (this.expanded) {
			for (let i = this.#children.length - 1; i >= 0; i--) {
				const child = this.#children[i]!;
				yield* child.reversed();
			}
		}
		yield this;
	}

	[Symbol.iterator](): Generator<TreeNode<Value>> {
		return this.iter();
	}

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

	level(): ReadonlyArray<TreeNode<Value>> {
		if (this.#parent === null) {
			return this.#tree.roots;
		}
		return this.#parent.children;
	}

	previousSibling(): TreeNode<Value> | null {
		if (this.#levelIndex === 0) {
			return null;
		}
		const level = this.level();
		return level[this.#levelIndex - 1]!;
	}

	nextSibling(): TreeNode<Value> | null {
		const level = this.level();
		if (this.#levelIndex === level.length - 1) {
			return null;
		}
		return level[this.#levelIndex + 1]!;
	}

	previous(): TreeNode<Value> | null {
		const previousSibling = this.previousSibling();
		if (previousSibling === null) {
			return this.#parent;
		}

		let current = previousSibling;
		while (current.expanded && current.children.length !== 0) {
			// Navigate to the last child until a leaf node is found.
			current = current.children.at(-1)!;
		}
		return current;
	}

	next(): TreeNode<Value> | null {
		if (this.expanded && this.#children.length !== 0) {
			return this.#children[0]!;
		}

		let current: TreeNode<Value> = this;
		while (true) {
			const nextSibling = current.nextSibling();
			if (nextSibling !== null) {
				return nextSibling;
			}

			// Navigate up until a next sibling is found.
			if (current.#parent === null) {
				return null;
			}
			current = current.#parent;
		}
	}

	elementId(): string {
		return this.#tree.treeItemElementId(this.#id);
	}

	findElement(): HTMLElement {
		return this.#tree.findTreeItemElement(this.#id);
	}
}
