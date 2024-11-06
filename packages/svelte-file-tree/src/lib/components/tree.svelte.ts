import { SvelteSet } from "svelte/reactivity";

export type TreeItemData<Value> = {
	id: string;
	value: Value;
	children?: ReadonlyArray<TreeItemData<Value>>;
};

export type TreeProps<Value> = {
	items: () => ReadonlyArray<TreeItemData<Value>>;
	selected?: SvelteSet<string>;
	expanded?: SvelteSet<string>;
	defaultExpanded?: Iterable<string>;
	defaultSelected?: Iterable<string>;
};

export class Tree<Value> {
	#items: () => ReadonlyArray<TreeItemData<Value>>;
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
		// I know having side effects in a $derived is "bad", but in this case,
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

	get last(): TreeNode<Value> | undefined {
		let last = this.roots.at(-1);
		if (last === undefined) {
			return;
		}

		while (last.expanded) {
			const lastChild = last.children.at(-1);
			if (lastChild === undefined) {
				break;
			}
			last = lastChild;
		}
		return last;
	}

	get selected(): SvelteSet<string> {
		return this.#selected;
	}

	get expanded(): SvelteSet<string> {
		return this.#expanded;
	}

	get tabbable(): string | undefined {
		return this.#tabbable ?? this.roots[0]?.id;
	}

	set tabbable(tabbable: string) {
		this.#previousTabbable = this.tabbable;
		this.#tabbable = tabbable;
	}

	get previousTabbable(): string | undefined {
		return this.#previousTabbable;
	}

	get dragged(): string | undefined {
		return this.#dragged;
	}

	set dragged(dragged: string | undefined) {
		this.#dragged = dragged;
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
			const root = roots[i]!;
			yield* root.reversed();
		}
	}

	[Symbol.iterator](): TreeNodeGenerator<Value> {
		return this.values();
	}

	get(id: string): TreeNode<Value> | undefined {
		return this.#lookup.get(id);
	}

	onCreateTreeNode(id: string, node: TreeNode<Value>): void {
		this.#lookup.set(id, node);
	}

	onChangeTreeNodeId(current: string, next: string): void {
		const { selected } = this;
		const wasSelected = selected.delete(current);
		if (wasSelected) {
			selected.add(next);
		}

		const { expanded } = this;
		const wasExpanded = expanded.delete(current);
		if (wasExpanded) {
			expanded.add(next);
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
		item: TreeItemData<Value>,
		index: number,
		parent?: TreeNode<Value>,
	) {
		const { id, value, children } = item;
		tree.onCreateTreeNode(id, this);

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
		this.#tree.onChangeTreeNodeId(this.id, id);
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

	get dragged(): boolean {
		return this.#tree.dragged === this.id;
	}

	readonly dropTarget: boolean = $derived.by(() => {
		const { dragged } = this.#tree;
		if (dragged === undefined || dragged === this.id) {
			return false;
		}

		const { parent } = this;
		return parent === undefined || parent.dropTarget;
	});

	readonly level: number = $derived.by(() => {
		const { parent } = this;
		if (parent === undefined) {
			return 1;
		}
		return parent.level + 1;
	});

	get #siblings(): Array<TreeNode<Value>> {
		const { parent } = this;
		if (parent === undefined) {
			return this.#tree.roots;
		}
		return parent.#children;
	}

	get siblings(): ReadonlyArray<TreeNode<Value>> {
		return this.#siblings;
	}

	get previousSibling(): TreeNode<Value> | undefined {
		return this.siblings[this.index - 1];
	}

	get nextSibling(): TreeNode<Value> | undefined {
		return this.siblings[this.index + 1];
	}

	get previous(): TreeNode<Value> | undefined {
		const { previousSibling } = this;
		if (previousSibling === undefined) {
			return this.parent;
		}

		let current = previousSibling;
		while (current.expanded) {
			const lastChild = current.children.at(-1);
			if (lastChild === undefined) {
				break;
			}
			current = lastChild;
		}
		return current;
	}

	get next(): TreeNode<Value> | undefined {
		if (this.expanded) {
			const firstChild = this.children[0];
			if (firstChild !== undefined) {
				return firstChild;
			}
		}

		let current: TreeNode<Value> = this;
		while (true) {
			const { nextSibling } = current;
			if (nextSibling !== undefined) {
				return nextSibling;
			}

			const { parent } = current;
			if (parent === undefined) {
				return;
			}
			current = parent;
		}
	}

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
				const child = children[i]!;
				yield* child.reversed();
			}
		}
		yield this;
	}

	[Symbol.iterator](): TreeNodeGenerator<Value> {
		return this.values();
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
	#setIndex(index: number): void {
		this.#index = index;
	}

	#spliceSiblings(
		index: number,
		deleteCount: number,
		...items: Array<TreeNode<Value>>
	): void {
		const siblings = this.#siblings;
		siblings.splice(index, deleteCount, ...items);
		for (let i = index; i < siblings.length; i++) {
			const sibling = siblings[i]!;
			sibling.#setIndex(i);
		}
	}

	move(position: "before" | "after" | "inside", target: TreeNode<Value>): void {
		if (position === "inside") {
			this.#spliceSiblings(this.index, 1);
			const targetChildren = target.#children;
			targetChildren.push(this);
			this.#index = targetChildren.length - 1;
			this.#parent = target;
			return;
		}

		let nextIndex: number;
		switch (position) {
			case "before": {
				nextIndex = target.index;
				break;
			}
			case "after": {
				nextIndex = target.index + 1;
				break;
			}
		}

		if (this.parent !== target.parent) {
			this.#spliceSiblings(this.index, 1);
			target.#spliceSiblings(nextIndex, 0, this);
			this.#parent = target.parent;
			return;
		}

		// Instead of removing and inserting the node back to the same array,
		// swap the nodes to achieve the same effect in a more efficient way.
		//
		// Case 1: The node is being moved to a position after itself.
		const siblings = this.#siblings;
		for (let i = this.index + 1; i < nextIndex; i++) {
			const current = siblings[i]!;
			siblings[i - 1] = current;
			current.#setIndex(i - 1);
			siblings[i] = this;
			this.#index = i;
		}
		// Case 2: The node is being moved to a position before itself.
		for (let i = this.index; i > nextIndex; i--) {
			const previous = siblings[i - 1]!;
			siblings[i] = previous;
			previous.#setIndex(i);
			siblings[i - 1] = this;
			this.#index = i - 1;
		}
	}
}

export type TreeNodeGenerator<Value> = Generator<TreeNode<Value>, void, void>;
