import { getContext, hasContext, setContext } from "svelte";
import type { LinkedTree, LinkedTreeItem } from "./tree.svelte.js";

export type TreeContextProps<TValue> = {
	tree: () => LinkedTree<TValue>;
	treeElement: () => HTMLDivElement | null;
};

export class TreeContext<TValue> {
	#tree: () => LinkedTree<TValue>;
	#treeElement: () => HTMLDivElement | null;

	constructor(props: TreeContextProps<TValue>) {
		this.#tree = props.tree;
		this.#treeElement = props.treeElement;
	}

	#id = crypto.randomUUID();
	#lookup = new Map<string, LinkedTreeItem<TValue>>();
	#tabbable: LinkedTreeItem<TValue> | undefined = $state.raw();
	dragged: LinkedTreeItem<TValue> | undefined = $state.raw();

	get tree() {
		return this.#tree();
	}

	get treeElement() {
		return this.#treeElement();
	}

	get lookup() {
		return this.#lookup;
	}

	get tabbable() {
		return this.#tabbable ?? this.tree.items.head;
	}

	set tabbable(value) {
		this.#tabbable = value;
	}

	treeItemElementId(id: string) {
		return `${this.#id}:${id}`;
	}

	treeItemElement(id: string) {
		const elementId = this.treeItemElementId(id);
		return document.getElementById(elementId);
	}

	static #key = Symbol("TreeContext");

	static get<TValue>(): TreeContext<TValue> {
		if (!hasContext(TreeContext.#key)) {
			throw new Error("No parent <Tree> component found.");
		}
		return getContext(TreeContext.#key);
	}

	static set<TValue>(props: TreeContextProps<TValue>) {
		const context = new TreeContext(props);
		return setContext(TreeContext.#key, context);
	}
}

export type TreeItemContextProps<TValue> = {
	context: TreeContext<TValue>;
	item: () => LinkedTreeItem<TValue>;
	editing: () => boolean;
	onEditingChange: (value: boolean) => void;
};

export class TreeItemContext<TValue> {
	#context: TreeContext<TValue>;
	#item: () => LinkedTreeItem<TValue>;
	#editing: () => boolean;
	#onEditingChange: (value: boolean) => void;

	constructor(props: TreeItemContextProps<TValue>) {
		this.#context = props.context;
		this.#item = props.item;
		this.#editing = props.editing;
		this.#onEditingChange = props.onEditingChange;
	}

	get item() {
		return this.#item();
	}

	get editing() {
		return this.#editing();
	}

	set editing(value) {
		this.#onEditingChange(value);
	}

	element() {
		return this.#context.treeItemElement(this.item.id);
	}

	static #key = Symbol("TreeItemContext");

	static get<TValue>(): TreeItemContext<TValue> {
		if (!hasContext(TreeItemContext.#key)) {
			throw new Error("No parent <TreeItem> component found.");
		}
		return getContext(TreeItemContext.#key);
	}

	static set<TValue>(props: TreeItemContextProps<TValue>) {
		const context = new TreeItemContext(props);
		return setContext(TreeItemContext.#key, context);
	}
}
