import { SvelteSet } from "svelte/reactivity";

export type LinkedTreeItemData<TValue> = {
	id: string;
	value: TValue;
	children?: Iterable<LinkedTreeItemData<TValue>>;
};

export type LinkedTreeProps<TValue> = {
	items: Iterable<LinkedTreeItemData<TValue>>;
	expanded?: SvelteSet<string>;
	selected?: SvelteSet<string>;
	defaultExpanded?: Iterable<string>;
	defaultSelected?: Iterable<string>;
};

export class LinkedTree<TValue> {
	#items: LinkedTreeItemListState<TValue>;
	#expanded: SvelteSet<string>;
	#selected: SvelteSet<string>;

	constructor(props: LinkedTreeProps<TValue>) {
		this.#items = new LinkedTreeItemListState(this, props.items);
		this.#expanded = props.expanded ?? new SvelteSet(props.defaultExpanded);
		this.#selected = props.selected ?? new SvelteSet(props.defaultSelected);
	}

	get items() {
		return this.#items.list;
	}

	get expanded() {
		return this.#expanded;
	}

	get selected() {
		return this.#selected;
	}

	selectAll() {
		this.#selectAll(this.#items.head);
	}

	#selectAll(head: LinkedTreeItem<TValue> | undefined) {
		let current = head;
		while (current !== undefined) {
			this.selected.add(current.id);
			if (current.expanded) {
				this.#selectAll(current.children.head);
			}
			current = current.nextSibling;
		}
	}
}

export class LinkedTreeItemList<TValue> {
	#state: LinkedTreeItemListState<TValue>;

	/** @internal */
	constructor(state: LinkedTreeItemListState<TValue>) {
		this.#state = state;
	}

	get head() {
		return this.#state.head;
	}

	get tail() {
		return this.#state.tail;
	}

	get length() {
		return this.#state.length;
	}

	prepend(item: LinkedTreeItemData<TValue>) {
		return LinkedTreeItem.prepend(item, this.#state);
	}

	append(item: LinkedTreeItemData<TValue>) {
		return LinkedTreeItem.append(item, this.#state);
	}

	toArray() {
		const result: LinkedTreeItem<TValue>[] = Array(this.length);
		let current = this.head;
		for (let i = 0; current !== undefined; i++) {
			result[i] = current;
			current = current.nextSibling;
		}
		return result;
	}

	[Symbol.iterator](): Iterator<LinkedTreeItem<TValue>, void> {
		return new LinkedTreeItemListIterator(this.#state);
	}
}

class LinkedTreeItemListState<TValue> {
	#tree: LinkedTree<TValue>;
	#depth: number;
	#parent?: LinkedTreeItem<TValue>;

	constructor(
		tree: LinkedTree<TValue>,
		items: Iterable<LinkedTreeItemData<TValue>>,
		depth = 0,
		parent?: LinkedTreeItem<TValue>,
	) {
		this.#tree = tree;
		this.#depth = depth;
		this.#parent = parent;

		for (const item of items) {
			LinkedTreeItem.append(item, this);
		}
	}

	#list = new LinkedTreeItemList(this);
	head?: LinkedTreeItem<TValue> = $state.raw();
	tail?: LinkedTreeItem<TValue> = $state.raw();
	length = $state(0);

	get tree() {
		return this.#tree;
	}

	get depth() {
		return this.#depth;
	}

	get parent() {
		return this.#parent;
	}

	get list() {
		return this.#list;
	}
}

class LinkedTreeItemListIterator<TValue> {
	#value?: LinkedTreeItem<TValue>;

	constructor(state: LinkedTreeItemListState<TValue>) {
		this.#value = state.head;
	}

	next() {
		const value = this.#value;
		if (value === undefined) {
			return { done: true as const, value };
		}

		this.#value = value.nextSibling;
		return { value };
	}
}

export class LinkedTreeItem<TValue> {
	#tree: LinkedTree<TValue>;
	#id: string;
	#value: TValue = $state()!;
	#siblings: LinkedTreeItemListState<TValue> = $state.raw()!;
	#children: LinkedTreeItemListState<TValue>;

	/** @internal */
	constructor(
		siblings: LinkedTreeItemListState<TValue>,
		{ id, value, children = [] }: LinkedTreeItemData<TValue>,
	) {
		this.#tree = siblings.tree;
		this.#id = id;
		this.#value = value;
		this.#siblings = siblings;
		this.#children = new LinkedTreeItemListState(
			this.#tree,
			children,
			siblings.depth + 1,
			this,
		);
	}

	#previousSibling?: LinkedTreeItem<TValue> = $state.raw();
	#nextSibling?: LinkedTreeItem<TValue> = $state.raw();

	get id() {
		return this.#id;
	}

	get value() {
		return this.#value;
	}

	set value(value) {
		this.#value = value;
	}

	get depth() {
		return this.#siblings.depth;
	}

	get parent() {
		return this.#siblings.parent;
	}

	get siblings() {
		return this.#siblings.list;
	}

	get previousSibling() {
		return this.#previousSibling;
	}

	get nextSibling() {
		return this.#nextSibling;
	}

	get children() {
		return this.#children.list;
	}

	readonly #expanded = $derived.by(() => this.#tree.expanded.has(this.id));

	get expanded() {
		return this.#expanded;
	}

	set expanded(value) {
		if (value) {
			this.#tree.expanded.add(this.id);
		} else {
			this.#tree.expanded.delete(this.id);
		}
	}

	readonly #selected = $derived.by(() => this.#tree.selected.has(this.id));

	get selected() {
		return this.#selected;
	}

	set selected(value) {
		if (value) {
			this.#tree.selected.add(this.id);
		} else {
			this.#tree.selected.delete(this.id);
		}
	}

	expand() {
		this.#tree.expanded.add(this.id);
	}

	collapse() {
		this.#tree.expanded.delete(this.id);
	}

	select() {
		this.#tree.selected.add(this.id);
	}

	unselect() {
		this.#tree.selected.delete(this.id);
	}

	contains(item: LinkedTreeItem<TValue>) {
		const { depth } = this;
		let current = item;
		while (current.depth > depth) {
			current = current.parent!;
		}
		return current === this;
	}

	insertBefore(item: LinkedTreeItemData<TValue>) {
		const inserted = new LinkedTreeItem(this.#siblings, item);
		inserted.#linkBefore(this);
		return inserted;
	}

	insertAfter(item: LinkedTreeItemData<TValue>) {
		const inserted = new LinkedTreeItem(this.#siblings, item);
		inserted.#linkAfter(this);
		return inserted;
	}

	moveBefore(sibling: LinkedTreeItem<TValue>) {
		if (this.contains(sibling)) {
			throw new Error("Cannot move an item before its descendant.");
		}

		this.#unlink();
		this.#siblings = sibling.#siblings;
		this.#linkBefore(sibling);
	}

	moveAfter(sibling: LinkedTreeItem<TValue>) {
		if (this.contains(sibling)) {
			throw new Error("Cannot move an item after its descendant.");
		}

		this.#unlink();
		this.#siblings = sibling.#siblings;
		this.#linkAfter(sibling);
	}

	prependTo(parent: LinkedTreeItem<TValue>) {
		if (this.contains(parent)) {
			throw new Error("Cannot move an item inside one of its descendants.");
		}

		this.#unlink();
		this.#siblings = parent.#children;
		this.#linkBeforeHead();
	}

	appendTo(parent: LinkedTreeItem<TValue>) {
		if (this.contains(parent)) {
			throw new Error("Cannot move an item inside one of its descendants.");
		}

		this.#unlink();
		this.#siblings = parent.#children;
		this.#linkAfterTail();
	}

	remove() {
		this.#unlink();
		this.#onRemoved();
	}

	#onRemoved() {
		this.#tree.selected.delete(this.id);
		this.#tree.expanded.delete(this.id);

		let current = this.#children.head;
		while (current !== undefined) {
			current.#onRemoved();
			current = current.nextSibling;
		}
	}

	#linkBefore(sibling: LinkedTreeItem<TValue>) {
		// previous ->      -> sibling
		// previous -> this -> sibling
		const siblings = sibling.#siblings;
		const { previousSibling } = sibling;

		this.#previousSibling = previousSibling;
		this.#nextSibling = sibling;
		siblings.length++;

		if (previousSibling !== undefined) {
			previousSibling.#setNextSibling(this);
		} else {
			// `sibling` is the head.
			siblings.head = this;
		}
		sibling.#setPreviousSibling(this);
	}

	#linkAfter(sibling: LinkedTreeItem<TValue>) {
		// sibling ->      -> next
		// sibling -> this -> next
		const siblings = sibling.#siblings;
		const { nextSibling } = sibling;

		this.#previousSibling = sibling;
		this.#nextSibling = nextSibling;
		siblings.length++;

		if (nextSibling !== undefined) {
			nextSibling.#setPreviousSibling(this);
		} else {
			// `sibling` is the tail.
			siblings.tail = this;
		}
		sibling.#setNextSibling(this);
	}

	#linkBeforeHead() {
		//         head
		// this -> head
		const siblings = this.#siblings;
		const { head } = siblings;

		this.#nextSibling = head;
		siblings.head = this;
		siblings.length++;

		if (head !== undefined) {
			head.#setPreviousSibling(this);
		} else {
			// `children` is empty.
			siblings.tail = this;
		}
	}

