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
	id?: MaybeGetter<string>;
	selected?: SvelteSet<string>;
	expanded?: SvelteSet<string>;
	defaultSelected?: Iterable<string>;
	defaultExpanded?: Iterable<string>;
};

export class Tree<Value> {
	#items: MaybeGetter<ReadonlyArray<TreeItem<Value>>>;
	#id: MaybeGetter<string>;
	#selected: SvelteSet<string>;
	#expanded: SvelteSet<string>;

	constructor(props: TreeProps<Value>) {
		this.#items = props.items;
		this.#id = props.id ?? crypto.randomUUID();
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
		const roots = $state(items.map((item) => new TreeNode(this, item)));
		return roots;
	});

	get roots(): ReadonlyArray<TreeNode<Value>> {
		return this.#roots;
	}

	readonly id: string = $derived.by(() => unwrap(this.#id));

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
			const root = this.roots[i]!;
			yield* root.reversed();
		}
	}

	[Symbol.iterator](): Generator<TreeNode<Value>> {
		return this.iter();
	}

	getElement(): HTMLElement | null {
		return document.getElementById(this.id);
	}

	getTreeItemElementId(id: string): string {
		return `${this.id}:${id}`;
	}

	getTreeItemElement(id: string): HTMLElement | null {
		const elementId = this.getTreeItemElementId(id);
		return document.getElementById(elementId);
	}
}

export class TreeNode<Value> {
	#tree: Tree<Value>;
	#id: string;
	value: Value = $state()!;
	#parent: TreeNode<Value> | null = $state()!;
	#children: Array<TreeNode<Value>> = $state()!;

	constructor(
		tree: Tree<Value>,
		item: TreeItem<Value>,
		parent: TreeNode<Value> | null = null,
	) {
		this.#tree = tree;
		this.#id = item.id;
		this.value = item.value;
		this.#parent = parent;
		this.#children =
			item.children?.map((child) => new TreeNode(tree, child, this)) ?? [];
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

	readonly elementId: string = $derived.by(() =>
		this.#tree.getTreeItemElementId(this.id),
	);

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
				const child = this.children[i]!;
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

	getElement(): HTMLElement | null {
		return document.getElementById(this.elementId);
	}
}
