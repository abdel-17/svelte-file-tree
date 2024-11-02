import { SvelteSet } from "svelte/reactivity";

export type TreeItem<Value> = {
	id: string;
	value: Value;
	children?: ReadonlyArray<TreeItem<Value>>;
};

export type TreeProps<Value> = {
	items: () => ReadonlyArray<TreeItem<Value>>;
	selected?: SvelteSet<string>;
	expanded?: SvelteSet<string>;
	defaultExpanded?: Iterable<string>;
	defaultSelected?: Iterable<string>;
};

export class Tree<Value> {
	#items: () => ReadonlyArray<TreeItem<Value>>;
	#selected: SvelteSet<string>;
	#expanded: SvelteSet<string>;

	constructor(props: TreeProps<Value>) {
		this.#items = props.items;
		this.#selected = props.selected ?? new SvelteSet(props.defaultSelected);
		this.#expanded = props.expanded ?? new SvelteSet(props.defaultExpanded);
	}

	#lookup = new Map<string, TreeNode<Value>>();
	#tabbable: string | undefined = $state.raw();
	#previousTabbable?: string;
	#dragged: string | undefined = $state.raw();

	readonly roots: Array<TreeNode<Value>> = $derived.by(() => {
		// I know having side effects in  a $derived is "bad", but in this case,
		// it is the most efficient way to update the lookup map.
		//
		// Using a $derived map will recreate the map every time a node is
		// inserted or removed, which is not ideal. We should only recreate
		// the map when the entire tree has to be recreated.
		this.#lookup.clear();
		const roots = $state(
			this.#items().map((item, i) => new TreeNode(this, item, i)),
		);
		return roots;
	});

	get selected(): SvelteSet<string> {
		return this.#selected;
	}

	get expanded(): SvelteSet<string> {
		return this.#expanded;
	}

	readonly tabbable: string | undefined = $derived.by(
		() => this.#tabbable ?? this.roots[0]?.id,
	);

	get previousTabbable(): string | undefined {
		return this.#previousTabbable;
	}

	get dragged(): string | undefined {
		return this.#dragged;
	}

	*traverse(): TreeNodeGenerator<Value> {
		for (const root of this.roots) {
			yield* root.traverse();
		}
	}

	*values(): TreeNodeGenerator<Value> {
		for (const root of this.roots) {
			yield* root.values();
		}
	}

	*reversed(): TreeNodeGenerator<Value> {
		const { roots } = this;
		for (let i = roots.length - 1; i >= 0; i--) {
			yield* roots[i].reversed();
		}
	}

	[Symbol.iterator](): TreeNodeGenerator<Value> {
		return this.values();
	}

	last(): TreeNode<Value> | undefined {
		let last = this.roots.at(-1);
		if (last === undefined) {
			return;
		}
		while (last.expanded && last.children.length !== 0) {
			last = last.children.at(-1)!;
		}
		return last;
	}

	get(id: string): TreeNode<Value> | undefined {
		return this.#lookup.get(id);
	}

	onCreateTreeItem(node: TreeNode<Value>, id: string): void {
		this.#lookup.set(id, node);
	}

	onChangeTreeItemId(current: string, next: string): void {
		const wasSelected = this.selected.delete(current);
		if (wasSelected) {
			this.selected.add(next);
		}

		const wasExpanded = this.expanded.delete(current);
		if (wasExpanded) {
			this.expanded.add(next);
		}

		if (this.#tabbable === current) {
			this.#tabbable = next;
		}

		if (this.#previousTabbable === current) {
			this.#previousTabbable = next;
		}

		if (this.#dragged === current) {
			this.#dragged = next;
		}
	}

	onFocusTreeItem(node: TreeNode<Value>): void {
		this.#previousTabbable = this.tabbable;
		this.#tabbable = node.id;
	}

	onDragStartTreeItem(node: TreeNode<Value>): void {
		this.#dragged = node.id;
	}

	onDragEndTreeItem(node: TreeNode<Value>): void {
		if (this.#dragged === node.id) {
			this.#dragged = undefined;
		}
	}

	onDropTreeItem(node: TreeNode<Value>, position: "before" | "after"): void {
		if (this.#dragged === undefined) {
			return;
		}
		const dragged = this.get(this.#dragged);
		dragged?.move(position, node);
	}
}

export class TreeNode<Value> {
	#tree: Tree<Value>;
	#id: string = $state.raw()!;
	#value: Value = $state()!;
	#index: number = $state.raw()!;
	#parent: TreeNode<Value> | undefined = $state.raw();
	#children: Array<TreeNode<Value>> = $state()!;

	constructor(
		tree: Tree<Value>,
		item: TreeItem<Value>,
		index: number,
		parent?: TreeNode<Value>,
	) {
		const { id, value, children } = item;
		tree.onCreateTreeItem(this, id);

		this.#tree = tree;
		this.#id = id;
		this.#value = value;
		this.#index = index;
		this.#parent = parent;
		this.#children =
			children?.map((child, i) => new TreeNode(tree, child, i, this)) ?? [];
	}

	get id(): string {
		return this.#id;
	}

