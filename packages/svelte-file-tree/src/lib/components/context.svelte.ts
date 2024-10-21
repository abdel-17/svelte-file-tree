import { findElementById } from "$lib/helpers/dom.js";
import type { TreeNode } from "./tree.svelte.js";

export class TreeViewContext {
	readonly #id: () => string;
	tabbableId: string | undefined = $state();
	selectOnNextFocusEnter = true;
	clearSelectionOnNextFocusLeave = true;

	constructor(id: () => string) {
		this.#id = id;
	}

	get id(): string {
		return this.#id();
	}

	findTreeElement(): HTMLElement {
		return findElementById(this.id);
	}

	getTreeItemElementId(nodeId: string): string {
		return `${this.id}:${nodeId}`;
	}

	findTreeItemElement(nodeId: string): HTMLElement {
		return findElementById(this.getTreeItemElementId(nodeId));
	}

	static readonly key = Symbol("TreeViewContext");
}

export class TreeItemContext<Value = unknown> {
	readonly #treeContext: TreeViewContext;
	readonly #node: () => TreeNode<Value>;
	readonly #editing: () => boolean;
	readonly #onEditingChange: (value: boolean) => void;

	constructor(
		treeContext: TreeViewContext,
		node: () => TreeNode<Value>,
		editing: () => boolean,
		onEditingChange: (value: boolean) => void,
	) {
		this.#treeContext = treeContext;
		this.#node = node;
		this.#editing = editing;
		this.#onEditingChange = onEditingChange;
	}

	get node(): TreeNode<Value> {
		return this.#node();
	}

	get treeItemElementId(): string {
		return this.#treeContext.getTreeItemElementId(this.node.id);
	}

	get editing(): boolean {
		return this.#editing();
	}

	set editing(value: boolean) {
		this.#onEditingChange(value);
	}

	findTreeItemElement(): HTMLElement {
		return this.#treeContext.findTreeItemElement(this.node.id);
	}

	static readonly key = Symbol("TreeItemContext");
}
