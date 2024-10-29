import type { TreeNode } from "./tree.svelte.js";

export type TreeViewContextProps = {
	id: () => string;
};

export class TreeViewContext {
	#id: () => string;
	#tabbableId: string | undefined = $state();
	#previousTabbableId: string | undefined;

	constructor(props: TreeViewContextProps) {
		this.#id = props.id;
	}

	get id(): string {
		return this.#id();
	}

	get tabbableId(): string | undefined {
		return this.#tabbableId;
	}

	set tabbableId(value: string) {
		this.#previousTabbableId = this.#tabbableId;
		this.#tabbableId = value;
	}

	get previousTabbableId(): string | undefined {
		return this.#previousTabbableId;
	}

	getTreeElement(): HTMLElement | null {
		return document.getElementById(this.id);
	}

	getTreeItemElementId(nodeId: string): string {
		return `${this.id}:${nodeId}`;
	}

	getTreeItemElement(nodeId: string): HTMLElement | null {
		const elementId = this.getTreeItemElementId(nodeId);
		return document.getElementById(elementId);
	}

	static readonly key = Symbol("TreeViewContext");
}

export type TreeItemContextProps = {
	node: () => TreeNode<unknown>;
	editing: () => boolean;
	onEditingChange: (value: boolean) => void;
};

export class TreeItemContext {
	#node: () => TreeNode<unknown>;
	#editing: () => boolean;
	#onEditingChange: (value: boolean) => void;

	constructor(props: TreeItemContextProps) {
		this.#node = props.node;
		this.#editing = props.editing;
		this.#onEditingChange = props.onEditingChange;
	}

	get node(): TreeNode<unknown> {
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
