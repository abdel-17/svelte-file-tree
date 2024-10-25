import type { Tree, TreeNode } from "./tree.svelte.js";

export class TreeViewContext<Value = unknown> {
	#tree: () => Tree<Value>;
	tabbableId: string | undefined = $state();

	constructor(tree: () => Tree<Value>) {
		this.#tree = tree;
	}

	get tree(): Tree<Value> {
		return this.#tree();
	}

	static readonly key = Symbol("TreeViewContext");
}

export type TreeItemContextProps<Value = unknown> = {
	node: () => TreeNode<Value>;
	editing: () => boolean;
	onEditingChange: (value: boolean) => void;
};

export class TreeItemContext<Value = unknown> {
	readonly #node: () => TreeNode<Value>;
	readonly #editing: () => boolean;
	readonly #onEditingChange: (value: boolean) => void;

	constructor(props: TreeItemContextProps<Value>) {
		this.#node = props.node;
		this.#editing = props.editing;
		this.#onEditingChange = props.onEditingChange;
	}

	get node(): TreeNode<Value> {
		return this.#node();
	}

	get editing(): boolean {
		return this.#editing();
	}

	set editing(value: boolean) {
		this.#onEditingChange(value);
	}

	static readonly key = Symbol("TreeItemContext");
}
