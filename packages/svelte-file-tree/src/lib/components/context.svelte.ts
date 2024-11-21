import { getContext, hasContext, setContext } from "svelte";
import type { LinkedTree, LinkedTreeItem } from "./tree.svelte.js";

export type TreeContextProps = {
	tree: () => LinkedTree;
	treeElement: () => HTMLDivElement | null;
};

export class TreeContext {
	#tree: () => LinkedTree;
	#treeElement: () => HTMLDivElement | null;

	constructor(props: TreeContextProps) {
		this.#tree = props.tree;
		this.#treeElement = props.treeElement;
	}

	#id = crypto.randomUUID();
	#lookup = new Map<string, LinkedTreeItem>();
	#tabbable: LinkedTreeItem | undefined = $state.raw();
	dragged: LinkedTreeItem | undefined = $state.raw();

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

	static get(): TreeContext {
		if (!hasContext(TreeContext.#key)) {
			throw new Error("No parent <Tree> component found.");
		}
		return getContext(TreeContext.#key);
	}

	static set(props: TreeContextProps) {
		const context = new TreeContext(props);
		return setContext(TreeContext.#key, context);
	}
}

export type TreeItemContextProps = {
	context: TreeContext;
	item: () => LinkedTreeItem;
	editing: () => boolean;
	onEditingChange: (value: boolean) => void;
};

export class TreeItemContext {
	#context: TreeContext;
	#item: () => LinkedTreeItem;
	#editing: () => boolean;
	#onEditingChange: (value: boolean) => void;

	constructor(props: TreeItemContextProps) {
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

	static get(): TreeItemContext {
		if (!hasContext(TreeItemContext.#key)) {
			throw new Error("No parent <TreeItem> component found.");
		}
		return getContext(TreeItemContext.#key);
	}

	static set(props: TreeItemContextProps) {
		const context = new TreeItemContext(props);
		return setContext(TreeItemContext.#key, context);
	}
}
