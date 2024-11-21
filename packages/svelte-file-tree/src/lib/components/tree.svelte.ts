import { SvelteSet } from "svelte/reactivity";

export type LinkedTreeItemData = {
	id: string;
	name: string;
	children?: Iterable<LinkedTreeItemData>;
};

export type LinkedTreeProps = {
	items: Iterable<LinkedTreeItemData>;
	expanded?: SvelteSet<string>;
	selected?: SvelteSet<string>;
	defaultExpanded?: Iterable<string>;
	defaultSelected?: Iterable<string>;
};

export class LinkedTree {
	#items: LinkedTreeItemListImpl;
	#expanded: SvelteSet<string>;
	#selected: SvelteSet<string>;

	constructor(props: LinkedTreeProps) {
		this.#items = new LinkedTreeItemListImpl(this, props.items);
		this.#expanded = props.expanded ?? new SvelteSet(props.defaultExpanded);
		this.#selected = props.selected ?? new SvelteSet(props.defaultSelected);
	}

	get items(): LinkedTreeItemList {
		return this.#items;
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

	#selectAll(head: LinkedTreeItem | undefined) {
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

export interface LinkedTreeItemList {
	readonly parent?: LinkedTreeItem;
	readonly depth: number;
	readonly head?: LinkedTreeItem;
	readonly tail?: LinkedTreeItem;
	readonly length: number;
	prepend(item: LinkedTreeItemData): LinkedTreeItem;
	append(item: LinkedTreeItemData): LinkedTreeItem;
	containsId(id: string): boolean;
	containsName(name: string): boolean;
	toArray(): LinkedTreeItem[];
	[Symbol.iterator](): Iterator<LinkedTreeItem, void>;
}

class LinkedTreeItemListImpl implements LinkedTreeItemList {
	#tree: LinkedTree;
	#depth: number;
	#parent?: LinkedTreeItem;

	constructor(
		tree: LinkedTree,
		items: Iterable<LinkedTreeItemData>,
		parent?: LinkedTreeItem,
	) {
		this.#tree = tree;
		this.#depth = parent !== undefined ? parent.depth + 1 : 0;
		this.#parent = parent;

		for (const item of items) {
			LinkedTreeItem.append(item, this);
		}
	}

	head?: LinkedTreeItem = $state.raw();
	tail?: LinkedTreeItem = $state.raw();
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

	prepend(item: LinkedTreeItemData) {
		return LinkedTreeItem.prepend(item, this);
	}

	append(item: LinkedTreeItemData) {
		return LinkedTreeItem.append(item, this);
	}

	toArray() {
		const result: LinkedTreeItem[] = Array(this.length).fill(null);
		let current = this.head;
		for (let i = 0; current !== undefined; i++) {
			result[i] = current;
			current = current.nextSibling;
		}
		return result;
	}

	[Symbol.iterator]() {
		return new LinkedTreeItemListIterator(this);
	}
}

class LinkedTreeItemListIterator {
	#value?: LinkedTreeItem;

	constructor(state: LinkedTreeItemListImpl) {
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

export class LinkedTreeItem {
	#tree: LinkedTree;
	#id: string;
	name: string = $state.raw()!;
	#siblings: LinkedTreeItemListImpl = $state.raw()!;
	#children: LinkedTreeItemListImpl;

	/** @internal */
	constructor(
		siblings: LinkedTreeItemListImpl,
		{ id, name, children = [] }: LinkedTreeItemData,
	) {
		this.#tree = siblings.tree;
		this.#id = id;
		this.name = name;
		this.#siblings = siblings;
		this.#children = new LinkedTreeItemListImpl(this.#tree, children, this);
	}

	#previousSibling?: LinkedTreeItem = $state.raw();
	#nextSibling?: LinkedTreeItem = $state.raw();

	get id() {
		return this.#id;
	}

	get depth() {
		return this.#siblings.depth;
	}

	get parent() {
		return this.#siblings.parent;
	}

	get siblings(): LinkedTreeItemList {
		return this.#siblings;
	}

	get previousSibling() {
		return this.#previousSibling;
	}

	get nextSibling() {
		return this.#nextSibling;
	}

	get children(): LinkedTreeItemList {
		return this.#children;
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

	contains(item: LinkedTreeItem) {
		const { depth } = this;
		let current = item;
		while (current.depth > depth) {
			current = current.parent!;
		}
		return current === this;
	}

	insertBefore(item: LinkedTreeItemData) {
		const inserted = new LinkedTreeItem(this.#siblings, item);
		inserted.#linkBefore(this);
		return inserted;
	}

	insertAfter(item: LinkedTreeItemData) {
		const inserted = new LinkedTreeItem(this.#siblings, item);
		inserted.#linkAfter(this);
		return inserted;
	}

	moveBefore(sibling: LinkedTreeItem) {
		if (this.contains(sibling)) {
			throw new Error("Cannot move an item before its descendant.");
		}

		this.#unlink();
		this.#siblings = sibling.#siblings;
		this.#linkBefore(sibling);
	}

	moveAfter(sibling: LinkedTreeItem) {
		if (this.contains(sibling)) {
			throw new Error("Cannot move an item after its descendant.");
		}

		this.#unlink();
		this.#siblings = sibling.#siblings;
		this.#linkAfter(sibling);
	}

	prependTo(parent: LinkedTreeItem) {
		if (this.contains(parent)) {
			throw new Error("Cannot move an item inside one of its descendants.");
		}

		this.#unlink();
		this.#siblings = parent.#children;
		this.#linkBeforeHead();
	}

	appendTo(parent: LinkedTreeItem) {
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

	#linkBefore(sibling: LinkedTreeItem) {
		// previous ->      -> sibling
		// previous -> this -> sibling
		const siblings = sibling.#siblings;
		const { previousSibling } = sibling;

		this.#previousSibling = previousSibling;
		this.#nextSibling = sibling;
		siblings.length++;

		if (previousSibling !== undefined) {
			previousSibling.#nextSibling = this;
		} else {
			// `sibling` is the head.
			siblings.head = this;
		}
		sibling.#previousSibling = this;
	}

	#linkAfter(sibling: LinkedTreeItem) {
		// sibling ->      -> next
		// sibling -> this -> next
		const siblings = sibling.#siblings;
		const { nextSibling } = sibling;

		this.#previousSibling = sibling;
		this.#nextSibling = nextSibling;
		siblings.length++;

		if (nextSibling !== undefined) {
			nextSibling.#previousSibling = this;
		} else {
			// `sibling` is the tail.
			siblings.tail = this;
		}
		sibling.#nextSibling = this;
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
			head.#previousSibling = this;
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
			tail.#nextSibling = this;
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
			previousSibling.#nextSibling = nextSibling;
		} else {
			// `this` is the head.
			siblings.head = nextSibling;
		}

		if (nextSibling !== undefined) {
			nextSibling.#previousSibling = previousSibling;
		} else {
			// `this` is the tail.
			siblings.tail = previousSibling;
		}
	}

	/** @internal */
	static prepend(item: LinkedTreeItemData, siblings: LinkedTreeItemListImpl) {
		const prepended = new LinkedTreeItem(siblings, item);
		prepended.#linkBeforeHead();
		return prepended;
	}

	/** @internal */
	static append(item: LinkedTreeItemData, siblings: LinkedTreeItemListImpl) {
		const appended = new LinkedTreeItem(siblings, item);
		appended.#linkAfterTail();
		return appended;
	}
}
