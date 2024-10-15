import { SvelteSet } from "svelte/reactivity";

export type TreeItem<Value> = {
	id: string;
	value: Value;
	children?: Array<TreeItem<Value>>;
};

export type TreeProps<Value> = {
	items: Array<TreeItem<Value>>;
	defaultSelected?: Iterable<string> | null;
	defaultExpanded?: Iterable<string> | null;
};

export class Tree<Value> {
	#props: TreeProps<Value>;
	#selectedIds: SvelteSet<string>;
	#expandedIds: SvelteSet<string>;
	_element: HTMLElement | undefined = $state();

	constructor(props: TreeProps<Value>) {
		this.#props = props;
		this.#selectedIds = new SvelteSet(props.defaultSelected);
		this.#expandedIds = new SvelteSet(props.defaultExpanded);
	}

	get selectedIds(): SvelteSet<string> {
		return this.#selectedIds;
	}

	get expandedIds(): SvelteSet<string> {
		return this.#expandedIds;
	}

	get element(): HTMLElement {
		if (this._element === undefined) {
			throw new Error("Tree is not mounted in the DOM");
		}
		return this._element;
	}

	readonly roots: ReadonlyArray<TreeNode<Value>> = $derived.by(() =>
		this.#props.items.map((item, i) => new TreeNode(this, item, i)),
	);

	*[Symbol.iterator](): Iterator<TreeNode<Value>> {
		for (const root of this.roots) {
			yield* root;
		}
	}
}

export class TreeNode<Value> {
	#tree: Tree<Value>;
	#id: string;
	#index: number = $state()!;
	#parent: TreeNode<Value> | undefined = $state();
	#children: Array<TreeNode<Value>> = $state()!;
	value: Value = $state()!;
	_element: HTMLElement | undefined = $state();

	constructor(
		tree: Tree<Value>,
		item: TreeItem<Value>,
		index: number,
		parent?: TreeNode<Value>,
	) {
		this.#tree = tree;
		this.#id = item.id;
		this.#index = index;
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

	get index(): number {
		return this.#index;
	}

	get parent(): TreeNode<Value> | undefined {
		return this.#parent;
	}

	get children(): ReadonlyArray<TreeNode<Value>> {
		return this.#children;
	}

	get element(): HTMLElement {
		if (this._element === undefined) {
			throw new Error("Tree node is not mounted in the DOM");
		}
		return this._element;
	}

	readonly selected: boolean = $derived.by(() =>
		this.#tree.selectedIds.has(this.id),
	);

	readonly expanded: boolean = $derived.by(() =>
		this.#tree.expandedIds.has(this.id),
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

	readonly previous: TreeNode<Value> | undefined = $derived.by(() => {
		const previousSibling = this.level[this.#index - 1];
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
			const nextSibling = current.level[current.#index + 1];
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
		this.#tree.selectedIds.add(this.id);
	}

	deselect(): void {
		this.#tree.selectedIds.delete(this.id);
	}

	toggleSelection(): void {
		if (this.selected) {
			this.deselect();
		} else {
			this.select();
		}
	}

	expand(): void {
		this.#tree.expandedIds.add(this.id);
	}

	collapse(): void {
		this.#tree.expandedIds.delete(this.id);
	}

	toggleExpansion(): void {
		if (this.expanded) {
			this.collapse();
		} else {
			this.expand();
		}
	}

	*[Symbol.iterator](): Iterator<TreeNode<Value>> {
		yield this;
		for (const node of this.#children) {
			yield* node;
		}
	}
}
