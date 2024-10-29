import { unwrap } from "$lib/helpers/unwrap.js";
import type { MaybeGetter } from "$lib/types.js";
import { SvelteSet } from "svelte/reactivity";

export type TreeItem<Value> = {
	id: string;
	value: Value;
	children?: ReadonlyArray<TreeItem<Value>>;
};

export type TreeProps<Value> = {
	items: MaybeGetter<ReadonlyArray<TreeItem<Value>>>;
	selected?: SvelteSet<string>;
	expanded?: SvelteSet<string>;
	defaultSelected?: Iterable<string>;
	defaultExpanded?: Iterable<string>;
};

export class Tree<Value> {
	#items: MaybeGetter<ReadonlyArray<TreeItem<Value>>>;
	#selected: SvelteSet<string>;
	#expanded: SvelteSet<string>;

	constructor(props: TreeProps<Value>) {
		this.#items = props.items;
		this.#selected = props.selected ?? new SvelteSet(props.defaultSelected);
		this.#expanded = props.expanded ?? new SvelteSet(props.defaultExpanded);
	}

	get selected(): SvelteSet<string> {
		return this.#selected;
	}

	get expanded(): SvelteSet<string> {
		return this.#expanded;
	}

	readonly #roots: Array<TreeNode<Value>> = $derived.by(() => {
		const items = unwrap(this.#items);
		const roots = $state(items.map((item, i) => new TreeNode(this, item, i)));
		return roots;
	});

	get roots(): ReadonlyArray<TreeNode<Value>> {
		return this.#roots;
	}

	readonly first: TreeNode<Value> | null = $derived.by(() => {
		if (this.roots.length === 0) {
			return null;
		}
		return this.roots[0];
	});

	readonly last: TreeNode<Value> | null = $derived.by(() => {
		if (this.roots.length === 0) {
			return null;
		}
		let last = this.roots.at(-1)!;
		while (last.expanded && last.children.length !== 0) {
			last = last.children.at(-1)!;
		}
		return last;
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
			const root = this.roots[i];
			yield* root.reversed();
		}
	}

	[Symbol.iterator](): Generator<TreeNode<Value>> {
		return this.iter();
	}
}

export class TreeNode<Value> {
	#tree: Tree<Value>;
	#id: string;
	value: Value = $state()!;
	levelIndex: number = $state()!; // TODO: make private when https://github.com/sveltejs/svelte/issues/13965 is fixed
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
		this.levelIndex = levelIndex;
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

	get parent(): TreeNode<Value> | null {
		return this.#parent;
	}

	get children(): ReadonlyArray<TreeNode<Value>> {
		return this.#children;
	}

	readonly #selected: boolean = $derived.by(() =>
		this.tree.selected.has(this.id),
	);

	get selected(): boolean {
		return this.#selected;
	}

	set selected(value: boolean) {
		if (value) {
			this.tree.selected.add(this.id);
		} else {
			this.tree.selected.delete(this.id);
		}
	}

	readonly #expanded: boolean = $derived.by(() =>
		this.tree.expanded.has(this.id),
	);

	get expanded(): boolean {
		return this.#expanded;
	}

	set expanded(value: boolean) {
		if (value) {
			this.tree.expanded.add(this.id);
		} else {
			this.tree.expanded.delete(this.id);
		}
	}

	readonly depth: number = $derived.by(() => {
		if (this.parent === null) {
			return 0;
		}
		return this.parent.depth + 1;
	});

	readonly level: ReadonlyArray<TreeNode<Value>> = $derived.by(() => {
		if (this.parent === null) {
			return this.#tree.roots;
		}
		return this.parent.children;
	});

	readonly previous: TreeNode<Value> | null = $derived.by(() => {
		if (this.levelIndex === 0) {
			return this.parent;
		}
		let current = this.level[this.levelIndex - 1];
		while (current.expanded && current.children.length !== 0) {
			current = current.children.at(-1)!;
		}
		return current;
	});

	readonly next: TreeNode<Value> | null = $derived.by(() => {
		if (this.expanded && this.children.length !== 0) {
			return this.children[0];
		}

		let current: TreeNode<Value> = this;
		while (true) {
			const nextSiblingIndex = current.levelIndex + 1;
			if (nextSiblingIndex !== current.level.length) {
				return current.level[nextSiblingIndex];
			}
			if (current.parent === null) {
				return null;
			}
			current = current.parent;
		}
	});

	*all(): Generator<TreeNode<Value>> {
		yield this;
		for (const child of this.children) {
			yield* child.all();
		}
	}

	*iter(): Generator<TreeNode<Value>> {
		yield this;
		if (this.expanded) {
			for (const child of this.children) {
				yield* child.iter();
			}
		}
	}

	*reversed(): Generator<TreeNode<Value>> {
		if (this.expanded) {
			for (let i = this.children.length - 1; i >= 0; i--) {
				const child = this.children[i];
				yield* child.reversed();
			}
		}
		yield this;
	}

	[Symbol.iterator](): Generator<TreeNode<Value>> {
		return this.iter();
	}

	contains(node: TreeNode<Value>): boolean {
		let current = node;
		while (current.depth > this.depth) {
			current = current.#parent!;
		}
		return current === this;
	}

	#revalidateLevelIndex(
		level: Array<TreeNode<Value>>,
		start: number,
		end: number = level.length,
	): void {
		for (let i = start; i < end; i++) {
			const sibling = level[i];
			sibling.levelIndex = i;
		}
	}

	move(position: "before" | "after", target: TreeNode<Value>): void {
		let nextLevelIndex: number;
		switch (position) {
			case "before": {
				nextLevelIndex = target.levelIndex;
				break;
			}
			case "after": {
				nextLevelIndex = target.levelIndex + 1;
				break;
			}
		}

		const level = this.level as Array<TreeNode<Value>>;
		const targetLevel = target.level as Array<TreeNode<Value>>;
		if (level !== targetLevel) {
			// Remove this node from its level.
			level.splice(this.levelIndex, 1);
			this.#revalidateLevelIndex(level, this.levelIndex);

			// Insert this node to the target level.
			targetLevel.splice(nextLevelIndex, 0, this);
			this.#revalidateLevelIndex(targetLevel, nextLevelIndex);
			this.#parent = target.parent;
			return;
		}

		// Instead of removing and inserting the node back to the same level,
		// swap the nodes to achieve the same effect in a more efficient way.
		//
		// Case 1: The node is being moved to a position after itself.
		for (let i = this.levelIndex + 1; i < nextLevelIndex; i++) {
			const current = level[i];
			level[i - 1] = current;
			current.levelIndex = i - 1;
			level[i] = this;
			this.levelIndex = i;
		}
		// Case 2: The node is being moved to a position before itself.
		for (let i = this.levelIndex; i > nextLevelIndex; i--) {
			const previous = level[i - 1];
			level[i] = previous;
			previous.levelIndex = i;
			level[i - 1] = this;
			this.levelIndex = i - 1;
		}
	}
}