	set id(id: string) {
		this.#tree.onChangeTreeItemId(this.#id, id);
		this.#id = id;
	}

	get value(): Value {
		return this.#value;
	}

	set value(value: Value) {
		this.#value = value;
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

	readonly #selected: boolean = $derived.by(() =>
		this.#tree.selected.has(this.id),
	);

	get selected(): boolean {
		return this.#selected;
	}

	set selected(selected: boolean) {
		if (selected) {
			this.select();
		} else {
			this.unselect();
		}
	}

	readonly #expanded: boolean = $derived.by(() =>
		this.#tree.expanded.has(this.id),
	);

	get expanded(): boolean {
		return this.#expanded;
	}

	set expanded(expanded: boolean) {
		if (expanded) {
			this.expand();
		} else {
			this.collapse();
		}
	}

	readonly level: number = $derived.by(() => {
		if (this.parent === undefined) {
			return 1;
		}
		return this.parent.level + 1;
	});

	readonly #siblings: Array<TreeNode<Value>> = $derived.by(() => {
		if (this.parent === undefined) {
			return this.#tree.roots;
		}
		return this.parent.#children;
	});

	get siblings(): ReadonlyArray<TreeNode<Value>> {
		return this.#siblings;
	}

	readonly dragged: boolean = $derived.by(() => this.#tree.dragged === this.id);

	readonly dropTarget: boolean = $derived.by(() => {
		const { dragged } = this.#tree;
		if (dragged === undefined || dragged === this.id) {
			return false;
		}
		return this.parent === undefined || this.parent.dropTarget;
	});

	*traverse(): TreeNodeGenerator<Value> {
		yield this;
		for (const child of this.children) {
			yield* child.traverse();
		}
	}

	*values(): TreeNodeGenerator<Value> {
		yield this;
		if (this.expanded) {
			for (const child of this.children) {
				yield* child.values();
			}
		}
	}

	*reversed(): TreeNodeGenerator<Value> {
		if (this.expanded) {
			const { children } = this;
			for (let i = children.length - 1; i >= 0; i--) {
				yield* children[i].reversed();
			}
		}
		yield this;
	}

	[Symbol.iterator](): TreeNodeGenerator<Value> {
		return this.values();
	}

	previous(): TreeNode<Value> | undefined {
		if (this.index === 0) {
			return this.parent;
		}
		let previous = this.siblings[this.index - 1];
		while (previous.expanded && previous.children.length !== 0) {
			previous = previous.children.at(-1)!;
		}
		return previous;
	}

	next(): TreeNode<Value> | undefined {
		if (this.expanded && this.children.length !== 0) {
			return this.children[0];
		}

		let current: TreeNode<Value> = this;
		while (true) {
			if (current.index !== current.siblings.length - 1) {
				return current.siblings[current.index + 1];
			}

			if (current.parent === undefined) {
				return;
			}
			current = current.parent;
		}
	}

	select(): void {
		this.#tree.selected.add(this.id);
	}

	unselect(): void {
		this.#tree.selected.delete(this.id);
	}

	expand(): void {
		this.#tree.expanded.add(this.id);
	}

	collapse(): void {
		this.#tree.expanded.delete(this.id);
	}

	// TODO: remove when this bug is fixed: https://github.com/sveltejs/svelte/issues/13965
	#revalidateIndex(index: number): void {
		this.#index = index;
	}

	move(position: "before" | "after", target: TreeNode<Value>): void {
		let nextLevelIndex: number;
		switch (position) {
			case "before": {
				nextLevelIndex = target.#index;
				break;
			}
			case "after": {
				nextLevelIndex = target.#index + 1;
				break;
			}
		}

		if (this.parent !== target.parent) {
			// Remove this node from its current location.
			const siblings = this.#siblings;
			siblings.splice(this.index, 1);
			for (let i = this.index; i < siblings.length; i++) {
				siblings[i].#revalidateIndex(i);
			}

			// Insert this node into its new location.
			const targetSiblings = target.#siblings;
			targetSiblings.splice(nextLevelIndex, 0, this);
			for (let i = nextLevelIndex; i < targetSiblings.length; i++) {
				targetSiblings[i].#revalidateIndex(i);
			}

			this.#parent = target.#parent;
			return;
		}

		// Instead of removing and inserting the node back to the same array,
		// swap the nodes to achieve the same effect in a more efficient way.
		//
		// Case 1: The node is being moved to a position after itself.
		const siblings = this.#siblings;
		for (let i = this.#index + 1; i < nextLevelIndex; i++) {
			const current = siblings[i];
			siblings[i - 1] = current;
			current.#revalidateIndex(i - 1);
			siblings[i] = this;
			this.#index = i;
		}
		// Case 2: The node is being moved to a position before itself.
		for (let i = this.index; i > nextLevelIndex; i--) {
			const previous = siblings[i - 1];
			siblings[i] = previous;
			previous.#revalidateIndex(i);
			siblings[i - 1] = this;
			this.#index = i - 1;
		}
	}
}

export type TreeNodeGenerator<Value> = Generator<TreeNode<Value>, void, void>;
