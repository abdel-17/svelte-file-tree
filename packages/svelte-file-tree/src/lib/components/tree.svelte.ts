import { SvelteSet } from "svelte/reactivity";

export type TreeItemData<Value> = {
	id: string;
	value: Value;
	children?: ReadonlyArray<TreeItemData<Value>>;
};

function createNodes<Value>(
	tree: Tree<Value>,
	items: ReadonlyArray<TreeItemData<Value>>,
	parent?: TreeNode<Value>,
): Array<TreeNode<Value>> {
	const nodes = Array<TreeNode<Value>>(items.length);
	for (let i = 0; i < items.length; i++) {
		const item = items[i]!;
		nodes[i] = new TreeNode(tree, item, i, parent);
	}
	return nodes;
}

export type TreeProps<Value> = {
	items: ReadonlyArray<TreeItemData<Value>>;
	selected?: SvelteSet<string>;
	expanded?: SvelteSet<string>;
	defaultSelected?: Iterable<string>;
	defaultExpanded?: Iterable<string>;
};

export class Tree<Value> {
	#roots: Array<TreeNode<Value>> = $state()!;
	#selected: SvelteSet<string>;
	#expanded: SvelteSet<string>;

	#tabbable: TreeNode<Value> | undefined = $state.raw();
	#previousTabbable?: TreeNode<Value>;
	#dragged: TreeNode<Value> | undefined = $state.raw();

	constructor(props: TreeProps<Value>) {
		this.#roots = createNodes(this, props.items);
		this.#selected = props.selected ?? new SvelteSet(props.defaultSelected);
		this.#expanded = props.expanded ?? new SvelteSet(props.defaultExpanded);
	}

	get roots(): Array<TreeNode<Value>> {
		return this.#roots;
	}

