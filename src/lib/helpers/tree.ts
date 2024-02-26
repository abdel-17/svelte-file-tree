export type TreeItem<Value> = {
	readonly value: Value;
	readonly children?: ReadonlyArray<TreeItem<Value>>;
};

export class Tree<Value> implements Iterable<Tree<Value>> {
	value: Value;
	#id: string;
	#level: number;
	#index: number;
	#parent: Tree<Value> | undefined;
	#children: Tree<Value>[];

	private constructor(
		value: Value,
		id: string,
		level: number,
		index: number,
		parent: Tree<Value> | undefined,
		children: Tree<Value>[],
	) {
		this.value = value;
		this.#level = level;
		this.#id = id;
		this.#index = index;
		this.#parent = parent;
		this.#children = children;
	}

	static from<Value>(root: TreeItem<Value>): Tree<Value> {
		return Tree.#from(root);
	}

	static #from<Value>(
		item: TreeItem<Value>,
		index: number = 0,
		parent?: Tree<Value>,
	): Tree<Value> {
		const { value, children = [] } = item;
		const tree = new Tree(
			value,
			parent !== undefined ? `${parent.id}.${index + 1}` : `${index + 1}`,
			parent !== undefined ? parent.level + 1 : 1,
			index,
			parent,
			Array(children.length),
		);

		for (let i = 0; i < children.length; ++i) {
			tree.#children[i] = Tree.#from(children[i]!, i, tree);
		}

		return tree;
	}

	get level(): number {
		return this.#level;
	}

	get id(): string {
		return this.#id;
	}

	get index(): number {
		return this.#index;
	}

	get parent(): Tree<Value> | undefined {
		return this.#parent;
	}

	get children(): ReadonlyArray<Tree<Value>> {
		return this.#children;
	}

	get previousSibling(): Tree<Value> | undefined {
		return this.#parent?.children[this.#index - 1];
	}

	get nextSibling(): Tree<Value> | undefined {
		return this.#parent?.children[this.#index + 1];
	}

	[Symbol.iterator](): Generator<Tree<Value>> {
		return this.#iter();
	}

	filter(predicate: (node: Tree<Value>) => boolean): Generator<Tree<Value>> {
		return this.#iter(predicate);
	}

	*#iter(predicate?: (node: Tree<Value>) => boolean): Generator<Tree<Value>> {
		if (predicate !== undefined && !predicate(this)) {
			return;
		}

		yield this;
		for (const child of this.children) {
			yield* child.#iter(predicate);
		}
	}
}