	#linkAfterTail() {
		// tail
		// tail -> this
		const siblings = this.#siblings;
		const { tail } = siblings;

		this.#previousSibling = tail;
		siblings.tail = this;
		siblings.length++;

		if (tail !== undefined) {
			tail.#setNextSibling(this);
		} else {
			// `children` is empty.
			siblings.head = this;
		}
	}

	#unlink() {
		// previous -> this -> next
		// previous ->      -> next
		const siblings = this.#siblings;
		const { previousSibling, nextSibling } = this;

		const removed = previousSibling === undefined && siblings.head !== this;
		if (removed) {
			return;
		}

		this.#previousSibling = undefined;
		this.#nextSibling = undefined;
		siblings.length--;

		if (previousSibling !== undefined) {
			previousSibling.#setNextSibling(nextSibling);
		} else {
			// `this` is the head.
			siblings.head = nextSibling;
		}

		if (nextSibling !== undefined) {
			nextSibling.#setPreviousSibling(previousSibling);
		} else {
			// `this` is the tail.
			siblings.tail = previousSibling;
		}
	}

	#setPreviousSibling(previousSibling: LinkedTreeItem<TValue> | undefined) {
		this.#previousSibling = previousSibling;
	}

	#setNextSibling(nextSibling: LinkedTreeItem<TValue> | undefined) {
		this.#nextSibling = nextSibling;
	}

	/** @internal */
	static prepend<TValue>(
		item: LinkedTreeItemData<TValue>,
		siblings: LinkedTreeItemListState<TValue>,
	) {
		const prepended = new LinkedTreeItem(siblings, item);
		prepended.#linkBeforeHead();
		return prepended;
	}

	/** @internal */
	static append<TValue>(
		item: LinkedTreeItemData<TValue>,
		siblings: LinkedTreeItemListState<TValue>,
	) {
		const appended = new LinkedTreeItem(siblings, item);
		appended.#linkAfterTail();
		return appended;
	}
}