	get last(): TreeNode<Value> | undefined {
		let last = this.#roots.at(-1);
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

	get tabbable(): TreeNode<Value> | undefined {
		return this.#tabbable ?? this.#roots[0];
	}

	set tabbable(tabbable: TreeNode<Value>) {
		this.#previousTabbable = this.tabbable;
		this.#tabbable = tabbable;
	}

	get previousTabbable(): TreeNode<Value> | undefined {
		return this.#previousTabbable;
	}

	get dragged(): TreeNode<Value> | undefined {
		return this.#dragged;
	}

	set dragged(dragged: TreeNode<Value> | undefined) {
		this.#dragged = dragged;
	}

	#selectAll<Value>(nodes: ReadonlyArray<TreeNode<Value>>): void {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i]!;
			node.select();

			if (node.expanded) {
				this.#selectAll(node.children);
			}
		}
	}

	selectAll(): void {
		this.#selectAll(this.#roots);
	}

	#selectUntil(
		end: TreeNode<Value>,
		nodes: ReadonlyArray<TreeNode<Value>>,
	): boolean {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i]!;
			node.select();

			if (node === end) {
				return true;
			}

			if (node.expanded) {
				const found = this.#selectUntil(end, node.children);
				if (found) {
					return true;
				}
			}
		}
		return false;
	}

	selectUntil(end: TreeNode<Value>): void {
		this.#selectUntil(end, this.#roots);
	}

	#selectFrom(
		start: TreeNode<Value>,
		nodes: ReadonlyArray<TreeNode<Value>>,
	): boolean {
		for (let i = nodes.length - 1; i >= 0; i--) {
			const node = nodes[i]!;
			if (node.expanded) {
				const found = this.#selectFrom(start, node.children);
				if (found) {
					return true;
				}
			}

			node.select();

			if (node === start) {
				return true;
			}
		}
		return false;
	}

	selectFrom(start: TreeNode<Value>): void {
		this.#selectFrom(start, this.#roots);
	}

	onChangeTreeNodeId(current: string, next: string): void {
		const selected = this.#selected;
		const wasSelected = selected.delete(current);
		if (wasSelected) {
			selected.add(next);
		}

		const expanded = this.#expanded;
		const wasExpanded = expanded.delete(current);
		if (wasExpanded) {
			expanded.add(next);
		}
	}

	onDeleteTreeNode(node: TreeNode<Value>): void {
		const { id, children } = node;

		this.#selected.delete(id);
		this.#expanded.delete(id);

		if (this.#tabbable === node) {
			this.#tabbable = undefined;
			this.#previousTabbable = undefined;
		} else if (this.#previousTabbable === node) {
			this.#previousTabbable = undefined;
		}

		if (this.#dragged === node) {
			this.#dragged = undefined;
		}

		for (let i = 0; i < children.length; i++) {
			const child = children[i]!;
			this.onDeleteTreeNode(child);
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
		const { id, value, children = [] } = item;
		this.#tree = tree;
		this.#id = id;
		this.#value = value;
		this.#index = index;
		this.#parent = parent;
		this.#children = createNodes(tree, children, this);
	}

	get id(): string {
		return this.#id;
	}

	set id(id: string) {
		this.#tree.onChangeTreeNodeId(this.#id, id);
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
		this.#tree.selected.has(this.#id),
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
		this.#tree.expanded.has(this.#id),
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
		const parent = this.#parent;
		if (parent === undefined) {
			return 1;
		}
		return parent.level + 1;
	});

	get #siblings(): Array<TreeNode<Value>> {
		const parent = this.#parent;
		if (parent === undefined) {
			return this.#tree.roots;
		}
		return parent.#children;
	}

	get siblings(): ReadonlyArray<TreeNode<Value>> {
		return this.#siblings;
	}

	get previousSibling(): TreeNode<Value> | undefined {
		return this.#siblings[this.#index - 1];
	}

	get nextSibling(): TreeNode<Value> | undefined {
		return this.#siblings[this.#index + 1];
	}

	get previous(): TreeNode<Value> | undefined {
		const { previousSibling } = this;
		if (previousSibling === undefined) {
			return this.#parent;
		}

		let current = previousSibling;
		while (current.#expanded) {
			const lastChild = current.#children.at(-1);
			if (lastChild === undefined) {
				break;
			}
			current = lastChild;
		}
		return current;
	}

	get next(): TreeNode<Value> | undefined {
		if (this.#expanded) {
			const firstChild = this.#children[0];
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

			const parent = current.#parent;
			if (parent === undefined) {
				return;
			}
			current = parent;
		}
	}

	contains(node: TreeNode<Value>): boolean {
		let current = node;
		while (current.level > this.level) {
			current = current.#parent!;
		}
		return current === this;
	}

	select(): void {
		this.#tree.selected.add(this.#id);
	}

	unselect(): void {
		this.#tree.selected.delete(this.#id);
	}

	expand(): void {
		this.#tree.expanded.add(this.#id);
	}

	expandSiblings(): void {
		const siblings = this.#siblings;
		for (let i = 0; i < siblings.length; i++) {
			const sibling = siblings[i]!;
			if (sibling.children.length !== 0) {
				sibling.expand();
			}
		}
	}

	collapse(): void {
		this.#tree.expanded.delete(this.#id);
	}

	// TODO: remove when this bug is fixed: https://github.com/sveltejs/svelte/issues/13965
	#setIndex(index: number): void {
		this.#index = index;
	}

	#spliceSiblings(
		index: number,
		deleteCount: number,
		...items: ReadonlyArray<TreeNode<Value>>
	): void {
		const siblings = this.#siblings;
		siblings.splice(index, deleteCount, ...items);
		for (let i = index; i < siblings.length; i++) {
			const sibling = siblings[i]!;
			sibling.#setIndex(i);
		}
	}

	move(position: "before" | "inside" | "after", target: TreeNode<Value>): void {
		if (position === "inside") {
			this.#spliceSiblings(this.#index, 1);
			const count = target.#children.push(this);
			this.#index = count - 1;
			this.#parent = target;
			return;
		}

		let nextIndex: number;
		switch (position) {
			case "before": {
				nextIndex = target.#index;
				break;
			}
			case "after": {
				nextIndex = target.#index + 1;
				break;
			}
		}

		if (this.#parent !== target.#parent) {
			this.#spliceSiblings(this.#index, 1);
			target.#spliceSiblings(nextIndex, 0, this);
			this.#parent = target.#parent;
			return;
		}

		// Instead of removing and inserting the node back to the same array,
		// swap the nodes to achieve the same effect in a more efficient way.
		//
		// Case 1: The node is being moved to a position after itself.
		const index = this.#index;
		const siblings = this.#siblings;
		for (let i = index + 1; i < nextIndex; i++) {
			const current = siblings[i]!;
			siblings[i - 1] = current;
			current.#setIndex(i - 1);
			siblings[i] = this;
			this.#index = i;
		}
		// Case 2: The node is being moved to a position before itself.
		for (let i = index; i > nextIndex; i--) {
			const previous = siblings[i - 1]!;
			siblings[i] = previous;
			previous.#setIndex(i);
			siblings[i - 1] = this;
			this.#index = i - 1;
		}
	}

	delete(): void {
		this.#tree.onDeleteTreeNode(this);
		this.#spliceSiblings(this.#index, 1);
		this.#index = -1;
		this.#parent = undefined;
	}
}
